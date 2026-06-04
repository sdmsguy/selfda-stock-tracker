import type { Candle } from './kiteApi';

export interface StrategyResult { name: string; signal: 'BUY'|'SELL'|'HOLD'; confidence: number; reason: string; }
export interface Analysis { overall: 'BUY'|'SELL'|'HOLD'; confidence: number; strategies: StrategyResult[]; target: number; stopLoss: number; riskReward: number; summary: string; }

function sma(d: number[], p: number): (number|null)[] { return d.map((_,i) => i<p-1?null:d.slice(i-p+1,i+1).reduce((a,b)=>a+b,0)/p); }
function ema(d: number[], p: number): (number|null)[] {
  const k=2/(p+1), r:(number|null)[]=new Array(d.length).fill(null);
  r[p-1]=d.slice(0,p).reduce((a,b)=>a+b,0)/p;
  for(let i=p;i<d.length;i++) r[i]=d[i]*k+(r[i-1] as number)*(1-k);
  return r;
}
function rsi(c: number[], p=14): (number|null)[] {
  const o:(number|null)[]=new Array(c.length).fill(null); if(c.length<=p) return o;
  let g=0,l=0;
  for(let i=1;i<=p;i++){const d=c[i]-c[i-1]; if(d>0)g+=d; else l-=d;} g/=p;l/=p;
  o[p]=l===0?100:100-100/(1+g/l);
  for(let i=p+1;i<c.length;i++){const d=c[i]-c[i-1];g=(g*(p-1)+(d>0?d:0))/p;l=(l*(p-1)+(d<0?-d:0))/p;o[i]=l===0?100:100-100/(1+g/l);}
  return o;
}
function atr(candles: Candle[], p=14): number {
  if(candles.length<p+1)return 0; let s=0; const last=candles.slice(-(p+1));
  for(let i=1;i<last.length;i++) s+=Math.max(last[i].high-last[i].low,Math.abs(last[i].high-last[i-1].close),Math.abs(last[i].low-last[i-1].close));
  return s/p;
}

export function analyze(candles: Candle[], price: number): Analysis {
  if(candles.length<55) return {overall:'HOLD',confidence:0,strategies:[{name:'Data',signal:'HOLD',confidence:0,reason:'Need ≥55 candles'}],target:price,stopLoss:price,riskReward:0,summary:'Not enough data.'};
  const cl=candles.map(c=>c.close), vol=candles.map(c=>c.volume), n=cl.length;
  const s20=sma(cl,20),s50=sma(cl,50),e12=ema(cl,12),e26=ema(cl,26),rv=rsi(cl,14);
  const macd:(number|null)[]=e12.map((v,i)=>v!==null&&e26[i]!==null?v-(e26[i] as number):null);
  const mv=macd.filter(v=>v!==null) as number[]; const sr=ema(mv,9);
  const fi=macd.findIndex(v=>v!==null); const ms:(number|null)[]=new Array(n).fill(null);
  sr.forEach((v,i)=>{if(v!==null)ms[fi+i]=v;});
  const bbu:(number|null)[]=new Array(n).fill(null),bbl:(number|null)[]=new Array(n).fill(null);
  for(let i=19;i<n;i++){const sl=cl.slice(i-19,i+1),m=sl.reduce((a,b)=>a+b,0)/20,sd=Math.sqrt(sl.reduce((a,b)=>a+(b-m)**2,0)/20);bbu[i]=m+2*sd;bbl[i]=m-2*sd;}

  const st: StrategyResult[]=[];
  // MA Crossover
  {const a=s20[n-1],b=s50[n-1],pa=s20[n-2],pb=s50[n-2];
   if(a!==null&&b!==null&&pa!==null&&pb!==null){
    if(pa<=pb&&a>b) st.push({name:'MA Crossover',signal:'BUY',confidence:88,reason:'Golden Cross — SMA20 crossed above SMA50'});
    else if(pa>=pb&&a<b) st.push({name:'MA Crossover',signal:'SELL',confidence:85,reason:'Death Cross — SMA20 crossed below SMA50'});
    else if(price>a&&a>b) st.push({name:'MA Crossover',signal:'BUY',confidence:66,reason:'Bullish alignment: Price > SMA20 > SMA50'});
    else if(price<a&&a<b) st.push({name:'MA Crossover',signal:'SELL',confidence:64,reason:'Bearish alignment: Price < SMA20 < SMA50'});
    else st.push({name:'MA Crossover',signal:'HOLD',confidence:50,reason:'No clear MA trend'});
  }}
  // RSI
  {const r=rv[n-1]; if(r!==null){
    if(r<25) st.push({name:'RSI',signal:'BUY',confidence:90,reason:`RSI ${r.toFixed(1)} — deeply oversold`});
    else if(r<30) st.push({name:'RSI',signal:'BUY',confidence:76,reason:`RSI ${r.toFixed(1)} — oversold`});
    else if(r<40) st.push({name:'RSI',signal:'BUY',confidence:58,reason:`RSI ${r.toFixed(1)} — nearing oversold`});
    else if(r>80) st.push({name:'RSI',signal:'SELL',confidence:88,reason:`RSI ${r.toFixed(1)} — extremely overbought`});
    else if(r>70) st.push({name:'RSI',signal:'SELL',confidence:74,reason:`RSI ${r.toFixed(1)} — overbought`});
    else if(r>60) st.push({name:'RSI',signal:'SELL',confidence:54,reason:`RSI ${r.toFixed(1)} — nearing overbought`});
    else st.push({name:'RSI',signal:'HOLD',confidence:50,reason:`RSI ${r.toFixed(1)} — neutral`});
  }}
  // MACD
  {const m=macd[n-1],s=ms[n-1],pm=macd[n-2],ps=ms[n-2];
   if(m!==null&&s!==null&&pm!==null&&ps!==null){
    if(pm<=ps&&m>s) st.push({name:'MACD',signal:'BUY',confidence:82,reason:'Bullish MACD crossover'});
    else if(pm>=ps&&m<s) st.push({name:'MACD',signal:'SELL',confidence:80,reason:'Bearish MACD crossover'});
    else if(m-s>0&&m-s>pm-ps) st.push({name:'MACD',signal:'BUY',confidence:62,reason:'MACD histogram expanding up'});
    else if(m-s<0&&m-s<pm-ps) st.push({name:'MACD',signal:'SELL',confidence:60,reason:'MACD histogram expanding down'});
    else st.push({name:'MACD',signal:'HOLD',confidence:50,reason:'No MACD directional signal'});
  }}
  // Bollinger
  {const u=bbu[n-1],l=bbl[n-1]; if(u!==null&&l!==null){
    const p=(price-l)/(u-l);
    if(p<0.05) st.push({name:'Bollinger',signal:'BUY',confidence:84,reason:'Price at lower band — bounce expected'});
    else if(p<0.2) st.push({name:'Bollinger',signal:'BUY',confidence:68,reason:'Price near lower band'});
    else if(p>0.95) st.push({name:'Bollinger',signal:'SELL',confidence:82,reason:'Price at upper band — pullback likely'});
    else if(p>0.8) st.push({name:'Bollinger',signal:'SELL',confidence:64,reason:'Price near upper band'});
    else st.push({name:'Bollinger',signal:'HOLD',confidence:50,reason:`Price at ${(p*100).toFixed(0)}% of band`});
  }}
  // Volume
  {const a30=vol.slice(-30).reduce((a,b)=>a+b,0)/30,cv=vol[n-1],r=cv/a30,up=cl[n-1]>cl[n-2];
   if(r>2&&up) st.push({name:'Volume',signal:'BUY',confidence:79,reason:`Volume ${r.toFixed(1)}× avg with price rising`});
   else if(r>2&&!up) st.push({name:'Volume',signal:'SELL',confidence:77,reason:`Volume ${r.toFixed(1)}× avg with price falling`});
   else if(r>1.5&&up) st.push({name:'Volume',signal:'BUY',confidence:63,reason:'Above-avg volume confirms upward move'});
   else st.push({name:'Volume',signal:'HOLD',confidence:50,reason:`Volume ${r.toFixed(1)}× avg`});
  }
  // Momentum
  {const m5=(cl[n-1]-cl[n-6])/cl[n-6]*100,m10=(cl[n-1]-cl[n-11])/cl[n-11]*100,m20=(cl[n-1]-cl[n-21])/cl[n-21]*100;
   const c=m5*0.5+m10*0.3+m20*0.2;
   if(c>5) st.push({name:'Momentum',signal:'BUY',confidence:78,reason:`Strong bullish +${c.toFixed(1)}%`});
   else if(c>2) st.push({name:'Momentum',signal:'BUY',confidence:62,reason:`Positive momentum +${c.toFixed(1)}%`});
   else if(c<-5) st.push({name:'Momentum',signal:'SELL',confidence:76,reason:`Strong bearish ${c.toFixed(1)}%`});
   else if(c<-2) st.push({name:'Momentum',signal:'SELL',confidence:60,reason:`Negative momentum ${c.toFixed(1)}%`});
   else st.push({name:'Momentum',signal:'HOLD',confidence:50,reason:`Neutral ${c.toFixed(1)}%`});
  }
  // Support/Resistance
  {const sorted=[...cl.slice(-60)].sort((a,b)=>a-b),sup=sorted[Math.floor(sorted.length*0.1)],res=sorted[Math.floor(sorted.length*0.9)],p=(price-sup)/(res-sup);
   if(p<0.15) st.push({name:'S/R Levels',signal:'BUY',confidence:76,reason:`Near support ₹${sup.toFixed(0)}`});
   else if(p>0.85) st.push({name:'S/R Levels',signal:'SELL',confidence:74,reason:`Near resistance ₹${res.toFixed(0)}`});
   else st.push({name:'S/R Levels',signal:'HOLD',confidence:50,reason:`Mid-range ₹${sup.toFixed(0)}–₹${res.toFixed(0)}`});
  }

  let bw=0,sw=0,tw=0;
  for(const s of st){tw++;if(s.signal==='BUY')bw+=s.confidence;else if(s.signal==='SELL')sw+=s.confidence;}
  bw/=tw;sw/=tw;
  let overall:'BUY'|'SELL'|'HOLD',conf:number;
  if(bw>sw&&bw>45){overall='BUY';conf=Math.min(Math.round(bw),97);}
  else if(sw>bw&&sw>45){overall='SELL';conf=Math.min(Math.round(sw),97);}
  else{overall='HOLD';conf=Math.round(50+Math.abs(bw-sw)/2);}
  const a=atr(candles);
  const tgt=overall==='BUY'?+(price+a*2.5).toFixed(2):overall==='SELL'?+(price-a*2.5).toFixed(2):price;
  const sl=overall==='BUY'?+(price-a*1.5).toFixed(2):overall==='SELL'?+(price+a*1.5).toFixed(2):+(price*0.97).toFixed(2);
  const rr=+( Math.abs(tgt-price)/Math.max(0.01,Math.abs(sl-price)) ).toFixed(2);
  const bc=st.filter(s=>s.signal==='BUY').length,sc=st.filter(s=>s.signal==='SELL').length;
  const summary=overall==='BUY'?`${bc}/${st.length} strategies bullish (${conf}%). Target ₹${tgt}, SL ₹${sl}.`
    :overall==='SELL'?`${sc}/${st.length} strategies bearish (${conf}%). Target ₹${tgt}, SL ₹${sl}.`
    :`Mixed — ${bc} bullish, ${sc} bearish. Wait for clarity.`;
  return {overall,confidence:conf,strategies:st,target:tgt,stopLoss:sl,riskReward:rr,summary};
}

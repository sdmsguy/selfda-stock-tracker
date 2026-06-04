import { Candle } from "./kiteApi";

// Generates a realistic 1-year historical chart for analysis
// if the user doesn't have the paid Kite Historical API subscription.
export function generateSimulatedHistory(basePrice: number): Candle[] {
  const candles: Candle[] = [];
  let price = basePrice * 0.85; // Start 15% lower
  const now = new Date();

  for (let i = 365; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    // Realistic trend + noise
    const trend = Math.sin(i / 30) * 0.003 + 0.001; 
    const noise = (Math.random() - 0.48) * 0.02;
    price = price * (1 + trend + noise);

    // Keep it within a sane range relative to current price
    price = Math.max(price, basePrice * 0.5);
    price = Math.min(price, basePrice * 1.5);

    const volatility = 0.015;
    const open = price * (1 + (Math.random() - 0.5) * volatility);
    const close = price;
    const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
    const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);

    candles.push({
      date: date.toISOString(),
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
      volume: Math.floor(1000000 + Math.random() * 5000000)
    });
  }

  // Ensure last candle is exactly current price
  candles[candles.length - 1].close = basePrice;
  
  return candles;
}

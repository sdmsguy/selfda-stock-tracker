# Selfda - Premium AI Trading Intelligence

Selfda is a high-performance, aesthetically pleasing AI-powered stock tracking dashboard designed for modern traders. It integrates with the Kite Connect API to provide real-time portfolio tracking, historical analysis, and AI-driven strategic insights.

![Selfda Dashboard](https://images.unsplash.com/photo-1611974717484-7da00ff12990?auto=format&fit=crop&q=80&w=1000)

## ✨ Features

- **Premium Dashboard**: A modern, high-contrast UI with glassmorphism and smooth animations.
- **AI Strategy Engine**: Deep historical analysis of your holdings with target prices, stop-loss recommendations, and confidence scores.
- **Portfolio Intelligence**: Real-time tracking of P&L, asset allocation, and top performers.
- **Market Pulse**: Global market sentiment and index tracking (NIFTY 50, SENSEX, etc.).
- **Secure Auth**: OAuth 2.0 integration with Kite Connect.

## 🚀 Local Deployment

Follow these steps to get Selfda running on your personal machine.

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Kite Connect API Credentials**: You need an API Key and API Secret from the [Kite Developer Console](https://kite.trade/).
- **CORS Proxy**: Since this is a client-side app, you'll need a CORS proxy (like a Cloudflare Worker or a local proxy) to communicate with Kite APIs.

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/selfda-stock-tracker.git
cd selfda-stock-tracker
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Redirect URL

1. Go to your [Kite Developer Console](https://kite.trade/apps).
2. Select your app.
3. Set the **Redirect URL** to: `http://localhost/` (or the port your Vite server uses).

### 4. Start the Development Server

```bash
npm run dev
```

The app will typically be available at `http://localhost`.

### 5. Login & Authorize

1. Open the app in your browser.
2. Enter your **CORS Proxy URL**, **Kite API Key**, and **Kite API Secret**.
3. Click **Authorize with Kite**.
4. You will be redirected to Kite to login, and then back to Selfda with your live portfolio data.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide Icons
- **Charts**: Recharts
- **State Management**: Zustand

## 📄 License

MIT License - feel free to use and modify for personal use.

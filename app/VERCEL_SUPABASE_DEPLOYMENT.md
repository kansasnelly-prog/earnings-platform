# 🚀 Complete Deployment & Integration Guide: GitHub + Vercel + Supabase

Follow this step-by-step guide to take full control of your **Executive Web2/Web3 Solana Paradise Platform**.

---

## 📁 Repository Structure Created for You

The following standalone files have been created in your workspace:

| File Path | Description |
|---|---|
| `/index.html` | **Standalone Single-Page Application (SPA)** with Solana Wallet binder, 2-Hour Token Drip Vault, Master Cinema Safe Pot ($0.10/min yield -> $50 alert), and Token Exchanger. Ready to host on Vercel or GitHub Pages! |
| `/supabase_schema.sql` | **Complete SQL Database Schema** for Supabase (`users`, `cinema_safe_pot`, `drip_claims`, `token_swaps`). |
| `/api/supabase-sync.js` | **Vercel Serverless Function** connecting your Web App to Supabase & Telegram Bot API for real-time alerts. |

---

## 🛠️ STEP 1: Set Up Supabase Database (Free Cloud SQL)

1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. Click **New Project** -> enter project name (e.g. `solana-telegram-hub`) & password -> click **Create New Project**.
3. In the left navigation menu, click **SQL Editor** -> click **New Query**.
4. Copy the entire contents of `/supabase_schema.sql` and paste it into the editor.
5. Click **Run**. All database tables (`users`, `cinema_safe_pot`, `drip_claims`, `token_swaps`) will be created instantly.
6. In Supabase, go to **Project Settings** -> **API**:
   - Copy your **Project URL** (e.g. `https://xxxx.supabase.co`)
   - Copy your **`service_role` Secret Key** (used for Vercel serverless integration).

---

## 🌐 STEP 2: Deploy to GitHub & Vercel

### Option A: Via GitHub (Recommended)
1. Push this workspace code to a new GitHub Repository (e.g., `github.com/your-username/solana-telegram-hub`).
2. Go to [https://vercel.com](https://vercel.com) and click **Add New** -> **Project**.
3. Select your GitHub Repository and click **Import**.
4. In the **Environment Variables** section, add the following 3 variables:
   - `SUPABASE_URL`: `https://xxxx.supabase.co` (from Supabase API Settings)
   - `SUPABASE_SERVICE_ROLE_KEY`: `your-service-role-key` (from Supabase API Settings)
   - `TELEGRAM_BOT_TOKEN`: `your-bot-token` (from @BotFather)
5. Click **Deploy**. Vercel will build your static `index.html` and deploy `/api/supabase-sync.js` serverless function.

---

## 🤖 STEP 3: Connect Telegram Bot (@OnlineCustomerOptimizeTasksBot)

1. Open Telegram and search for `@BotFather`.
2. Send command: `/mybots` -> Select `@OnlineCustomerOptimizeTasksBot`.
3. Click **Bot Settings** -> **Menu Button** -> **Configure Menu Button**.
4. Set the Web App URL to your new Vercel deployment link (e.g. `https://solana-telegram-hub.vercel.app`).
5. Now, whenever any user or admin opens your Telegram Bot or Mini App, they will see your live platform hosted on Vercel!

---

## 👑 MASTER OWNER PRIVILEGES & REVENUE ENGINE

- **$0.10 / Min Cinema Safe Pot**: Auto-accumulates viewing fees in real-time.
- **$50.00 Automated Notification**: As soon as the safe pot hits $50.00, an instant visual alert banner triggers, sending a notification to your Telegram Bot.
- **Master Solana Wallet Sweeper**: Sweep safe pot earnings or 2-hour token drops directly into your bound Solana SPL address.
- **Instant Solana Token Exchanger**: Swap EXECTOKEN, Cinema Pot USD, or TG Stars into SOL/USDT SPL tokens instantly!

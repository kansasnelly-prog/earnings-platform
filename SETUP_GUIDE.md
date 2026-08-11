# Complete Setup Guide - Earnings Platform

## ✅ What's Already Built

Your system now includes:

1. **Database Schema** - Complete with all tables
2. **6× Profit Training System** - Fully functional
3. **User Registration/Login** - Ready to use
4. **Admin Panel** - With Pending Orders management
5. **Customer Service** - With Telegram integration
6. **Training Tasks** - 45 tasks created on signup

---

## 🚀 Quick Start Steps

### Step 1: Apply Final Database Setup

Run this SQL in Supabase SQL Editor:

```sql
-- File: supabase/FINAL_SETUP.sql
-- Contains:
-- - All tables (users, tasks, transactions, etc.)
-- - 6× profit functions
-- - Admin function to clear pending orders
-- - RLS policies
-- - Default admin user
```

**To execute:**
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/FINAL_SETUP.sql`
3. Run the SQL
4. Should show: "✅ Final database setup completed!"

---

### Step 2: Configure Environment Variables

Create `.env` file in project root:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Telegram (optional - for customer service)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
CS_BOT_TOKEN=your_cs_bot_token
CS_CHAT_ID=your_cs_chat_id
```

---

### Step 3: Deploy the Application

**Option A: Deploy to Vercel (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Option B: Deploy to Netlify**
```bash
# Build first
npm run build

# Deploy dist folder to Netlify
```

---

### Step 4: Set Up Telegram Webhook (Optional)

After deployment, set up Telegram webhook:

```bash
# Using the setup script
node setup-telegram-webhook.cjs <BOT_TOKEN> <WEBHOOK_URL>

# Example:
node setup-telegram-webhook.cjs 123456:ABC-DEF... https://yourdomain.com/api/webhook
```

---

## 📊 6× Profit System Flow

### How It Works:

1. **User Completes Tasks** → Normal 1% profit per task
2. **Hits Combination Product** (Task 23 in Set 2) → Pending order triggered
3. **System Deducts Balance** → Shows negative balance
4. **User Contacts CS** → Via Telegram or chat widget
5. **Admin Clears Order** → Via Admin Panel → Pending Orders tab
6. **6× Profit Applied** → User gets: Pending Amount + (Pending × 6)

### Example:
```
Product Price: $200
Normal Profit: $2 (1%)
Combination Order: -$200 (deducted)
After Admin Clear: +$200 (returned) + $1,200 (6× profit)
Total Credit: $1,400
```

---

## 👤 User Registration Flow

1. User signs up with email/password
2. System creates user profile in `users` table
3. System creates 45 training tasks in `tasks` table
4. First task status = 'pending', others = 'locked'
5. User can start completing tasks immediately

---

## 🔐 Admin Panel Access

**URL:** `/admin` or `/admin-dashboard`

**Login:**
- Password: `admin2025`

**Features:**
- **Overview** - Platform statistics
- **Users** - Manage all users
- **Withdrawals** - Approve/reject withdrawals
- **Pending Orders** ⚠️ - Clear combination orders & apply 6× profit
- **Account Reset** - Reset user training
- **Tasks** - Task management
- **Settings** - Platform settings

---

## 📱 Customer Service Setup

### Telegram Integration:

1. Create a Telegram bot via @BotFather
2. Get bot token
3. Add to your `.env`:
   ```
   TELEGRAM_BOT_TOKEN=your_bot_token
   TELEGRAM_CHAT_ID=your_chat_id
   ```

4. Set up webhook after deployment

### Customer Service Flow:

1. User clicks "Customer Service" in app
2. Fills form with name, phone, message
3. Message sent to `/api/send-message`
4. Message appears in Telegram
5. Admin replies via Telegram
6. Reply appears in user's chat window

---

## 🔧 Troubleshooting

### Issue: "No rows returned" when running SQL
**Solution:** This is normal for CREATE statements. Check if tables exist in Table Editor.

### Issue: Registration not working
**Solution:** 
1. Check Supabase Auth settings (Auth → Settings)
2. Ensure "Enable Email Confirmations" is OFF for testing
3. Check browser console for errors

### Issue: Admin can't clear pending orders
**Solution:**
1. Ensure `admin_clear_pending_order` function exists in Supabase
2. Check that admin user has `account_type = 'admin'`
3. Verify RLS policies allow admin access

### Issue: Telegram messages not working
**Solution:**
1. Check bot token is correct
2. Verify webhook is set: `curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo`
3. Check Supabase Functions logs

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `supabase/FINAL_SETUP.sql` | Complete database setup |
| `src/components/admin/PendingOrdersManager.tsx` | Admin pending orders UI |
| `src/components/CombinationOrderModal.tsx` | User pending order modal |
| `src/services/supabaseService.ts` | All database operations |
| `src/contexts/AppContext.tsx` | Global state management |
| `setup-telegram-webhook.cjs` | Telegram webhook setup |

---

## 🎯 Next Steps After Setup

1. ✅ Run `FINAL_SETUP.sql` in Supabase
2. ✅ Set environment variables
3. ✅ Deploy application
4. ✅ Test user registration
5. ✅ Complete tasks until combination product (task ~23)
6. ✅ Test pending order flow
7. ✅ Clear order via admin panel
8. ✅ Verify 6× profit applied

---

## 📞 Support

If issues arise:
1. Check browser console for errors
2. Check Supabase Logs (Database → Logs)
3. Check Edge Functions logs
4. Verify RLS policies are working

---

**Your platform is ready to go!** 🚀

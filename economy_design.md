# TikTok-Style Economy Design for EarningsLLC

This document outlines the revised architecture for the NellyCoin economy, matching TikTok's model.

## 1. Schema Design

### Coin & Gift Management
- `coin_packages` (id, name, price_usd, coin_amount, is_active)
- `gift_catalog` (id, name, coin_cost, category, image_url, is_active)

### Ledger & Wallets
- `user_coin_ledger` (id, user_id, type, amount, created_at, metadata)
- `creator_earnings_wallet` (id, creator_id, diamond_balance, usd_balance)
- `gift_transactions` (id, gift_id, sender_id, receiver_id, coin_cost, diamond_value, created_at)
- `platform_revenue_ledger` (id, type, amount_usd, metadata, created_at)

### Payout & Admin
- `payout_requests` (id, creator_id, amount_usd, status, created_at)
- `platform_config` (id, payout_rate_usd_per_diamond, min_withdrawal_usd, is_economy_enabled)

## 2. Workflows

### Gifting Workflow
1. **User sends gift**:
   - Deduct `coin_cost` from `user_coin_ledger` (Sender).
   - Insert into `gift_transactions`.
   - Update `creator_earnings_wallet` (Receiver) with calculated `diamond_value`.
   - Update `platform_revenue_ledger` with the platform's cut.

### Creator Payout Workflow
1. **Creator requests payout**:
   - Check `creator_earnings_wallet` balance >= `min_withdrawal_usd`.
   - Create `payout_requests` entry (status 'pending').
   - Deduct from `creator_earnings_wallet`.
2. **Admin approves payout**:
   - Update `payout_requests` (status 'paid').

## 3. Admin & Analytics
- **Admin Management Panel**: Tables for `coin_packages`, `gift_catalog`, `platform_config`.
- **Analytics Dashboard**: 
   - Daily Revenue (from `platform_revenue_ledger`).
   - Payout trends (from `payout_requests`).
   - Gift volume (from `gift_transactions`).

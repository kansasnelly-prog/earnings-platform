
# Schema Validation Report

## 1. Discrepancy Analysis
- **Discrepancy**: Migrations were drafted using `public.users(id)` while the codebase utilizes `public.profiles(id)` for user management.
- **Cause**: Incorrect assumption of the base user table during initial drafting.
- **Correction**: All future migrations MUST reference `public.profiles(id)` for user-related foreign keys.

## 2. Dependency Map

| Table | Dependency | FK Relationship |
| :--- | :--- | :--- |
| `profiles` | None (Central) | N/A |
| `gift_transactions` | `profiles` | `sender_id`, `recipient_id` |
| `creator_wallets` | `profiles` | `user_id` |
| `creator_diamond_transactions` | `profiles`, `creator_wallets` | `user_id`, `wallet_id` |
| `payout_requests` | `creator_wallets` | `wallet_id` |
| `payout_transactions` | `payout_requests`, `profiles` | `request_id`, `user_id` |
| `payout_channels` | `profiles` | `user_id` |
| `disputes` | `profiles` | `user_id` |
| `fraud_alerts` | `profiles` | `user_id` |

## 3. Validation Summary
- All economy tables depend on `public.profiles(id)`.
- No table should reference `public.users` if `public.profiles` is the intended base user table.
- Primary Keys: All tables use `UUID`.
- All ledger tables (`transactions`) are marked for RLS implementation with `SELECT`-only for users.

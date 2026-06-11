# TikTok6 Economy Technical Design Document

## 1. Coin Package Architecture
- **Purpose**: Defines standardized coin bundles users can purchase.
- **Data Flow**: Admin creates/updates in `public.coin_packages`. API reads for UI.
- **Security**: Admin-only write access via RLS.
- **Scaling**: Index `id`.

## 2. Coin Purchase Flow
- **Purpose**: Facilitate fiat currency to coin conversion.
- **Data Flow**: App initiates -> Payment Provider -> Webhook -> Backend inserts to `public.user_coin_transactions`.
- **Security**: Webhook signature verification mandatory (using shared secrets).
- **Scaling**: Use connection pooling.

## 3. Virtual Gift Catalog Architecture
- **Purpose**: Define gifts that can be sent between users.
- **Data Flow**: `gift_catalog` table.
- **Security**: RLS on catalog.
- **Scaling**: Cache gift metadata in memory.

## 4. Gift Sending Workflow
- **Purpose**: Deduct coins from sender, add to recipient (as diamond-equivalent balance).
- **Data Flow**: Atomic transaction: Update sender balance, Update recipient balance, Create log in `user_coin_transactions`.
- **Security**: Must be wrapped in a database function to ensure atomicity.
- **Scaling**: Keep transaction log async via message queue if volume is high.

## 5. Diamond Earning System
- **Purpose**: Accumulate earning potential for creators.
- **Data Flow**: Gift conversion logic triggers `diamond_balance` updates.
- **Security**: Same as Gift Sending (atomicity).
- **Scaling**: Same as Gift Sending.

## 6. Creator Wallet Architecture
- **Purpose**: Tracking earnings.
- **Data Flow**: `creator_wallets` table linked to `profiles`.
- **Security**: Only creator and Admin can read.
- **Scaling**: Index by `user_id`.

## 7. Creator Payout Architecture
- **Purpose**: Initiate transfers to external banking/crypto.
- **Data Flow**: Creator requests payout -> `payout_requests` table -> Admin process -> status updates.
- **Security**: Strict RLS; 2FA/approval required.
- **Scaling**: Batch processing.

## 8. Revenue Share Model
- **Purpose**: Define platform cut.
- **Data Flow**: Configurable `platform_config` table (singleton).
- **Security**: Admin access only.
- **Scaling**: Cached globally.

## 9. Transaction Ledger Design
- **Purpose**: Full audit trail.
- **Data Flow**: Immutable log entries.
- **Security**: RLS for read, restricted write.
- **Scaling**: Partition by month.

## 10. Audit and Reconciliation
- **Purpose**: Verify accuracy.
- **Data Flow**: Automated nightly cron jobs to reconcile ledger vs balances.
- **Security**: Audit logs accessible only by super-admin.
- **Scaling**: Offload to background workers.

## 11. Fraud Prevention
- **Purpose**: Detect anomalous spending/earning.
- **Data Flow**: `fraud_alerts` table.
- **Security**: Trigger-based anomaly detection.
- **Scaling**: Async processing.

## 12. Refund Handling
- **Purpose**: Return coins/fiat.
- **Data Flow**: `refunds` table, reversal transaction entries.
- **Security**: Admin approval workflow.
- **Scaling**: Async.

## 13. Chargeback Handling
- **Purpose**: Manage payment disputes.
- **Data Flow**: Webhook from Payment Provider -> Lock user -> `disputes` table.
- **Security**: Automated lock-down on user profile.
- **Scaling**: High priority alerts.

## 14. Multi-currency Support
- **Purpose**: Localized pricing.
- **Data Flow**: `coin_packages` stores USD base, `exchange_rates` table for dynamic conversion.
- **Security**: Authorized API access.
- **Scaling**: Cached rates.

## 15. Global Payout Support
- **Purpose**: Support diverse payout channels.
- **Data Flow**: `payout_channels` table (crypto address, bank account).
- **Security**: Encrypted storage of sensitive payout data.
- **Scaling**: Integration with external payout APIs.

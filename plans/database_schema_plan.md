# Database Schema Plan - TikTok6 Economy

## 1. New Database Tables

| Table Name | Purpose |
| :--- | :--- |
| `gift_catalog` | Catalog of available virtual gifts and their coin costs. |
| `creator_wallets` | Tracks diamond balances and lifetime earnings for creators. |
| `payout_requests` | Stores history and status of creator payout requests. |
| `fraud_alerts` | Logs suspicious transaction activity for security monitoring. |
| `disputes` | Manages payment chargebacks and content disputes. |
| `payout_channels` | Stores user's configured payout methods (e.g., wallet addresses, bank accounts). |
| `exchange_rates` | Stores dynamic currency exchange rates for multi-currency support. |

## 2. Relationships

- `creator_wallets.user_id` -> `profiles.id` (1:1)
- `payout_requests.wallet_id` -> `creator_wallets.id` (N:1)
- `payout_channels.user_id` -> `profiles.id` (N:1)
- `disputes.user_id` -> `profiles.id` (N:1)

## 3. Modifications to Existing Tables

- **`profiles`**: No mandatory changes, but indexing `id` is already present.
- **`platform_config`**: May need additional fields for payout threshold settings (already has `package_settings`).

## 4. Migration Execution Order

1.  `gift_catalog`
2.  `creator_wallets`
3.  `payout_channels`
4.  `payout_requests`
5.  `fraud_alerts`
6.  `disputes`
7.  `exchange_rates`

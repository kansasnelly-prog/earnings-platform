# Credential & Environment Variable Diagnostic Audit

**Generated:** 2026-08-13T01:51:55+07:00  
**Workspace:** `C:\Users\PC\Downloads\NELLY2026-WORKING\NDUNAKA2028`

---

## 1. Active / Bound Environment Variables

These variables are **currently defined** in `.env`, `.env.local`, or `.env.production` and are actively consumed by the application:

| Variable | Location(s) | Usage | Status |
|---|---|---|---|
| `VITE_SUPABASE_URL` | `.env`, `.env.local`, `.env.production` | Supabase client URL | ✅ Active |
| `VITE_SUPABASE_ANON_KEY` | `.env`, `.env.local`, `.env.production` | Supabase anon/public key | ✅ Active |
| `SUPABASE_URL` | `.env`, `.env.local` | Supabase server-side URL fallback | ✅ Active |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env`, `.env.local` | Supabase service role (admin) | ✅ Active |
| `VITE_TELEGRAM_BOT_TOKEN` | `.env.local` | Telegram bot token | ✅ Active |
| `VITE_TELEGRAM_CHAT_ID` | `.env.local` | Telegram chat ID | ✅ Active |
| `GEMINI_API_KEY` | `.env.local` | Google Gemini AI | ✅ Active |
| `VERCEL_OIDC_TOKEN` | `.env.production` | Vercel deployment token | ✅ Active (Vercel only) |

---

## 2. Missing Required Environment Variables

These variables are **referenced in code** but are **not defined** in any `.env*` file, or only have hardcoded fallbacks:

### Critical / Security-Sensitive

| Variable | Referenced In | Impact | Recommendation |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `api/*.ts`, `src/lib/*` | Server-side Supabase URL fallback | Define explicitly in `.env` |
| `STRIPE_SECRET_KEY` | `api/monetization.ts` | Stripe checkout sessions fail | Add to Vercel env |
| `MASTER_WALLET_SECRET` | `api/watch.js`, `src/utils/solanaPay.ts` | Solana payouts fail | Add to Vercel env |
| `SORA_API_KEY` | `src/services/cinema/soraQueue.ts` | Sora video generation fails | Add to Vercel env |
| `OPENROUTER_API_KEY` | `src/components/admin/GeminiStudioCommand.tsx` | OpenRouter fallback AI fails | Add to Vercel env |
| `ADMIN_PASSWORD` | `api/monetization.ts`, `api/admin.js` | Admin balance updates blocked | Add to Vercel env |
| `ADMIN_EMAIL` | `api/admin.js` | Admin auth check fails | Add to Vercel env |

### Platform Integrations

| Variable | Referenced In | Impact | Recommendation |
|---|---|---|---|
| `TIKTOK_SHOP_APP_KEY` | `src/services/tiktokShopService.ts` | TikTok proxy fails | Add to Vercel env |
| `TIKTOK_SHOP_ACCESS_TOKEN` | `src/services/tiktokShopService.ts` | TikTok proxy fails | Add to Vercel env |
| `TIKTOK_VENDOR_SECRET_STREAM` | `src/services/tiktokShopService.ts` | TikTok proxy fails | Add to Vercel env |
| `RESEND_API_KEY` | `src/utils/email.ts` | Email sending fails | Add to Vercel env |
| `EMAIL_FROM` | `src/utils/email.ts` | Email sending fails | Add to Vercel env |
| `VITE_BRAVE_SEARCH_API_KEY` | `src/services/braveSearchService.ts` | Brave search fails | Add to Vercel env |

### Solana / Blockchain

| Variable | Referenced In | Impact | Recommendation |
|---|---|---|---|
| `VITE_SOLANA_VAULT_ADDRESS` | `src/services/solanaEarningEngine.ts` | Vault routing fails | Add to Vercel env |
| `VITE_SOLANA_TREASURY_ADDRESS` | `src/services/solanaEarningEngine.ts` | Treasury routing fails | Add to Vercel env |
| `VITE_SOLANA_NETWORK` | `src/services/solanaEarningEngine.ts` | Network selection fails | Add to Vercel env (default: `devnet`) |
| `VITE_SOLANA_RPC_URL` | `src/services/solanaEarningEngine.ts` | Custom RPC fails | Add to Vercel env |
| `VITE_SOLANA_USDT_MINT` | `src/services/solanaEarningEngine.ts` | USDT mint address fallback | Optional (has mainnet default) |
| `MASTER_SOL_WALLET` | `api/webhook.js` | Admin wallet fallback | Has hardcoded fallback; rotate and add to Vercel env |

### Telegram / Bot

| Variable | Referenced In | Impact | Recommendation |
|---|---|---|---|
| `TELEGRAM_BOT_TOKEN` | `api/webhook.js` | Bot webhook fails | Add to Vercel env |
| `TELEGRAM_CHAT_ID` | `api/webhook.js` | Notification target fails | Add to Vercel env |
| `DUAL_ADMIN_TELEGRAM_ID` | `api/webhook.js` | Dual admin alerts skipped | Optional |
| `TELEGRAM_MINI_APP_URL` | `api/webhook.js` | Mini app link fallback | Has hardcoded fallback |

### Optional / Feature Flags

| Variable | Referenced In | Impact | Recommendation |
|---|---|---|---|
| `FEE_PERCENTAGE` | `api/watch.js` | Uses default `30` | Optional |
| `SOLANA_RPC_URL` | `api/watch.js` | Uses default mainnet RPC | Optional |
| `OPENAI_API_KEY` | `api/webhook.js` | AI status check | Optional |
| `GEMINI_API_KEY` | `api/webhook.js` | AI status check | Already bound in `.env.local` |

---

## 3. Hardcoded Secrets / Fallbacks Detected

These values are **hardcoded in source** and should be rotated and moved to environment variables:

| File | Hardcoded Value | Risk | Action |
|---|---|---|---|
| `src/utils/solanaPay.ts` | `MASTER_SOL_WALLET` fallback | Medium | Move to env |
| `api/webhook.js` | `MASTER_SOL_WALLET` fallback | Medium | Move to env |
| `api/webhook.js` | `TELEGRAM_MINI_APP_URL` fallback | Low | Move to env |
| `src/services/solanaEarningEngine.ts` | `VITE_SOLANA_USDT_MINT` fallback | Low | Move to env |
| `legacy_api_backup/*` | Multiple Supabase URLs/keys | High | Review and purge legacy backup |

---

## 4. Summary

- **Total unique env vars referenced in codebase:** ~40
- **Currently bound in `.env*` files:** 8
- **Missing from `.env*` files:** ~32
- **Critical missing (blocking production features):** `STRIPE_SECRET_KEY`, `MASTER_WALLET_SECRET`, `SORA_API_KEY`, `OPENROUTER_API_KEY`, `ADMIN_PASSWORD`, `ADMIN_EMAIL`, `TIKTOK_SHOP_*`, `RESEND_API_KEY`
- **Hardcoded secrets requiring rotation:** Solana wallet address, Telegram mini-app URL, USDT mint address

---

## 5. Recommended Immediate Actions

1. Add missing critical variables to Vercel Environment Variables
2. Rotate the hardcoded `MASTER_SOL_WALLET` and update all references
3. Remove or encrypt the `legacy_api_backup/` directory
4. Ensure `.env.local` is in `.gitignore` (verify it is not committed)
5. Run `vercel env pull` to sync production variables locally for testing

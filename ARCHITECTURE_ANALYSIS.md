# Phase 1: Full Project Architecture Analysis

## Frontend Structure

### Entry Points
- `src/main.tsx` - Application bootstrap with error handling and service worker
- `src/App.tsx` - Root component with routing
- `src/pages/Index.tsx` - Main page wrapper (renders AppLayout)

### Component Hierarchy
```
App.tsx
├── ThemeProvider
├── LanguageProvider
├── CSNotificationProvider
├── ErrorBoundary
└── AppProvider (AppContext)
    └── BrowserRouter
        ├── Index → AppLayout
        │   ├── Navbar
        │   ├── AuthModal
        │   ├── TelegramWidget
        │   ├── LandingHero (if !isAuthenticated)
        │   └── Main Content (if isAuthenticated)
        │       ├── Dashboard
        │       ├── TaskGrid
        │       ├── WalletSection
        │       ├── WithdrawalSection
        │       ├── ProfileSection
        │       ├── About
        │       └── Legal
        └── Admin → AdminPanel
```

### Key Context Providers
1. **AppContext** (`src/contexts/AppContext.tsx`) - Main application state
   - User data, tasks, transactions, wallets
   - Auth methods (login, register, logout)
   - Task completion, balance updates
   - Withdrawal requests

2. **SupabaseAuthContext** (`src/contexts/SupabaseAuthContext.tsx`) - Alternative auth context
   - Uses SupabaseService-minimal
   - SecurityManager for session handling
   - Real-time subscriptions
   - Admin route protection

3. **LanguageContext** - Multi-language support
4. **CSNotificationContext** - Customer service notifications

## Auth Flow

### Signup Flow (`SupabaseService.signUp`)
```
1. supabase.auth.signUp() → Creates auth.users record
2. ensureUserProfile() → Creates/updates public.users record
   - Uses buildDefaultProfile() to set defaults
   - account_type = 'personal' by default
   - vip_level = 1
   - training_completed = false
3. ensureTrainingAccount() → Only for account_type='training'
   - Creates training_accounts record
4. createTrainingTasks() → Creates tasks in tasks table
   - Personal: 35 tasks
   - Training: 45 tasks
5. Telegram notification sent
```

### Login Flow (`SupabaseService.signIn`)
```
1. supabase.auth.signInWithPassword() → Validates auth.users
2. ensureUserProfile() → Ensures public.users exists
3. applyTrainingAccountOverride() → CRITICAL OVERRIDE POINT
   - Only applies if account_type='training'
   - Overrides tasks_completed, total_tasks from training_accounts
   - Does NOT override balance (commented as safety)
4. Telegram notification sent
```

### Session Handling
- **SupabaseAuthContext**: Uses SecurityManager for in-memory session
- **AppContext**: Uses Supabase auth session
- **localStorage**: Stores 'opt_user' for offline support
- **Real-time subscriptions**: Subscribes to user and task changes

## Supabase Integration

### Client Configuration
- `src/lib/supabase.ts` - Supabase client initialization
- Environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

### Service Layer
- **SupabaseService** (`src/services/supabaseService.ts`) - Main service (4375 lines)
- **SupabaseService-minimal** - Lightweight alternative
- **TelegramService** - Telegram notifications
- **ProductCatalogService** - Product catalog management

## Database Relationships

### Table Schema (from migrations)
```
auth.users (Supabase Auth)
├── id (UUID) - Primary key
├── email
├── password_hash
└── user_metadata

public.users
├── id (UUID) - FK to auth.users.id
├── email (UNIQUE)
├── display_name
├── balance (NUMERIC)
├── vip_level (INTEGER)
├── total_earned (NUMERIC)
├── account_type ('personal' | 'training' | 'admin')
├── user_status ('active' | 'suspended' | 'deleted')
├── training_completed (BOOLEAN)
├── training_progress (INTEGER)
├── training_phase (INTEGER)
├── tasks_completed (INTEGER)
├── has_pending_order (BOOLEAN)
├── pending_amount (NUMERIC)
├── is_negative_balance (BOOLEAN)
├── profit_added (BOOLEAN)
├── pending_product (JSONB)
├── referral_code (UNIQUE)
├── referred_by (TEXT)
├── is_frozen (BOOLEAN)
├── linked_training_account_id (UUID)
└── created_at, updated_at

public.training_accounts
├── id (UUID)
├── user_id (UUID) - FK to users.id
├── auth_user_id (UUID) - FK to auth.users.id
├── email (UNIQUE)
├── password
├── amount (NUMERIC) - Balance
├── task_number (INTEGER)
├── total_tasks (INTEGER)
├── progress (INTEGER)
├── commission (NUMERIC)
├── completed (BOOLEAN)
├── status
└── created_at, updated_at

public.tasks
├── id (UUID)
├── user_id (UUID) - FK to users.id
├── task_number (INTEGER)
├── reward (NUMERIC)
├── commission_rate (NUMERIC)
├── status ('pending' | 'locked' | 'completed')
├── product_name
├── product_image
├── product_price
└── created_at, completed_at

public.transactions
├── id (UUID)
├── user_id (UUID) - FK to users.id
├── type ('deposit' | 'earning' | 'withdrawal' | 'task_reward' | 'combination_order' | 'profit_claim')
├── amount (NUMERIC)
├── description
├── status ('pending' | 'completed' | 'failed')
├── metadata (JSONB)
└── created_at

public.withdrawals
├── id (UUID)
├── user_id (UUID) - FK to users.id
├── amount (NUMERIC)
├── wallet_address
├── wallet_type
├── status ('pending' | 'completed' | 'rejected')
└── created_at, updated_at

public.wallets
├── id (UUID)
├── user_id (UUID) - FK to users.id
├── wallet_address
├── wallet_type
├── is_primary
├── available_balance
├── pending_balance
├── total_earned
├── total_withdrawn
└── created_at
```

## Admin Panel Flow

### Admin Panel Component (`src/components/admin/MainAdminPanel.tsx`)
- **Authentication**: Uses admin password (hardcoded: '08167731393')
- **Tabs**: Overview, Users, Withdrawals, Pending Orders, Customer Service, Tasks, Product Catalog, Admin Controls, Create Account
- **User Management**: Recently added action buttons for balance, VIP, freeze, delete
- **API Routes**: All admin actions go through server-side API routes for security

### Admin API Routes (newly created)
- `api/admin-user-balance.js` - Add/reduce balance with audit trail
- `api/admin-user-vip.js` - Update VIP level
- `api/admin-user-freeze.js` - Freeze/unfreeze accounts
- `api/admin-user-delete.js` - Soft delete users

## Training Account Logic

### Training Account Creation
- Only created when `account_type='training'`
- Uses master referral codes: 'OPT-MASTER', 'OPT-ADMIN', 'OPT-SYSTEM'
- Creates record in `training_accounts` table
- Links to `users` via `user_id` or `auth_user_id`

### Training Account Override (CRITICAL)
**Location**: `SupabaseService.applyTrainingAccountOverride()` (lines 863-896)

```typescript
private static async applyTrainingAccountOverride(userData: any, authUserId: string): Promise<any> {
  // Only applies if account_type='training'
  if (userData.account_type !== 'training') {
    return userData; // NO OVERRIDE for personal accounts
  }

  // Fetches from training_accounts table
  const { data: trainingAccount } = await supabase
    .from('training_accounts')
    .select('task_number, total_tasks')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (trainingAccount) {
    return {
      ...userData,
      // Keeps balance from users table - does NOT override
      tasks_completed: trainingAccount.task_number || 0,
      total_tasks: trainingAccount.total_tasks || 45,
      account_type: 'training',
    };
  }

  return userData;
}
```

**POTENTIAL ISSUE**: This function is called in:
- `getUserById()` - line 492
- `getCurrentUser()` - line 853

If there's a training account with the same `auth_user_id` as a personal account, it could override task data.

## Wallet/Balance Logic

### Balance Storage
- Primary: `users.balance` (NUMERIC)
- Secondary: `training_accounts.amount` (for training accounts)
- Calculated: `wallets.available_balance` (wallet table)

### Balance Updates
1. **Task completion**: Updates `users.balance`, `users.total_earned`, `users.tasks_completed`
2. **Admin actions**: Updates via API routes with transaction logging
3. **Withdrawals**: Deducts from `users.balance`, creates transaction record

### Balance Calculation Points
- `AppContext.mapDatabaseUserToUser()` - Maps DB user to context user
- `Dashboard.tsx` - Displays balance from context
- `WalletSection.tsx` - Displays wallet balance
- `applyTrainingAccountOverride()` - Does NOT override balance (safety comment)

## Task System

### Task Creation
- `createTrainingTasks()` - Creates tasks based on account_type
  - Personal: 35 tasks per set
  - Training: 45 tasks per phase
- Uses `training_products` table for product data
- Calculates rewards based on VIP commission rates

### Task Completion
- `completeTask()` in AppContext
- Updates task status to 'completed'
- Updates user balance and stats
- Creates transaction record
- Unlocks next task

### Task Data Loading
- `refreshTasks()` in AppContext
- Fetches from `tasks` table filtered by `user_id`
- Maps to context Task type

## Withdrawal Flow

### Withdrawal Request
- `requestWithdrawal()` in AppContext
- Creates record in `withdrawals` table
- Deducts from `users.balance`
- Creates transaction record

### Withdrawal Processing (Admin)
- Admin panel approves/rejects withdrawals
- Updates withdrawal status
- Updates user balance if rejected
- Sends Telegram notifications

## Session Handling

### Session Storage Locations
1. **Supabase Auth Session**: `supabase.auth.getSession()`
2. **SecurityManager**: In-memory session (SupabaseAuthContext)
3. **localStorage**: 'opt_user' key
4. **AppContext State**: React state

### Session Restoration
- On app mount, checks SecurityManager session
- Falls back to localStorage
- Validates with database
- Creates new session if valid

## API Routes

### Server-Side API Routes
- `api/admin-user-balance.js` - Balance management
- `api/admin-user-vip.js` - VIP level updates
- `api/admin-user-freeze.js` - Freeze/unfreeze
- `api/admin-user-delete.js` - Soft delete
- `api/send-telegram-notification.js` - Telegram notifications

### Client-Side API Calls
- All admin actions use `fetch()` to call API routes
- Admin password validation on server
- Direct Supabase client calls for user operations

## Data Flow Map

```
auth.users (Supabase Auth)
    ↓ (id)
public.users
    ↓ (id)
    ├── tasks (user_id)
    ├── transactions (user_id)
    ├── withdrawals (user_id)
    ├── wallets (user_id)
    └── training_accounts (user_id OR auth_user_id)
```

## Critical Override Points

### 1. applyTrainingAccountOverride() - HIGH RISK
**Location**: `supabaseService.ts` lines 863-896
**Called from**: `getUserById()`, `getCurrentUser()`
**Risk**: If training account exists with same auth_user_id as personal account, it overrides task data
**Safety Check**: Only applies if `account_type='training'`

### 2. mapDatabaseUserToUser() - MEDIUM RISK
**Location**: `AppContext.tsx` lines 198-248
**Risk**: Maps DB user to context user, could have incorrect field mappings
**Safety**: Uses explicit field mapping with defaults

### 3. Session Restoration - MEDIUM RISK
**Location**: `SupabaseAuthContext.tsx` lines 404-449
**Risk**: Could restore stale session from localStorage
**Safety**: Validates with database before creating session

## Personal Account Data Loading

### Load Points
1. **Login**: `SupabaseService.signIn()` → `ensureUserProfile()` → `applyTrainingAccountOverride()`
2. **Session Restore**: `getCurrentUser()` → `ensureUserProfile()` → `applyTrainingAccountOverride()`
3. **Context Refresh**: `refreshUser()` → `getUserById()` → `applyTrainingAccountOverride()`

### Data Sources
- **Primary**: `public.users` table
- **Override**: `public.training_accounts` (only for training accounts)
- **Auth**: `auth.users` (Supabase Auth)

## Training Data Override Risks

### Risk 1: Wrong account_type
If a personal account has `account_type='training'` set incorrectly, training account data will override.

### Risk 2: Duplicate auth_user_id
If training_accounts and users share the same auth_user_id, the override could apply to wrong account.

### Risk 3: Stale session
If localStorage has stale user data, it could show old training data.

## Balance Calculation

### Calculation Points
1. **Task completion**: `balance += reward`
2. **Withdrawal**: `balance -= amount`
3. **Admin add**: `balance += amount`
4. **Admin reduce**: `balance -= amount`

### Storage
- `users.balance` - Primary storage
- `transactions.amount` - Transaction history
- `wallets.available_balance` - Wallet view

## Admin Changes Update DB

### Update Flow
1. Admin action in UI
2. Call to API route (e.g., `/api/admin-user-balance`)
3. API route validates admin password
4. API route updates database directly
5. API route returns result
6. UI updates local state
7. UI refreshes user data from database

### Safety
- All admin actions require admin password
- Server-side validation
- Transaction logging for balance changes
- No direct database access from admin UI

## Potential Issues Identified

### 1. Training Account Override on Personal Accounts
**Location**: `applyTrainingAccountOverride()`
**Issue**: If personal account has training account linked via auth_user_id, override could apply
**Check**: Verify account_type before override (already implemented)

### 2. Duplicate User Records
**Issue**: Same email in both users and training_accounts
**Check**: Need to inspect database for duplicates

### 3. Wrong auth_user_id Mapping
**Issue**: training_accounts.auth_user_id pointing to wrong users.id
**Check**: Need to verify foreign key relationships

### 4. Balance Mismatch
**Issue**: users.balance not matching transaction history
**Check**: Need to calculate balance from transactions and compare

### 5. Session Staleness
**Issue**: localStorage session not refreshing
**Check**: Session validation on mount

## Next Steps (Phase 2)

1. Inspect real Supabase schema to verify column names
2. Run diagnostic SQL to check for duplicates
3. Verify foreign key relationships
4. Check balance vs transaction history
5. Identify specific issues with new personal account

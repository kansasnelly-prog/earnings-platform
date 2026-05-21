# Phase 2 Training Flow Testing Checklist
## Test Account: test123@gmail.com

---

## Pre-Test Verification

### Database State (Confirmed)
- ✅ email: test123@gmail.com
- ✅ vip_level = 2
- ✅ account_type = 'training'
- ✅ training_phase = 2
- ✅ training_phase_2_checkpoint.status = 'pending_review'

### Code Fixes Applied
- ✅ Fixed field name mismatch: `phase2_checkpoint` → `training_phase_2_checkpoint` in TaskGrid.tsx
- ✅ Lines fixed: 718, 962, 970, 973, 999, 1004
- ✅ Dev server running at http://localhost:5173

---

## Test Instructions

### 1. Login/Auth Flow

**Steps:**
1. Open http://localhost:5173 in browser
2. Click "Login" button
3. Enter email: test123@gmail.com
4. Enter password: [your password]
5. Click "Sign In"

**Expected Results:**
- ✅ Login succeeds without errors
- ✅ Redirects to Dashboard
- ✅ No console errors during login

**Console Logs to Check:**
```
[SupabaseService.signIn] Login attempt for: test123@gmail.com
[SupabaseService.signIn] Login successful for: test123@gmail.com
```

**Browser Console Check:**
- Open DevTools (F12)
- Go to Console tab
- Look for any red errors
- Look for the success logs above

---

### 2. Dashboard & Phase 2 Detection

**Steps:**
1. After login, observe Dashboard
2. Check for Phase 2 indicators
3. Navigate to Tasks tab

**Expected Results:**
- ✅ Dashboard loads without errors
- ✅ User object displays correct data
- ✅ Tasks tab loads successfully
- ✅ Phase 2 indicator visible (if implemented)

**Console Logs to Check:**
```
[TaskGrid] User object available with training_phase: 2
[TaskGrid] Checkpoint status: pending_review
```

**Browser Network Check:**
- Open DevTools (F12)
- Go to Network tab
- Look for Supabase requests
- Verify user data fetch succeeded

---

### 3. Checkpoint Modal Auto-Display

**Steps:**
1. After login, wait 2-3 seconds
2. Check if checkpoint modal appears

**Expected Results:**
- ✅ Checkpoint modal auto-opens
- ✅ Modal title: "Checkpoint Review"
- ✅ Status displays: "Waiting for admin review..."
- ✅ Shows combination product pair (2 products)
- ✅ Shows "Contact Customer Service" button
- ✅ Shows "Close & Return" button

**Modal Content Verification:**
- Product 1 name and price
- Product 2 name and price
- Review amount display
- Total balance display
- "EARN 6x profit" message

**Console Logs to Check:**
```
[TaskGrid] Phase 2 checkpoint detected, showing modal
```

---

### 4. Task Submission Blocking

**Steps:**
1. Close checkpoint modal (if open)
2. Navigate to Tasks tab
3. Find the current pending task
4. Click "Submit" button on the task

**Expected Results:**
- ❌ Task submission is BLOCKED
- ✅ Toast notification appears: "Checkpoint Review Required"
- ✅ Toast description: "Your account is pending admin review. Contact customer service to continue."
- ✅ Checkpoint modal reopens
- ✅ No API call to complete task
- ✅ Task status remains "pending"

**Console Logs to Check:**
```
[TaskGrid] Phase 2 checkpoint blocking task submission
[TaskGrid] Checkpoint modal reopened
```

**Browser Network Check:**
- Go to Network tab
- Verify NO request to complete task
- Verify only modal state changes

---

### 5. Customer Service Button

**Steps:**
1. In checkpoint modal, click "Contact Customer Service" button

**Expected Results:**
- ✅ Customer service modal opens
- ✅ Or redirects to customer service section
- ✅ No errors occur

---

### 6. Close & Return Button

**Steps:**
1. In checkpoint modal, click "Close & Return" button

**Expected Results:**
- ✅ Checkpoint modal closes
- ✅ Returns to Tasks tab
- ✅ Task submission still blocked
- ✅ Can reopen modal by trying to submit task

---

## Runtime Validation Checklist

### Console Errors
- [ ] No React errors
- [ ] No undefined variable errors
- [ ] No JSON parsing errors
- [ ] No Supabase client errors

### Network Failures
- [ ] All Supabase requests succeed (200 OK)
- [ ] No CORS errors
- [ ] No timeout errors
- [ ] No 401/403/500 errors

### State Management
- [ ] User state loads correctly
- [ ] training_phase = 2
- [ ] training_phase_2_checkpoint.status = 'pending_review'
- [ ] No hydration mismatches
- [ ] No undefined state errors

### React Rendering
- [ ] No "Cannot read property of undefined"
- [ ] No "Cannot read property of null"
- [ ] Components render without crashing
- [ ] No infinite re-renders

---

## Expected Console Output (Success Case)

```
[SupabaseService.signIn] Login attempt for: test123@gmail.com
[SupabaseService.signIn] Login successful for: test123@gmail.com
[TaskGrid] User object available with training_phase: 2
[TaskGrid] Checkpoint status: pending_review
[TaskGrid] Phase 2 checkpoint detected, showing modal
```

---

## Expected Console Output (Failure Case - If Bug Exists)

```
[TaskGrid] User object available with training_phase: 2
[TaskGrid] Checkpoint status: undefined
[TaskGrid] Phase 2 checkpoint NOT detected
[TaskGrid] Task submission NOT blocked
```

---

## Test Results Template

### Test 1: Login/Auth
- Status: [PASS/FAIL]
- Screenshot: [attach if FAIL]
- Console Logs: [copy relevant logs]

### Test 2: Dashboard & Phase 2 Detection
- Status: [PASS/FAIL]
- Screenshot: [attach if FAIL]
- Console Logs: [copy relevant logs]

### Test 3: Checkpoint Modal Auto-Display
- Status: [PASS/FAIL]
- Screenshot: [attach if FAIL]
- Console Logs: [copy relevant logs]

### Test 4: Task Submission Blocking
- Status: [PASS/FAIL]
- Screenshot: [attach if FAIL]
- Console Logs: [copy relevant logs]

### Test 5: Customer Service Button
- Status: [PASS/FAIL]
- Screenshot: [attach if FAIL]
- Console Logs: [copy relevant logs]

### Test 6: Close & Return Button
- Status: [PASS/FAIL]
- Screenshot: [attach if FAIL]
- Console Logs: [copy relevant logs]

---

## Final Report

### Overall Status: [PASS/FAIL]

### Blockers Before Production:
- [ ] List any remaining issues
- [ ] Severity level
- [ ] Proposed fix

### Screenshots Required:
- [ ] Login screen
- [ ] Dashboard with Phase 2 indicator
- [ ] Checkpoint modal (pending_review)
- [ ] Task submission blocked toast
- [ ] Console logs (no errors)

---

## Notes

- Dev server is running at http://localhost:5173
- Browser preview available at http://127.0.0.1:62815
- All field name mismatches have been fixed
- Code logic verified correct

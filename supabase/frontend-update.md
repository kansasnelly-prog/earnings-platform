# Supabase Deployment Guide

## 🚀 **MAKE YOUR PLATFORM REAL - DEPLOYMENT STEPS**

### **Step 1: Setup Database Tables**
1. **Go to your Supabase Dashboard**
2. **Open SQL Editor** (in left sidebar)
3. **Copy & paste** the entire content from `supabase/schema.sql`
4. **Click "Run"** to create all tables
5. **Verify tables created** in Database section

### **Step 2: Deploy Edge Functions**

#### **Deploy Auth Handler:**
1. **Go to Edge Functions** in Supabase Dashboard
2. **Click "New Function"**
3. **Function name**: `auth-handler`
4. **Copy & paste** content from `supabase/auth-handler.ts`
5. **Click "Deploy"**

#### **Deploy Admin Handler:**
1. **Click "New Function"** again
2. **Function name**: `admin-handler`
3. **Copy & paste** content from `supabase/admin-handler.ts`
4. **Click "Deploy"**

### **Step 3: Configure Environment Variables**
In your Edge Functions, add these secrets:
- `SUPABASE_URL`: Your Supabase URL
- `SUPABASE_ANON_KEY`: Your Supabase anon key

### **Step 4: Update Frontend Configuration**
```typescript
// Update AppContext.tsx to use real backend
// Replace the tryBackend function with this:

const tryBackend = async (body: any) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-handler`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    if (data.error) return null;
    return data;
  } catch { return null; }
};

const adminInvoke = async (body: any) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-handler`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    if (data.error) return null;
    return data;
  } catch { return null; }
};
```

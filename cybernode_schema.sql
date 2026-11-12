-- CyberNode Database Schema for Supabase
-- Run these queries in your Supabase SQL Editor

-- Users table storing wallet addresses, balances, and referral tracking
create table if not exists cybernode_users (
  id uuid default gen_random_uuid() primary key,
  wallet_address text unique not null,
  telegram_id text unique,
  balance_gram numeric(18, 6) default 0.000000,
  balance_usdt numeric(18, 6) default 0.000000,
  mining_speed numeric(10, 6) default 0.051000,
  last_mined_at timestamp with time zone default timezone('utc'::text, now()),
  referred_by text,
  daily_streak int default 0,
  last_check_in timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Claiming sections / Node daemons state
create table if not exists cybernode_claims (
  id uuid default gen_random_uuid() primary key,
  wallet_address text references cybernode_users(wallet_address),
  section_type text not null,
  unclaimed_amount numeric(18, 6) default 0.000000,
  last_claimed_at timestamp with time zone default timezone('utc'::text, now())
);

-- On-chain payout logs
create table if not exists cybernode_payouts (
  id uuid default gen_random_uuid() primary key,
  wallet_address text not null,
  amount numeric(18, 6) not null,
  currency text not null,
  tx_hash text unique not null,
  gas_fee numeric(18, 6) not null,
  status text default 'completed',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security (optional - API uses service role key)
alter table cybernode_users enable row level security;
alter table cybernode_claims enable row level security;
alter table cybernode_payouts enable row level security;

-- Create policies for public read/write (API backend handles auth via service role)
create policy "Public access" on cybernode_users for all using (true);
create policy "Public access" on cybernode_claims for all using (true);
create policy "Public access" on cybernode_payouts for all using (true);
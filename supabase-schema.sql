-- Run this in Supabase SQL editor

-- Agent keypairs and config
create table if not exists agents (
  id text primary key,                    -- sub_wallet PDA address
  owner_pubkey text not null,
  agent_pubkey text not null,
  encrypted_privkey text not null,
  iv text not null,
  auth_tag text not null,
  name text not null,
  is_active boolean default true,
  last_run_at timestamptz,
  created_at timestamptz default now()
);

-- Temporary keypairs during sub-wallet creation flow
create table if not exists temp_keypairs (
  temp_id text primary key,
  agent_pubkey text not null,
  encrypted_privkey text not null,
  iv text not null,
  auth_tag text not null,
  created_at timestamptz default now()
);

-- Agent transaction history
create table if not exists agent_transactions (
  id uuid primary key default gen_random_uuid(),
  sub_wallet_id text not null references agents(id) on delete cascade,
  from_token text not null,
  to_token text not null,
  from_symbol text not null,
  to_symbol text not null,
  amount_in bigint not null,
  amount_out bigint,
  amount_usd numeric,
  tx_signature text,
  status text not null,               -- 'success' | 'failed' | 'blocked' | 'pending'
  blocked_reason text,
  claude_reasoning text,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists agents_owner_idx on agents(owner_pubkey);
create index if not exists txs_wallet_idx on agent_transactions(sub_wallet_id);

-- Auto-cleanup temp keypairs older than 1 hour (run as cron or manually)
-- delete from temp_keypairs where created_at < now() - interval '1 hour';

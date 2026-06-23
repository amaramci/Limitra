# Smart Allowance Wallet
<!-- deploy webhook test -->
AI agents that trade on Solana. Each agent has a policy stored on-chain. The agent cannot break its own rules.

## What it does

- You create a sub-wallet and set a policy: allowed tokens, daily limit, max trade size
- The policy lives on Solana (Anchor program) and cannot be bypassed
- A Claude AI agent reads the policy, checks prices, and decides to buy or sell
- Trades run automatically every 5 minutes via a cron job
- Everything is logged to Supabase

## Stack

- Solana smart contract: Anchor 0.31.1, deployed on devnet
- Frontend: Next.js 15, Tailwind CSS, Phantom/Solflare wallet
- AI: Claude Haiku (trading decisions) via Anthropic API
- Prices: CoinGecko API
- Swaps: Jupiter (mainnet) / simulated (devnet)
- Database: Supabase (encrypted agent keypairs + transaction history)
- Cron: Vercel (every 5 minutes)

## Setup

**1. Install dependencies**

```bash
cd app
npm install
```

**2. Create a Supabase project and run the schema**

Go to Supabase SQL Editor and run `supabase-schema.sql`.

**3. Fill in environment variables**

Copy `.env.local` and fill in the values:

```
ANTHROPIC_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ENCRYPTION_KEY=          # 64 hex chars: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
CRON_SECRET=             # any random string
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

**4. Run locally**

```bash
cd app
npm run dev
```

Open http://localhost:3000.

## Testing the agent

Trigger the agent manually:

```bash
curl -X POST http://localhost:3000/api/cron \
  -H "Authorization: Bearer <your-cron-secret>"
```

The agent will fetch prices, ask Claude what to do, validate against the policy, and record the result.

## Deploy

Push to GitHub and connect to Vercel. Add all env vars in Vercel project settings. The cron in `vercel.json` runs automatically every 5 minutes.

## Smart contract

Program ID: `9qQcnqLMemRQZJTFBkgULoAK6AwGVPdDcS9chXZmDTpM` (Solana devnet)

To rebuild:

```bash
anchor build
anchor deploy --provider.cluster devnet
```

## How agent creation works

1. User clicks "New agent" and sets a policy
2. Server generates a keypair for the agent and stores it encrypted in Supabase
3. User signs an Anchor transaction in Phantom, which creates the on-chain sub-wallet
4. The agent starts trading autonomously using its keypair

use anchor_lang::prelude::*;
use crate::ID;

#[account]
pub struct MainWallet {
    pub owner: Pubkey,         // 32
    pub sub_wallet_count: u64, // 8
    pub bump: u8,              // 1
}

impl MainWallet {
    pub const SIZE: usize = 8 + 32 + 8 + 1 + 32; // discriminator + fields + padding
}

#[account]
pub struct SubWallet {
    pub main_wallet: Pubkey,        // 32
    pub agent_authority: Pubkey,    // 32  — keypair that signs on behalf of agent
    pub name: String,               // 4 + 32
    pub agent_description: String,  // 4 + 128
    pub policy: PolicyConfig,       // see below
    pub daily_spent: u64,           // 8
    pub last_reset_timestamp: i64,  // 8
    pub total_transactions: u64,    // 8
    pub realized_pnl: i64,          // 8 — in token base units (e.g. USDC micro-cents)
    pub is_paused: bool,            // 1
    pub index: u64,                 // 8  — used as PDA seed
    pub bump: u8,                   // 1
}

impl SubWallet {
    // policy: 10 pubkeys * 32 + 10 pubkeys * 32 + 8 + 8 = 656
    pub const SIZE: usize = 8    // discriminator
        + 32                     // main_wallet
        + 32                     // agent_authority
        + (4 + 32)               // name
        + (4 + 128)              // agent_description
        + PolicyConfig::SIZE     // policy
        + 8                      // daily_spent
        + 8                      // last_reset_timestamp
        + 8                      // total_transactions
        + 8                      // realized_pnl
        + 1                      // is_paused
        + 8                      // index
        + 1                      // bump
        + 64;                    // padding
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PolicyConfig {
    /// Whitelisted SPL token mints the agent may spend
    pub allowed_tokens: Vec<Pubkey>,    // 4 + 10 * 32 = 324
    /// Whitelisted program IDs (DEX routers, lending protocols, etc.)
    pub allowed_protocols: Vec<Pubkey>, // 4 + 10 * 32 = 324
    /// Max total spend per 24h window (in token base units)
    pub daily_limit: u64,               // 8
    /// Max single-transaction spend
    pub max_tx_size: u64,               // 8
    /// Arbitrary strategy tag for off-chain filtering
    pub strategy_tag: String,           // 4 + 32
}

impl PolicyConfig {
    pub const SIZE: usize = (4 + 10 * 32) + (4 + 10 * 32) + 8 + 8 + (4 + 32);
}

// ── Events ────────────────────────────────────────────────────────────────────

#[event]
pub struct MainWalletCreated {
    pub owner: Pubkey,
    pub main_wallet: Pubkey,
}

#[event]
pub struct SubWalletCreated {
    pub main_wallet: Pubkey,
    pub sub_wallet: Pubkey,
    pub name: String,
    pub agent_authority: Pubkey,
}

#[event]
pub struct PolicyUpdated {
    pub sub_wallet: Pubkey,
    pub updater: Pubkey,
}

#[event]
pub struct TransactionExecuted {
    pub sub_wallet: Pubkey,
    pub token_mint: Pubkey,
    pub amount: u64,
    pub daily_spent: u64,
    pub daily_limit: u64,
    pub memo: String,
}

#[event]
pub struct PnlRecorded {
    pub sub_wallet: Pubkey,
    pub pnl_delta: i64,
    pub total_pnl: i64,
}

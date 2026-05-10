use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Transfer, transfer};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("9qQcnqLMemRQZJTFBkgULoAK6AwGVPdDcS9chXZmDTpM");

pub mod errors;
pub mod state;
use errors::*;
use state::*;

#[program]
pub mod smart_allowance_wallet {
    use super::*;

    pub fn initialize_main_wallet(ctx: Context<InitializeMainWallet>) -> Result<()> {
        let main_wallet = &mut ctx.accounts.main_wallet;
        main_wallet.owner = ctx.accounts.owner.key();
        main_wallet.sub_wallet_count = 0;
        main_wallet.bump = ctx.bumps.main_wallet;
        emit!(MainWalletCreated {
            owner: ctx.accounts.owner.key(),
            main_wallet: main_wallet.key(),
        });
        Ok(())
    }

    pub fn create_sub_wallet(
        ctx: Context<CreateSubWallet>,
        name: String,
        agent_description: String,
        policy: PolicyConfig,
    ) -> Result<()> {
        require!(name.len() <= 32, WalletError::NameTooLong);
        require!(agent_description.len() <= 128, WalletError::DescriptionTooLong);
        require!(policy.allowed_tokens.len() <= 10, WalletError::TooManyTokens);
        require!(policy.allowed_protocols.len() <= 10, WalletError::TooManyProtocols);
        require!(policy.daily_limit > 0, WalletError::InvalidLimit);
        require!(
            policy.max_tx_size <= policy.daily_limit,
            WalletError::TxSizeExceedsDaily
        );

        let main_wallet = &mut ctx.accounts.main_wallet;
        let sub_wallet = &mut ctx.accounts.sub_wallet;
        let clock = Clock::get()?;

        sub_wallet.main_wallet = main_wallet.key();
        sub_wallet.agent_authority = ctx.accounts.agent_authority.key();
        sub_wallet.name = name.clone();
        sub_wallet.agent_description = agent_description;
        sub_wallet.policy = policy;
        sub_wallet.daily_spent = 0;
        sub_wallet.last_reset_timestamp = clock.unix_timestamp;
        sub_wallet.total_transactions = 0;
        sub_wallet.realized_pnl = 0;
        sub_wallet.is_paused = false;
        sub_wallet.index = main_wallet.sub_wallet_count;
        sub_wallet.bump = ctx.bumps.sub_wallet;

        main_wallet.sub_wallet_count += 1;

        emit!(SubWalletCreated {
            main_wallet: main_wallet.key(),
            sub_wallet: sub_wallet.key(),
            name,
            agent_authority: ctx.accounts.agent_authority.key(),
        });
        Ok(())
    }

    pub fn update_policy(
        ctx: Context<UpdatePolicy>,
        new_policy: PolicyConfig,
    ) -> Result<()> {
        require!(new_policy.allowed_tokens.len() <= 10, WalletError::TooManyTokens);
        require!(new_policy.allowed_protocols.len() <= 10, WalletError::TooManyProtocols);
        require!(new_policy.daily_limit > 0, WalletError::InvalidLimit);
        require!(
            new_policy.max_tx_size <= new_policy.daily_limit,
            WalletError::TxSizeExceedsDaily
        );

        let sub_wallet = &mut ctx.accounts.sub_wallet;
        sub_wallet.policy = new_policy;

        emit!(PolicyUpdated {
            sub_wallet: sub_wallet.key(),
            updater: ctx.accounts.owner.key(),
        });
        Ok(())
    }

    pub fn pause_sub_wallet(ctx: Context<PauseSubWallet>, paused: bool) -> Result<()> {
        ctx.accounts.sub_wallet.is_paused = paused;
        Ok(())
    }

    /// Validate and execute a token transfer through policy enforcement.
    /// This is the core security check — agents can only execute what policy allows.
    pub fn execute_agent_transfer(
        ctx: Context<ExecuteAgentTransfer>,
        amount: u64,
        memo: String,
    ) -> Result<()> {
        let sub_wallet = &mut ctx.accounts.sub_wallet;
        let clock = Clock::get()?;

        require!(!sub_wallet.is_paused, WalletError::SubWalletPaused);

        // Reset daily counter if 24h have passed
        let seconds_since_reset = clock.unix_timestamp - sub_wallet.last_reset_timestamp;
        if seconds_since_reset >= 86_400 {
            sub_wallet.daily_spent = 0;
            sub_wallet.last_reset_timestamp = clock.unix_timestamp;
        }

        // Policy: max transaction size
        require!(
            amount <= sub_wallet.policy.max_tx_size,
            WalletError::ExceedsMaxTxSize
        );

        // Policy: daily spending limit
        let new_daily_spent = sub_wallet
            .daily_spent
            .checked_add(amount)
            .ok_or(WalletError::Overflow)?;
        require!(
            new_daily_spent <= sub_wallet.policy.daily_limit,
            WalletError::ExceedsDailyLimit
        );

        // Policy: token whitelist
        let token_mint = ctx.accounts.source_token.mint;
        let token_allowed = sub_wallet.policy.allowed_tokens.contains(&token_mint);
        require!(token_allowed, WalletError::TokenNotAllowed);

        // Execute the actual SPL token transfer
        let seeds = &[
            b"sub_wallet",
            sub_wallet.main_wallet.as_ref(),
            &sub_wallet.index.to_le_bytes(),
            &[sub_wallet.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.source_token.to_account_info(),
                    to: ctx.accounts.destination_token.to_account_info(),
                    authority: sub_wallet.to_account_info(),
                },
                signer_seeds,
            ),
            amount,
        )?;

        // Update state
        sub_wallet.daily_spent = new_daily_spent;
        sub_wallet.total_transactions += 1;

        emit!(TransactionExecuted {
            sub_wallet: sub_wallet.key(),
            token_mint,
            amount,
            daily_spent: new_daily_spent,
            daily_limit: sub_wallet.policy.daily_limit,
            memo,
        });
        Ok(())
    }

    /// Record P&L for off-chain strategy tracking (called by agent after trade settles)
    pub fn record_pnl(ctx: Context<RecordPnl>, pnl_delta: i64) -> Result<()> {
        let sub_wallet = &mut ctx.accounts.sub_wallet;
        sub_wallet.realized_pnl = sub_wallet
            .realized_pnl
            .checked_add(pnl_delta)
            .ok_or(WalletError::Overflow)?;
        emit!(PnlRecorded {
            sub_wallet: sub_wallet.key(),
            pnl_delta,
            total_pnl: sub_wallet.realized_pnl,
        });
        Ok(())
    }
}

// ── Account Contexts ──────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeMainWallet<'info> {
    #[account(
        init,
        payer = owner,
        space = MainWallet::SIZE,
        seeds = [b"main_wallet", owner.key().as_ref()],
        bump
    )]
    pub main_wallet: Account<'info, MainWallet>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(name: String, agent_description: String, policy: PolicyConfig)]
pub struct CreateSubWallet<'info> {
    #[account(
        mut,
        seeds = [b"main_wallet", owner.key().as_ref()],
        bump = main_wallet.bump,
        has_one = owner @ WalletError::Unauthorized,
    )]
    pub main_wallet: Account<'info, MainWallet>,
    #[account(
        init,
        payer = owner,
        space = SubWallet::SIZE,
        seeds = [
            b"sub_wallet",
            main_wallet.key().as_ref(),
            &main_wallet.sub_wallet_count.to_le_bytes()
        ],
        bump
    )]
    pub sub_wallet: Account<'info, SubWallet>,
    /// CHECK: this is the agent's keypair / program that will sign transactions
    pub agent_authority: UncheckedAccount<'info>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdatePolicy<'info> {
    #[account(
        seeds = [b"main_wallet", owner.key().as_ref()],
        bump = main_wallet.bump,
        has_one = owner @ WalletError::Unauthorized,
    )]
    pub main_wallet: Account<'info, MainWallet>,
    #[account(
        mut,
        has_one = main_wallet @ WalletError::Unauthorized,
    )]
    pub sub_wallet: Account<'info, SubWallet>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct PauseSubWallet<'info> {
    #[account(
        seeds = [b"main_wallet", owner.key().as_ref()],
        bump = main_wallet.bump,
        has_one = owner @ WalletError::Unauthorized,
    )]
    pub main_wallet: Account<'info, MainWallet>,
    #[account(
        mut,
        has_one = main_wallet @ WalletError::Unauthorized,
    )]
    pub sub_wallet: Account<'info, SubWallet>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct ExecuteAgentTransfer<'info> {
    #[account(
        mut,
        has_one = agent_authority @ WalletError::Unauthorized,
    )]
    pub sub_wallet: Account<'info, SubWallet>,
    #[account(mut)]
    pub source_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub destination_token: Account<'info, TokenAccount>,
    pub agent_authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
pub struct RecordPnl<'info> {
    #[account(
        mut,
        has_one = agent_authority @ WalletError::Unauthorized,
    )]
    pub sub_wallet: Account<'info, SubWallet>,
    pub agent_authority: Signer<'info>,
}

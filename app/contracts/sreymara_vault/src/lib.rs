use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_instruction;

// SREYMARA MASTER ON-CHAIN REVENUE VAULT (80/20 REVENUE SHARING SMART CONTRACT)
// Program ID for Solana Mainnet / Devnet deployment
declare_id!("SreyMaraVault11111111111111111111111111111111");

#[program]
pub mod sreymara_vault {
    use super::*;

    /// Process in-app revenue interactions (Virtual Gifts, Diamonds, VIP Badges, Monetization)
    /// Splits funds on-chain: 80% to Admin Master Wallet, 20% to User Yield Pool Vault
    pub fn process_interaction_payment(ctx: Context<PayInteraction>, amount: u64) -> Result<()> {
        require!(amount > 0, VaultError::InvalidAmount);

        let master_share = (amount * 80) / 100; // 80% to Admin Master Wallet
        let user_pool_share = amount - master_share; // 20% to User Yield Pool Vault

        // 1. Transfer 80% to Master Owner Wallet (NDUNAKA PROSPER CHINEMEREM)
        let transfer_master = system_instruction::transfer(
            &ctx.accounts.user.key(),
            &ctx.accounts.master_wallet.key(),
            master_share,
        );
        anchor_lang::solana_program::program::invoke(
            &transfer_master,
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.master_wallet.to_account_info(),
            ],
        )?;

        // 2. Transfer 20% to User Yield Pool Vault
        let transfer_pool = system_instruction::transfer(
            &ctx.accounts.user.key(),
            &ctx.accounts.user_pool_wallet.key(),
            user_pool_share,
        );
        anchor_lang::solana_program::program::invoke(
            &transfer_pool,
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.user_pool_wallet.to_account_info(),
            ],
        )?;

        emit!(RevenueSplitEvent {
            user: ctx.accounts.user.key(),
            total_amount: amount,
            master_share,
            user_pool_share,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Automated Batch Payout to Master Bound Wallet (Runs on 2-3 Day CRON schedule)
    pub fn execute_automated_payout(ctx: Context<ExecutePayout>, payout_amount: u64) -> Result<()> {
        let pool_balance = ctx.accounts.user_pool_wallet.to_account_info().lamports();
        require!(pool_balance >= payout_amount, VaultError::InsufficientVaultFunds);

        let transfer_instruction = system_instruction::transfer(
            &ctx.accounts.user_pool_wallet.key(),
            &ctx.accounts.master_wallet.key(),
            payout_amount,
        );

        anchor_lang::solana_program::program::invoke(
            &transfer_instruction,
            &[
                ctx.accounts.user_pool_wallet.to_account_info(),
                ctx.accounts.master_wallet.to_account_info(),
            ],
        )?;

        emit!(AutomatedPayoutEvent {
            master_wallet: ctx.accounts.master_wallet.key(),
            payout_amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct PayInteraction<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    /// CHECK: Master Admin Wallet (NDUNAKA PROSPER CHINEMEREM)
    #[account(mut)]
    pub master_wallet: AccountInfo<'info>,
    /// CHECK: User Yield Staking Pool Vault Address
    #[account(mut)]
    pub user_pool_wallet: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecutePayout<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: User Yield Pool Vault
    #[account(mut)]
    pub user_pool_wallet: AccountInfo<'info>,
    /// CHECK: Master Admin Payout Wallet
    #[account(mut)]
    pub master_wallet: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct RevenueSplitEvent {
    pub user: Pubkey,
    pub total_amount: u64,
    pub master_share: u64,
    pub user_pool_share: u64,
    pub timestamp: i64,
}

#[event]
pub struct AutomatedPayoutEvent {
    pub master_wallet: Pubkey,
    pub payout_amount: u64,
    pub timestamp: i64,
}

#[error_code]
pub enum VaultError {
    #[msg("Invalid transaction amount.")]
    InvalidAmount,
    #[msg("Insufficient funds in the yield pool vault.")]
    InsufficientVaultFunds,
}

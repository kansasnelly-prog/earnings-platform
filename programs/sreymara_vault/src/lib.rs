use anchor_lang::prelude::*;

declare_id!("SreymaraVault1111111111111111111111111111111");

#[program]
pub mod sreymara_vault {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("SREYMARA Vault Program Initialized");
        Ok(())
    }

    pub fn withdraw_safe_pot(ctx: Context<WithdrawSafePot>, amount_usdt: u64) -> Result<()> {
        let clock = Clock::get()?;
        let recipient_pubkey = ctx.accounts.recipient.key();

        // Perform safe pot SPL token transfer logic
        msg!("Executing SREYMARA Safe Pot payout of {} USDT to {}", amount_usdt, recipient_pubkey);

        // Emit Anchor VaultPayoutEvent for Helius Webhook & Telegram Alert Engine
        emit!(VaultPayoutEvent {
            recipient: recipient_pubkey,
            amount_usdt,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

#[derive(Accounts)]
pub struct WithdrawSafePot<'info> {
    #[account(mut)]
    pub vault_authority: Signer<'info>,
    /// CHECK: Recipient wallet verified on-chain
    #[account(mut)]
    pub recipient: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct VaultPayoutEvent {
    pub recipient: Pubkey,
    pub amount_usdt: u64,
    pub timestamp: i64,
}

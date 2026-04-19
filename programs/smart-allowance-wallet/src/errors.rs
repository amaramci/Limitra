use anchor_lang::prelude::*;

#[error_code]
pub enum WalletError {
    #[msg("Caller is not authorized to perform this action")]
    Unauthorized,
    #[msg("Agent name must be 32 characters or fewer")]
    NameTooLong,
    #[msg("Agent description must be 128 characters or fewer")]
    DescriptionTooLong,
    #[msg("Policy allows a maximum of 10 tokens")]
    TooManyTokens,
    #[msg("Policy allows a maximum of 10 protocols")]
    TooManyProtocols,
    #[msg("Daily limit must be greater than zero")]
    InvalidLimit,
    #[msg("Max transaction size cannot exceed the daily limit")]
    TxSizeExceedsDaily,
    #[msg("Transaction amount exceeds the max transaction size for this sub-wallet")]
    ExceedsMaxTxSize,
    #[msg("Transaction would exceed the daily spending limit for this sub-wallet")]
    ExceedsDailyLimit,
    #[msg("Token is not in the allowed list for this sub-wallet")]
    TokenNotAllowed,
    #[msg("This sub-wallet has been paused by the owner")]
    SubWalletPaused,
    #[msg("Arithmetic overflow")]
    Overflow,
}

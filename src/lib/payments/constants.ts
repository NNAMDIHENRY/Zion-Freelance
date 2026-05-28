export const PAYMENT_LIMITS = {
  minWalletFund: 1,
  maxWalletFund: 50_000,
  minWithdrawal: 10,
  maxWithdrawal: 25_000,
  minEscrowFund: 1,
  maxEscrowFund: 100_000
} as const;

export const FLUTTERWAVE_API_BASE = "https://api.flutterwave.com/v3";

export const PAYMENT_CALLBACK_PATH = "/api/payments/flutterwave/callback";

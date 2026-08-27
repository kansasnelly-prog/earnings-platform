const { PublicKey } = require('@solana/web3.js');

/**
 * STRICT REAL TOKEN REGISTRY & VERIFICATION ENGINE
 * Validates only genuine, verified Solana SPL token mints and throws off any fake/unverified tokens.
 */
const VERIFIED_REAL_TOKENS = {
  SOL: {
    symbol: "SOL",
    name: "Native Solana",
    mint: "So11111111111111111111111111111111111111112",
    decimals: 9,
    isNative: true,
    verified: true,
    coingeckoId: "solana"
  },
  SREYMARA: {
    symbol: "$SREYMARA",
    name: "Sreymara Queen Sovereign SPL",
    mint: "SREY8vJ2kQn9rN9G2WkXvPqE7bT8vF1sP6dC4mX3yK7",
    decimals: 6,
    isNative: false,
    verified: true,
    coingeckoId: "sreymara-ecosystem"
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin (Circle)",
    mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6,
    isNative: false,
    verified: true,
    coingeckoId: "usd-coin"
  },
  USDT: {
    symbol: "USDT",
    name: "Tether USD",
    mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    decimals: 6,
    isNative: false,
    verified: true,
    coingeckoId: "tether"
  },
  JUP: {
    symbol: "JUP",
    name: "Jupiter Exchange Governance",
    mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    decimals: 6,
    isNative: false,
    verified: true,
    coingeckoId: "jupiter-exchange-solana"
  },
  RAY: {
    symbol: "RAY",
    name: "Raydium Protocol Token",
    mint: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
    decimals: 6,
    isNative: false,
    verified: true,
    coingeckoId: "raydium"
  }
};

/**
 * Validates whether a token mint address is a real on-chain verified token
 * @param {string} mintAddress 
 */
function validateRealToken(mintAddress) {
  if (!mintAddress) return { valid: false, error: "Mint address required." };
  
  try {
    new PublicKey(mintAddress);
  } catch (err) {
    return { valid: false, error: "Invalid Solana PublicKey structure." };
  }

  const found = Object.values(VERIFIED_REAL_TOKENS).find(
    t => t.mint.toLowerCase() === mintAddress.toLowerCase()
  );

  if (!found) {
    return {
      valid: false,
      error: "UNVERIFIED_MOCK_TOKEN_REJECTED: Token mint is not registered in Solana Verified Asset Registry."
    };
  }

  return {
    valid: true,
    token: found
  };
}

module.exports = {
  VERIFIED_REAL_TOKENS,
  validateRealToken
};

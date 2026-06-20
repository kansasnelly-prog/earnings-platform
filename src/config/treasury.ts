// 🔒 MASTER TREASURY CONFIGURATION - Multi-Chain Settlement Destinations
// These are the verified master public deposit addresses for all network routing

export const MASTER_TREASURY = {
  BTC: "bc1q3ya2jwvkh968qhmhvpnmgcn4wn2k69tj7q0hnu",
  USDT_TRC20: "TF2qPKJpMusU7EoHjPSb6PqcWaGuZ2iHQ6",
  ETH: "0x9aB7cEe787CC2aD0aE2423f403Ec88d74CAeB6d4",
  BNB_BEP20: "0x9aB7cEe787CC2aD0aE2423f403Ec88d74CAeB6d4",
  LTC: "ltc1qtk2dffsw2ktn7yx6uyahuk73vms60fh95zmlq7",
  TRX: "TF2qPKJpMusU7EoHjPSb6PqcWaGuZ2iHQ6",
  SOL: "4jTdUYsiZDsiWuM2PWzb2EUVh9z9UiCZgacN9q3iUxZL",
  DOGE: "DUMibUZ579eRSZTHrngWNyHrfJrsFPhPeh",
  USDC_BASE: "0x2129797d8e1387600c5D973D8B7d48D4e9D1F296",
  POLYGON: "0x9aB7cEe787CC2aD0aE2423f403Ec88d74CAeB6d4"
} as const;

// Network display names for UI
export const NETWORK_NAMES = {
  BTC: 'Bitcoin',
  USDT_TRC20: 'USDT (TRC20)',
  ETH: 'Ethereum',
  BNB_BEP20: 'BNB (BEP20)',
  LTC: 'Litecoin',
  TRX: 'TRON',
  SOL: 'Solana',
  DOGE: 'Dogecoin',
  USDC_BASE: 'USDC (Base)',
  POLYGON: 'Polygon'
} as const;

// Helper function to get treasury address by network
export function getTreasuryAddress(network: keyof typeof MASTER_TREASURY): string {
  return MASTER_TREASURY[network] || '';
}

// Helper function to get all treasury addresses for display
export function getAllTreasuryAddresses() {
  return Object.entries(MASTER_TREASURY).map(([network, address]) => ({
    network,
    displayName: NETWORK_NAMES[network as keyof typeof NETWORK_NAMES] || network,
    address
  }));
}

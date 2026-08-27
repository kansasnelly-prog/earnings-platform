const fs = require('fs');
const path = require('path');

const STORE_FILE = path.join(__dirname, 'ledger_store.json');

// Default initial ecosystem state for Master Owner (7683177085)
const DEFAULT_MASTER_STATE = {
  telegramId: "7683177085",
  username: "sreymara_executive",
  balanceUsd: 780.50,
  ncCoins: 156100.00,
  referralLevel: 5,
  referralCount: 42,
  solVaultBalance: 3.122,
  safePotBalance: 18.50,
  safePotTarget: 50.00,
  masterWallet: "5uYJ3iVSCnCTVA7Nfr25JTCmE8LPyaAzi",
  claimedStrategies: [],
  transactions: [],
  lastUpdated: new Date().toISOString()
};

let memoryStore = {};

// Load store from disk or initialize default
function loadStore() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf8');
      memoryStore = JSON.parse(raw);
    }
  } catch (err) {
    console.error("Error reading ledger store file:", err);
    memoryStore = {};
  }

  if (!memoryStore["7683177085"]) {
    memoryStore["7683177085"] = { ...DEFAULT_MASTER_STATE };
    saveStore();
  }
}

function saveStore() {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(memoryStore, null, 2), 'utf8');
  } catch (err) {
    console.error("Error writing ledger store file:", err);
  }
}

loadStore();

function getUserState(telegramId = "7683177085") {
  const idStr = String(telegramId);
  if (!memoryStore[idStr]) {
    memoryStore[idStr] = {
      telegramId: idStr,
      username: `user_${idStr.substring(0, 6)}`,
      balanceUsd: 0.00,
      ncCoins: 0.00,
      referralLevel: 1,
      referralCount: 0,
      solVaultBalance: 0.00,
      safePotBalance: 0.00,
      safePotTarget: 50.00,
      masterWallet: "5uYJ3iVSCnCTVA7Nfr25JTCmE8LPyaAzi",
      claimedStrategies: [],
      transactions: [],
      lastUpdated: new Date().toISOString()
    };
    saveStore();
  }
  return memoryStore[idStr];
}

function updateUserState(telegramId = "7683177085", updates = {}) {
  const state = getUserState(telegramId);
  
  if (typeof updates.balanceUsd === 'number') state.balanceUsd = updates.balanceUsd;
  if (typeof updates.ncCoins === 'number') state.ncCoins = updates.ncCoins;
  if (typeof updates.referralLevel === 'number') state.referralLevel = updates.referralLevel;
  if (typeof updates.referralCount === 'number') state.referralCount = updates.referralCount;
  if (typeof updates.solVaultBalance === 'number') state.solVaultBalance = updates.solVaultBalance;
  if (typeof updates.safePotBalance === 'number') state.safePotBalance = updates.safePotBalance;
  if (updates.masterWallet) state.masterWallet = updates.masterWallet;
  if (Array.isArray(updates.claimedStrategies)) state.claimedStrategies = updates.claimedStrategies;
  
  state.lastUpdated = new Date().toISOString();
  saveStore();
  return state;
}

function recordTransaction(telegramId = "7683177085", type, ncAmount, usdValue, details = {}) {
  const state = getUserState(telegramId);
  const tx = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    type: type,
    ncAmount: ncAmount,
    usdValue: usdValue,
    timestamp: new Date().toISOString(),
    details: details
  };
  state.transactions.unshift(tx);
  // Keep last 50 transactions
  if (state.transactions.length > 50) {
    state.transactions = state.transactions.slice(0, 50);
  }
  state.lastUpdated = new Date().toISOString();
  saveStore();
  return tx;
}

module.exports = {
  getUserState,
  updateUserState,
  recordTransaction,
  DEFAULT_MASTER_STATE
};

/**
 * Premium sRGB CSS High-Contrast Logging Templates
 * Protocol 14 Console Log Retrofit - Sapphire, Emerald, Amber Theme Tags
 */

export const logCore = (message: string, data?: any) => {
  try {
    console.log(
      `%c[IRON-CLAD CORE] ${message}`,
      'color: #0EA5E9; font-weight: bold; font-size: 12px;', // Sapphire
      data || ''
    );
  } catch (e) {
    // Silent fail - ensure console/network tabs remain spotless
  }
};

export const logSupabase = (message: string, data?: any) => {
  try {
    console.log(
      `%c[SUPABASE DATA] ${message}`,
      'color: #10B981; font-weight: bold; font-size: 12px;', // Emerald
      data || ''
    );
  } catch (e) {
    // Silent fail
  }
};

export const logNellyCoin = (message: string, data?: any) => {
  try {
    console.log(
      `%c[🪙 NELLYCOIN TRACKER] ${message}`,
      'color: #F59E0B; font-weight: bold; font-size: 12px;', // Amber
      data || ''
    );
  } catch (e) {
    // Silent fail
  }
};

export const logTelegram = (message: string, data?: any) => {
  try {
    console.log(
      `%c[TELEGRAM NOTIFICATION] ${message}`,
      'color: #0EA5E9; font-weight: bold; font-size: 12px;', // Sapphire
      data || ''
    );
  } catch (e) {
    // Silent fail
  }
};

export const logAdmin = (message: string, data?: any) => {
  try {
    console.log(
      `%c[ADMIN ACTION] ${message}`,
      'color: #10B981; font-weight: bold; font-size: 12px;', // Emerald
      data || ''
    );
  } catch (e) {
    // Silent fail
  }
};

export const logError = (message: string, error?: any) => {
  try {
    console.error(
      `%c[ERROR] ${message}`,
      'color: #F59E0B; font-weight: bold; font-size: 12px;', // Amber
      error || ''
    );
  } catch (e) {
    // Silent fail
  }
};

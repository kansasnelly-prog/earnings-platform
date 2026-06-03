/**
 * Premium sRGB CSS High-Contrast Logging Templates
 * Protocol 14 Console Log Retrofit
 */

export const logCore = (message: string, data?: any) => {
  try {
    console.log(
      `%c[IRON-CLAD CORE] ${message}`,
      'color: #8B5CF6; font-weight: bold; font-size: 12px;',
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
      'color: #10B981; font-weight: bold; font-size: 12px;',
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
      'color: #F59E0B; font-weight: bold; font-size: 12px;',
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
      'color: #3B82F6; font-weight: bold; font-size: 12px;',
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
      'color: #EF4444; font-weight: bold; font-size: 12px;',
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
      'color: #DC2626; font-weight: bold; font-size: 12px;',
      error || ''
    );
  } catch (e) {
    // Silent fail
  }
};

export const aiGuardMiddleware = (message: string, trustScore: number) => {
  const forbiddenPatterns = [/whatsapp/i, /add me/i, /my number/i, /contact me/i];
  const isSuspicious = forbiddenPatterns.some(pattern => pattern.test(message));

  if (isSuspicious) {
    return {
      warning: "System Alert: Sensitive information detected. Please maintain safety.",
      trustAdjustment: -15
    };
  }
  
  return { warning: null, trustAdjustment: 0 };
};

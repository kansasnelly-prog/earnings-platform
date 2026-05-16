// Device and browser detection utility for login tracking

export interface DeviceInfo {
  deviceName: string;
  browser: string;
  os: string;
  ipAddress: string;
}

export function getDeviceInfo(): DeviceInfo {
  const userAgent = navigator.userAgent;
  
  // Browser detection
  let browser = 'Unknown';
  if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Chrome')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Safari')) {
    browser = 'Safari';
  } else if (userAgent.includes('Edge')) {
    browser = 'Edge';
  } else if (userAgent.includes('Opera')) {
    browser = 'Opera';
  }
  
  // OS detection
  let os = 'Unknown';
  if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac')) {
    os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
  } else if (userAgent.includes('iOS')) {
    os = 'iOS';
  }
  
  // Device type detection
  let deviceName = 'Desktop';
  if (/Mobile|Android|iP(hone|od)/i.test(userAgent)) {
    deviceName = 'Mobile';
  } else if (/Tablet|iPad/i.test(userAgent)) {
    deviceName = 'Tablet';
  }
  
  // IP address would need to be fetched from a server-side API
  // For now, we'll use a placeholder
  const ipAddress = 'Unknown (server-side detection required)';
  
  return {
    deviceName,
    browser,
    os,
    ipAddress
  };
}

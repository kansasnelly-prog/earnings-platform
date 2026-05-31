
import React from 'react';
import { useCreditBalance } from '../hooks/useCreditBalance';
import { useAuth } from '../contexts/SafeAuthProvider';

const MonetizationBanner: React.FC = () => {
  const { user } = useAuth();
  const { creditBalance } = useCreditBalance();

  // Assuming a "pro" account type or a credit balance greater than 0 indicates a paid user
  const isProUser = user?.account_type === 'pro' || (creditBalance !== null && creditBalance > 0);

  if (isProUser) {
    return null; // Hide banner for Pro users
  }

  return (
    <div className="monetization-banner bg-gray-100 dark:bg-gray-800 p-2 text-center border-b border-gray-200 dark:border-gray-700">
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Support us by upgrading to Pro!</p>
      <div className="ad-container flex justify-center items-center bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden mx-auto"
           style={{ width: '728px', height: '90px' }}>
        {/* Placeholder for actual ad network code (e.g., Google AdSense, Setupad) */}
        <span className="text-gray-400 dark:text-gray-500">Advertisement (728x90)</span>
      </div>
      {/* Responsive ad container for smaller screens */}
      <div className="ad-container mt-2 flex justify-center items-center bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden mx-auto md:hidden"
           style={{ width: '300px', height: '250px' }}>
        <span className="text-gray-400 dark:text-gray-500">Advertisement (300x250)</span>
      </div>
    </div>
  );
};

export default MonetizationBanner;

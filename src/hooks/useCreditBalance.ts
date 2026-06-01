
import { useState, useEffect } from 'react';
import { getUserCredits, deductCredits } from '../services/creditService';
import { useAuth } from '../contexts/SafeAuthProvider'; // Assuming this context provides the current user

export function useCreditBalance() {
  const { user } = useAuth();
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function fetchCreditBalance() {
      if (!user?.id) return;
      // Admin bypass
      if (user.account_type === 'admin') {
        setCreditBalance(999);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      const { credit_balance, error: fetchError } = await getUserCredits(user.id);
      if (fetchError) {
        setError(fetchError);
      } else {
        setCreditBalance(credit_balance);
      }
      setIsLoading(false);
    }
    fetchCreditBalance();
  }, [user]);

  const refreshCreditBalance = async () => {
    if (user?.id) {
      setIsLoading(true);
      setError(null);
      const { credit_balance, error: fetchError } = await getUserCredits(user.id);
      if (fetchError) {
        setError(fetchError);
      } else {
        setCreditBalance(credit_balance);
      }
      setIsLoading(false);
    }
  };

  const spendCredits = async (amount: number): Promise<boolean> => {
    if (!user?.id) {
      setError(new Error('User not authenticated.'));
      return false;
    }
    if (creditBalance === null || creditBalance < amount) {
      setError(new Error('Insufficient credits.'));
      return false;
    }

    const { success, error: deductError } = await deductCredits(user.id, amount);
    if (deductError) {
      setError(deductError);
      return false;
    } else {
      setCreditBalance(prevBalance => (prevBalance !== null ? prevBalance - amount : null));
      return true;
    }
  };

  return { creditBalance, isLoading, error, refreshCreditBalance, spendCredits };
}

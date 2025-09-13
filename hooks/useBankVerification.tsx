import { useState, useCallback } from 'react';
import { verifyBankAccount } from '../services/bankApi';
import { VerificationHookResult } from '../types';

// Cache for verified accounts
const accountCache = new Map<string, string>();

export const useBankVerification = (): VerificationHookResult => {
  const [accountName, setAccountName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const verifyAccount = useCallback(async (accountNumber: string, bankCode: string): Promise<void> => {
    // Reset states
    setAccountName('');
    setError(null);
    
    // Validation checks
    if (!accountNumber || accountNumber.length !== 10) {
      setError('Please enter a valid 10-digit account number');
      return;
    }

    if (!bankCode) {
      setError('Please select a bank');
      return;
    }

    // Check cache first
    const cacheKey = `${bankCode}-${accountNumber}`;
    if (accountCache.has(cacheKey)) {
      setAccountName(accountCache.get(cacheKey)!);
      return;
    }

    setIsLoading(true);

    try {
      console.log('=== useBankVerification: Starting verification ===');
      console.log('useBankVerification: Starting verification...');
      const response = await verifyBankAccount(accountNumber, bankCode);
      
      console.log('=== useBankVerification: Response received ===');
      console.log('useBankVerification: Response received:', response);
      console.log('useBankVerification: Response status:', response.status);
      console.log('useBankVerification: Response data:', response.data);
      
      if (response.status && response.data) {
        console.log('=== useBankVerification: Setting account name ===');
        console.log('useBankVerification: Setting account name:', response.data.account_name);
        setAccountName(response.data.account_name);
        // Cache the result
        accountCache.set(cacheKey, response.data.account_name);
        console.log('useBankVerification: Account name set successfully');
      } else {
        console.log('=== useBankVerification: Verification failed ===');
        console.log('useBankVerification: Verification failed:', response.message);
        setError(response.message || 'Verification failed');
      }
    } catch (err) {
      console.error('useBankVerification: Error occurred:', err);
      setError('An error occurred during verification. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    accountName,
    isLoading,
    error,
    verifyAccount,
  };
};
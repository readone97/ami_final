import React, { useState } from 'react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { testPaystackBanksApi, fetchBanks } from '../services/bankApi';

const PaystackTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [banks, setBanks] = useState<any[]>([]);
  const { toast } = useToast();

  const testPaystackAPI = async () => {
    setIsLoading(true);
    try {
      const result = await testPaystackBanksApi();
      console.log('Paystack API Result:', result);
      
      toast({
        title: "Paystack API Test",
        description: `Successfully fetched ${result.data?.length || 0} banks from Paystack API`,
        variant: "default",
      });
    } catch (error: any) {
      console.error('Paystack API Error:', error);
      toast({
        title: "Paystack API Error",
        description: error.message || 'Failed to fetch banks from Paystack',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testFetchBanks = async () => {
    setIsLoading(true);
    try {
      const result = await fetchBanks();
      console.log('Fetch Banks Result:', result);
      setBanks(result);
      
      toast({
        title: "Fetch Banks Success",
        description: `Successfully loaded ${result.length} banks (${result.length > 20 ? 'from Paystack API' : 'from mock data'})`,
        variant: "default",
      });
    } catch (error: any) {
      console.error('Fetch Banks Error:', error);
      toast({
        title: "Fetch Banks Error",
        description: error.message || 'Failed to fetch banks',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-900 rounded-lg">
      <h3 className="text-lg font-semibold text-white mb-4">Paystack Banks API Test</h3>
      
      <div className="space-y-4">
        <Button
          onClick={testPaystackAPI}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Testing...' : 'Test Paystack Banks API'}
        </Button>
        
        <Button
          onClick={testFetchBanks}
          disabled={isLoading}
          variant="outline"
          className="w-full"
        >
          {isLoading ? 'Loading...' : 'Test Fetch Banks Function'}
        </Button>
        
        {banks.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-300 mb-2">
              Loaded Banks ({banks.length}):
            </h4>
            <div className="max-h-40 overflow-y-auto bg-gray-800 rounded p-2">
              {banks.slice(0, 10).map((bank, index) => (
                <div key={bank.id || index} className="text-xs text-gray-300 py-1">
                  {bank.name} ({bank.code})
                </div>
              ))}
              {banks.length > 10 && (
                <div className="text-xs text-gray-500 py-1">
                  ... and {banks.length - 10} more banks
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaystackTest;

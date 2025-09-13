
import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast"; 
import { Check, Loader2 } from 'lucide-react';
import BankSelector from './BankSelector';
import { useBankVerification } from '../hooks/useBankVerification';
import { useAccountContext } from '../context/AccountContext';
import { getBankNameByCode, testNubanApi, testVerificationProcess } from '../services/bankApi';
import { Bank } from '../types';
import { fetchBanks } from '../services/bankApi';
import { Button } from './ui/button';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface BankAccountFormProps {
  onSuccess: (data: { bankName: string; accountNumber: string; accountName: string }) => void;
}

const BankAccountForm: React.FC<BankAccountFormProps> = ({ onSuccess }) => {
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [selectedBankCode, setSelectedBankCode] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isFormComplete, setIsFormComplete] = useState<boolean>(false);

  const { accountName, isLoading, error, verifyAccount } = useBankVerification();
  
  // Debug account name changes
  console.log('BankDetailsForm: accountName state:', accountName);
  console.log('BankDetailsForm: isLoading state:', isLoading);
  console.log('BankDetailsForm: error state:', error);
  const { saveAccount } = useAccountContext();
   const { toast } = useToast();

  // Monitor account name changes
  useEffect(() => {
    console.log('BankDetailsForm: accountName changed to:', accountName);
  }, [accountName]);

  useEffect(() => {
    const loadBanks = async () => {
      try {
        const banksData = await fetchBanks();
        setBanks(banksData);
      } catch (err) {
        console.error('Error loading banks:', err);
      }
    };

    loadBanks();
  }, []);

  useEffect(() => {
    const isAccountNumberValid = accountNumber.length === 10;
    const isBankSelected = !!selectedBankCode;
    
    console.log('BankDetailsForm: Verification trigger check:', {
      accountNumber,
      selectedBankCode,
      isAccountNumberValid,
      isBankSelected
    });
    
    if (isAccountNumberValid && isBankSelected) {
      console.log('BankDetailsForm: Triggering verification...');
      verifyAccount(accountNumber, selectedBankCode);
    } else {
      console.log('BankDetailsForm: Not triggering verification - conditions not met');
    }
  }, [accountNumber, selectedBankCode, verifyAccount]);

  useEffect(() => {
    if (selectedBankCode && banks.length > 0) {
      setBankName(getBankNameByCode(banks, selectedBankCode));
    } else {
      setBankName('');
    }
  }, [selectedBankCode, banks]);

  useEffect(() => {
    setIsFormComplete(
      accountNumber.length === 10 && 
      !!selectedBankCode && 
      !!accountName && 
      !isLoading && 
      !error
    );
  }, [accountNumber, selectedBankCode, accountName, isLoading, error]);

  const handleAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setAccountNumber(value);
  };

  const handleSelectBank = (code: string) => {
    setSelectedBankCode(code);
  };

  const testDirectApi = async () => {
    if (accountNumber.length === 10 && selectedBankCode) {
      console.log('Testing direct NUBAN API...');
      try {
        const result = await testNubanApi(accountNumber, selectedBankCode);
        console.log('Direct API result:', result);
        
        // Try to extract account name from the result
        let extractedName = '';
        if (result) {
          const possibleNames = [
            result.account_name,
            result.name,
            result.data?.account_name,
            result.accountName,
            result.account_holder,
            result.holder_name,
            result.customer_name,
            result.full_name
          ];
          extractedName = possibleNames.find(name => name && name.trim() !== '') || 'Not found';
        }
        
        toast({
          title: "Direct API Test",
          description: `Account Name: ${extractedName}\nFull Response: ${JSON.stringify(result, null, 2)}`,
          variant: "default",
        });
      } catch (error: any) {
        console.error('Direct API test failed:', error);
        toast({
          title: "Direct API Test Failed",
          description: error.message || 'Unknown error',
          variant: "destructive",
        });
      }
    }
  };

  const testVerification = async () => {
    if (accountNumber.length === 10 && selectedBankCode) {
      console.log('Testing verification process...');
      try {
        const result = await testVerificationProcess(accountNumber, selectedBankCode);
        console.log('Verification result:', result);
        
        toast({
          title: "Verification Test",
          description: `Status: ${result.status}\nAccount Name: ${result.data?.account_name || 'Not found'}\nMessage: ${result.message}`,
          variant: "default",
        });
      } catch (error: any) {
        console.error('Verification test failed:', error);
        toast({
          title: "Verification Test Failed",
          description: error.message || 'Unknown error',
          variant: "destructive",
        });
      }
    }
  };


  
//   const handleSubmit = (e: React.FormEvent) => {
//   e.preventDefault();

//   if (isFormComplete) {
//     saveAccount({
//       accountNumber,
//       accountName,
//       bankCode: selectedBankCode,
//       bankName,
//     });
//     // Notify parent of success
//     onSuccess({
//       bankName,
//       accountNumber,
//       accountName,
//     });
//   }
// };
const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isFormComplete) {
      saveAccount({
        accountNumber,
        accountName,
        bankCode: selectedBankCode,
        bankName,
      });
      onSuccess({
        bankName,
        accountNumber,
        accountName,
      });
      toast({
        title: "Bank saved successfully",
        variant: "default",
      });
      // Reset form fields
      setAccountNumber("");
      setSelectedBankCode("");
      setBankName("");
      // Optionally reset accountName if your hook allows it
      // setAccountName("");
    }
  };


  return (
    <div className="w-full max-w-md mx-auto">
      <form 
        onSubmit={handleSubmit}
        className="bg-gray-900 shadow-xl rounded-xl p-6 border border-gray-800"
      >
        <h2 className="text-2xl font-semibold text-white mb-6">Bank Account Details</h2>
        
        <div className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="bank" className="block text-sm font-medium text-gray-300">
              Select Bank
            </label>
            <BankSelector 
              selectedBank={selectedBankCode} 
              onSelectBank={handleSelectBank}
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-300">
              Account Number
            </label>
            <input
              type="text"
              id="accountNumber"
              value={accountNumber}
              onChange={handleAccountNumberChange}
              placeholder="Enter 10-digit account number"
              disabled={isLoading}
              className={`
                w-full p-3 border rounded-lg transition-all duration-200 bg-gray-800 text-white
                ${accountNumber.length === 10 ? 'border-green-500' : 'border-gray-700'}
                ${isLoading ? 'bg-gray-700' : 'bg-gray-800'}
                focus:outline-none focus:ring-2 focus:ring-green-500
              `}
            />
            {accountNumber && accountNumber.length !== 10 && (
              <p className="text-sm text-amber-500">Account number must be 10 digits</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="accountName" className="block text-sm font-medium text-gray-300">
              Account Name
            </label>
            <div className="relative">
              <input
                type="text"
                id="accountName"
                value={accountName}
                readOnly
                placeholder="Account name will appear here"
                className={`
                  w-full p-3 border rounded-lg bg-gray-800 text-white
                  ${accountName ? 'border-green-500' : 'border-gray-700'}
                `}
              />
              {isLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 size={20} className="animate-spin text-green-500" />
                </div>
              )}
              {accountName && !isLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Check size={20} className="text-green-500" />
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="bankName" className="block text-sm font-medium text-gray-300">
              Bank Name
            </label>
            <input
              type="text"
              id="bankName"
              value={bankName}
              readOnly
              placeholder="Bank name will appear here"
              className={`
                w-full p-3 border rounded-lg bg-gray-800 text-white
                ${bankName ? 'border-green-500' : 'border-gray-700'}
              `}
            />
          </div>
          
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-800 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}


          
          <Button
            type="submit"
            disabled={!isFormComplete}
            className={`
              w-full py-3 px-4 rounded-lg font-medium text-white
              transition-all duration-200 flex items-center justify-center
              ${isFormComplete 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-gray-700 cursor-not-allowed'
              }
            `}
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin mr-2" />
                Verifying...
              </>
            ) : (
              'Save Account'
            )}
          </Button>
        </div>
          <ToastContainer position="top-right" />
      </form>
    </div>
  );
};

export default BankAccountForm;


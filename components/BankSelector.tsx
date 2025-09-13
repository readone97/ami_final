import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Bank } from '../types';
import { fetchBanks } from '../services/bankApi';

interface BankSelectorProps {
  selectedBank: string;
  onSelectBank: (code: string) => void;
  disabled?: boolean;
}

const BankSelector: React.FC<BankSelectorProps> = ({ 
  selectedBank, 
  onSelectBank,
  disabled = false
}) => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const loadBanks = async () => {
      try {
        const banksData = await fetchBanks();
        setBanks(banksData);
      } catch (err) {
        setError('Failed to load banks');
        console.error('Error loading banks:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadBanks();
  }, []);

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelectBank = (code: string, name: string) => {
    onSelectBank(code);
    setIsOpen(false);
  };

  const getSelectedBankName = (): string => {
    if (!selectedBank) return 'Select Bank';
    const bank = banks.find(b => b.code === selectedBank);
    return bank ? bank.name : 'Select Bank';
  };

  const filteredBanks = banks.filter(bank => 
    bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.code.includes(searchTerm)
  ).sort((a, b) => {
    // Sort by tier: Tier 1 banks first, then Tier 2, then others
    const tier1Banks = ['044', '011', '058', '033', '057']; // Big 5
    const tier2Banks = ['214', '070', '232', '032', '215', '035']; // Tier 2
    
    const aIsTier1 = tier1Banks.includes(a.code);
    const bIsTier1 = tier1Banks.includes(b.code);
    const aIsTier2 = tier2Banks.includes(a.code);
    const bIsTier2 = tier2Banks.includes(b.code);
    
    if (aIsTier1 && !bIsTier1) return -1;
    if (!aIsTier1 && bIsTier1) return 1;
    if (aIsTier2 && !bIsTier2 && !bIsTier1) return -1;
    if (!aIsTier2 && bIsTier2 && !aIsTier1) return 1;
    
    // Then sort alphabetically within each tier
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="relative w-full">
      <div 
        className={`
          flex items-center justify-between p-3 border rounded-lg cursor-pointer
          transition-all duration-200 ease-in-out text-white
          ${disabled ? 'bg-gray-700 cursor-not-allowed' : 'bg-gray-800 hover:border-green-500'}
          ${selectedBank ? 'border-green-500' : 'border-gray-700'}
        `}
        onClick={toggleDropdown}
      >
        <span className={`${selectedBank ? 'text-white' : 'text-gray-400'}`}>
          {isLoading ? 'Loading banks...' : getSelectedBankName()}
        </span>
        <ChevronDown 
          size={20} 
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} 
        />
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-gray-900 border border-gray-800 rounded-lg shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-800">
            <input
              type="text"
              placeholder="Search banks by name or code..."
              className="w-full p-2 border border-gray-700 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <div className="text-xs text-gray-400 mt-1">
                {filteredBanks.length} bank{filteredBanks.length !== 1 ? 's' : ''} found
              </div>
            )}
          </div>
          <div className="max-h-60 overflow-y-auto">
            {error ? (
              <div className="p-3 text-red-400">{error}</div>
            ) : isLoading ? (
              <div className="p-3 text-gray-400">Loading banks...</div>
            ) : filteredBanks.length === 0 ? (
              <div className="p-3 text-gray-400">No banks found</div>
            ) : (
              <div>
                {filteredBanks.map((bank) => {
                  const isTier1 = ['044', '011', '058', '033', '057'].includes(bank.code);
                  const isTier2 = ['214', '070', '232', '032', '215', '035'].includes(bank.code);
                  const isDevelopment = ['001', '002', '003', '004'].includes(bank.code);
                  const isMicrofinance = bank.code >= '090';
                  
                  return (
                    <div
                      key={bank.id}
                      className="p-3 hover:bg-gray-800 cursor-pointer transition-colors duration-150 text-white border-b border-gray-800 last:border-b-0"
                      onClick={() => handleSelectBank(bank.code, bank.name)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{bank.name}</div>
                          {/* <div className="text-xs text-gray-400">Code: {bank.code}</div> */}
                        </div>
                        {/* <div className="text-xs text-gray-500">
                          {isTier1 && '🏦 Tier 1'}
                          {isTier2 && '🏢 Tier 2'}
                          {isDevelopment && '🏛️ Development'}
                          {isMicrofinance && '🏪 Microfinance'}
                          {!isTier1 && !isTier2 && !isDevelopment && !isMicrofinance && '🏦 Commercial'}
                        </div> */}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BankSelector;
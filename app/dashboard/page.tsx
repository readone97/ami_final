"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Line } from "react-chartjs-2";
import {
  Chart,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
} from "chart.js";
Chart.register(LineElement, PointElement, LinearScale, CategoryScale);

import { redirect, useRouter, usePathname } from "next/navigation";
import {
  Bell,
  ChevronDown,
  CreditCard,
  ExternalLink,
  History,
  LogOut,
  RefreshCw,
  Settings,
  User,
  Wallet,
  ArrowUpRight,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { clusterApiUrl } from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import BankAccountForm from "@/components/bank-details-form";
import { TokenCard } from "@/components/token-card";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { useWallet } from "@solana/wallet-adapter-react";
import { truncateAddress } from "@/lib/utils"; // TODO: Fix missing module
import AppHeader from "@/components/app-header";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import React from "react";
import { useAuth } from "@/context/auth-context";
import { getConnection } from "@/lib/jupiter";
import { cn } from "@/lib/utils";
import BankDetailsForm from "@/components/bank-details-form";
import { ToastContainer } from "react-toastify";
import { supabase } from "@/lib/supabase/client";
import { Sidebar, HamburgerMenu } from "@/components/sidebar";

const TOKEN_LIST_URL =
  "https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/src/tokens/solana.tokenlist.json";

const RPC_ENDPOINT ="https://convincing-billowing-field.solana-mainnet.quiknode.pro/8a3b98de08f6626841436e1088ae6ce695da0b10/";

// Rate reduction constant - reduces USD/NGN rate by this amount
const USD_NGN_RATE_REDUCTION = 2;

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { connected, publicKey } = useWallet();
  const [showPinSetup, setShowPinSetup] = useState(true);
  const [showConversionConfirmation, setShowConversionConfirmation] =
    useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [totalBalance, setTotalBalance] = useState("$2,724.75");
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [balanceChange, setBalanceChange] = useState("+2.8%");
  const [splTokens, setSplTokens] = useState<
    { tokenAccount: string; mint: string; amount: number; decimals: number }[]
  >([]);
  const [isFetchingSplTokens, setIsFetchingSplTokens] = useState(false);
  const [tokenMap, setTokenMap] = useState<
    Record<string, { logoURI?: string; symbol?: string; name?: string }>
  >({});
  const [isLoadingTokenList, setIsLoadingTokenList] = useState(true);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Add user verification state
  const [isUserVerified, setIsUserVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  // Token Image Component with fallback handling
  const TokenImage = ({ 
    mint, 
    symbol, 
    logoURLs 
  }: { 
    mint: string; 
    symbol?: string; 
    logoURLs: string[]; 
  }) => {
    const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
    const [hasError, setHasError] = useState(false);
    
    const handleImageError = () => {
      if (currentUrlIndex < logoURLs.length - 1) {
        setCurrentUrlIndex(prev => prev + 1);
        setHasError(false);
      } else {
        setHasError(true);
      }
    };

    const handleImageLoad = () => {
      setHasError(false);
    };

    // Reset when logoURLs change
    useEffect(() => {
      setCurrentUrlIndex(0);
      setHasError(false);
    }, [logoURLs]);

    if (hasError || !logoURLs || logoURLs.length === 0 || currentUrlIndex >= logoURLs.length) {
      return (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center font-bold text-xs text-primary border border-primary/20">
          {symbol?.[0]?.toUpperCase() || mint.slice(0, 2).toUpperCase()}
        </div>
      );
    }

    return (
      <img
        src={logoURLs[currentUrlIndex]}
        alt={symbol || 'Token'}
        className="w-7 h-7 rounded-full border border-muted object-cover"
        onError={handleImageError}
        onLoad={handleImageLoad}
        loading="lazy"
      />
    );
  };

  const [walletConnected, setWalletConnected] = useState(true);
  const [bankAccount, setBankAccount] = useState({
    bankName: "Bank Name ",
    accountNumber: "  ",
    accountName: " ",
  });
  const [swapAmount, setSwapAmount] = useState("");
  const [swapFrom, setSwapFrom] = useState("bonk");
  const [swapTo, setSwapTo] = useState("usdc");
  const [swapToAmount, setSwapToAmount] = useState("0.00");
  const [convertAmount, setConvertAmount] = useState("");
  const [convertFrom, setConvertFrom] = useState("usdt");
  const [convertTo, setConvertTo] = useState("ngn");
  const [convertToAmount, setConvertToAmount] = useState("0.00");
  const [exchangeRates, setExchangeRates] = useState({
    bonk_usdc: 0.00001,
    sol_usdc: 100,
    usdt_ngn: 1550,
    usdc_ngn: 1545,
    sol_ngn: 155000,
  });
  const [nairaRates, setNairaRates] = useState({
    usdt_ngn: [],
    usdc_ngn: [],
    sol_ngn: [],
  });
  const [rateTrends, setRateTrends] = useState<{
    usdt_ngn: number[];
    usdc_ngn: number[];
    sol_ngn: number[];
  }>({
    usdt_ngn: [],
    usdc_ngn: [],
    sol_ngn: [],
  });
  const [rateIncrements, setRateIncrements] = useState<{
    usdt_ngn: number;
    usdc_ngn: number;
    sol_ngn: number;
  }>({
    usdt_ngn: 0,
    usdc_ngn: 0,
    sol_ngn: 0,
  });

  const { toast } = useToast();
  const [isSwapping, setIsSwapping] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const { setVisible } = useWalletModal();
  const { autoConnect, wallet, connect, disconnect } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

 
  const navItems = [
    { name: "Overview", path: "/dashboard" },
    { name: "Swap", path: "/swap" },
    { name: "Convert", path: "/convert" },
    // { name: "History", path: "/history" },
  ];

  // Check wallet connection and user existence
  useEffect(() => {
    const checkUserAuthentication = async () => {
      console.log("Starting user authentication check...");
      
      if (!connected || !publicKey) {
        console.log("No wallet connected, redirecting to login")
        setIsVerifying(false);
        router.push("/login");
        return;
      }

      // First check localStorage verification flag
      const isVerified = localStorage.getItem('userVerified');
      const verifiedWallet = localStorage.getItem('verifiedWallet');
      
      if (isVerified === 'true' && verifiedWallet === publicKey.toString()) {
        console.log("User already verified via localStorage");
        setIsUserVerified(true);
        setIsVerifying(false);
        return;
      }

      // If not verified in localStorage, check database
      try {
        console.log("Checking if user exists in database:", publicKey.toString())
        setIsVerifying(true);
        
        const { data, error } = await supabase
          .from("profiles")
          .select("id, auth_user_id, wallet_address, username, email")
          .eq("wallet_address", publicKey.toString())
          .maybeSingle();

        if (error) {
          console.error("Database error checking user:", error)
          console.error("Full error object:", JSON.stringify(error, null, 2))
          console.error("Error details:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          
          localStorage.removeItem('userVerified');
          localStorage.removeItem('verifiedWallet');
          toast({
            title: "Database Error",
            description: `Failed to verify your account: ${error.message || 'Unknown database error'}`,
            variant: "destructive",
          })
          setIsVerifying(false);
          router.push("/login");
          return;
        }

        if (!data) {
          console.log("User not found in database, redirecting to login")
          localStorage.removeItem('userVerified');
          localStorage.removeItem('verifiedWallet');
          toast({
            title: "Account Required",
            description: "Please register or log in to access the dashboard.",
            variant: "destructive",
          })
          setIsVerifying(false);
          router.push("/login");
          return;
        }

        console.log("User authenticated successfully:", data)
        // Set verification flags
        localStorage.setItem('userVerified', 'true');
        localStorage.setItem('verifiedWallet', publicKey.toString());
        setIsUserVerified(true);
        setIsVerifying(false);
      } catch (error) {
        console.error("Error checking user authentication:", error)
        localStorage.removeItem('userVerified');
        localStorage.removeItem('verifiedWallet');
        setIsVerifying(false);
        router.push("/login");
      }
    };

    checkUserAuthentication();
  }, [connected, publicKey, router, toast]);

  // Clear verification flags when wallet is disconnected
  useEffect(() => {
    if (!connected || !publicKey) {
      localStorage.removeItem('userVerified');
      localStorage.removeItem('verifiedWallet');
      setIsUserVerified(false);
    }
  }, [connected, publicKey]);

  const saveBankAccountToDbAlternative = async (data: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  }) => {
    if (!publicKey) {
      return { error: "No wallet connected" };
    }

    const walletAddress = publicKey.toString();

    try {
      // Try to insert first (for new users)
      const { data: insertData, error: insertError } = await supabase
        .from("profiles")
        .insert({
          wallet_address: walletAddress,
          bank_name: data.bankName,
          account_number: data.accountNumber,
          account_name: data.accountName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select();

      if (insertError) {
        // If insert fails due to duplicate wallet_address, try update
        if (insertError.code === '23505' || insertError.message.includes('duplicate')) {
          const { data: updateData, error: updateError } = await supabase
            .from("profiles")
            .update({
              bank_name: data.bankName,
              account_number: data.accountNumber,
              account_name: data.accountName,
              updated_at: new Date().toISOString(),
            })
            .eq("wallet_address", walletAddress)
            .select();

          if (updateError) {
            console.error("Update error:", updateError);
            return { error: `Failed to update bank details: ${updateError.message}` };
          }

          return { error: null, data: updateData };
        } else {
          console.error("Insert error:", insertError);
          return { error: `Failed to save bank details: ${insertError.message}` };
        }
      }

      return { error: null, data: insertData };
    } catch (error) {
      console.error("Database operation failed:", error);
      return { error: `Database operation failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  };

  // Fixed removeBankAccountFromDb function
  const removeBankAccountFromDb = async () => {
    if (!publicKey) {
      return { error: "No wallet connected" };
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          bank_name: null,
          account_number: null,
          account_name: null,
          updated_at: new Date().toISOString(),
        })
        .eq("wallet_address", publicKey.toString());

      if (error) {
        console.error("Remove error:", error);
        return { error: `Failed to remove bank details: ${error.message}` };
      }

      return { error: null };
    } catch (error) {
      console.error("Failed to remove bank details:", error);
      return { error: `Failed to remove bank details: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  };

  // Fixed fetchBankAccount function - This should not cause errors for new users
  useEffect(() => {
    const fetchBankAccount = async () => {
      if (!publicKey) {
        setBankAccount({
          bankName: "",
          accountNumber: "",
          accountName: "",
        });
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("bank_name, account_number, account_name")
          .eq("wallet_address", publicKey.toString())
          .maybeSingle(); // Use maybeSingle() instead of single() to avoid errors when no record exists

        // maybeSingle() returns null when no record exists, without throwing an error
        if (error) {
          console.error("Error fetching bank details:", error);
          setBankAccount({
            bankName: "",
            accountNumber: "",
            accountName: "",
          });
          return;
        }

        if (data) {
          setBankAccount({
            bankName: data.bank_name || "",
            accountNumber: data.account_number || "",
            accountName: data.account_name || "",
          });
        } else {
          // No record exists - set empty values
          setBankAccount({
            bankName: "",
            accountNumber: "",
            accountName: "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch bank account:", error);
        setBankAccount({
          bankName: "",
          accountNumber: "",
          accountName: "",
        });
      }
    };

    fetchBankAccount();
  }, [publicKey]);

  // Fixed UI handlers with better error handling
  const handleSaveBankAccount = async (data: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  }) => {
    try {
      const result = await saveBankAccountToDbAlternative(data);
      
      if (result.error) {
        console.error("Save error:", result.error);
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        setBankAccount(data);
        toast({
          title: "Bank Account Added",
          description: "Your bank account has been successfully added.",
          variant: "default",
        });
        // Close the dialog if you have access to setOpen function
        // setOpen(false);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveBankAccount = async () => {
    try {
      const result = await removeBankAccountFromDb();
      
      if (result.error) {
        console.error("Remove error:", result.error);
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        setBankAccount({
          bankName: "",
          accountNumber: "",
          accountName: "",
        });
        toast({
          title: "Bank Account Removed",
          description: "Your bank account has been removed.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTokens((prevTokens) => {
        return prevTokens.map((token) => ({
          ...token,
          change: `${Math.random() > 0.5 ? "+" : "-"}${(
            Math.random() * 5
          ).toFixed(1)}%`,
        }));
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Add this useEffect for automatic rate updates
  useEffect(() => {
    // Update rates every 60 seconds
    const rateInterval = setInterval(() => {
      // Add some randomness to simulate market fluctuations
      const fluctuation = () => 1 + (Math.random() * 0.02 - 0.01); // ±1% change

      setExchangeRates((prev) => ({
        ...prev,
        usdt_ngn: prev.usdt_ngn * fluctuation(),
        usdc_ngn: prev.usdc_ngn * fluctuation(),
        sol_ngn: prev.sol_ngn * fluctuation(),
      }));
    }, 60000);

    return () => clearInterval(rateInterval);
  }, []);
  useEffect(() => {
    const fetchRates = async () => {
      try {
        // Fetch USD/NGN, USDT/USD, USDC/USD, SOL/USD from CoinGecko
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=usd,usd-coin,tether,solana&vs_currencies=ngn,usd"
        );
        const data = await res.json();

        const usd_ngn = data.usd.ngn ; // Reduce USD/NGN by constant
        const sol_usd = data.solana.usd;
        const usdt_usd = data.tether.usd;
        const usdc_usd = data["usd-coin"].usd;

        // Calculate rates with reduced USD/NGN
        const usdt_ngn = usd_ngn * usdt_usd; // USDT/NGN
        const usdc_ngn = usd_ngn * usdc_usd; // USDC/NGN
        const sol_ngn = sol_usd * usd_ngn; // SOL/NGN

        // Update rolling trend history (last 20 points)
        setRateTrends((prev) => ({
          usdt_ngn: [...prev.usdt_ngn.slice(-19), usdt_ngn],
          usdc_ngn: [...prev.usdc_ngn.slice(-19), usdc_ngn],
          sol_ngn: [...prev.sol_ngn.slice(-19), sol_ngn],
        }));

        // Calculate increment rates
        setRateIncrements((prev) => ({
          usdt_ngn:
            prev.usdt_ngn > 0
              ? ((usdt_ngn - prev.usdt_ngn) / prev.usdt_ngn) * 100
              : 0,
          usdc_ngn:
            prev.usdc_ngn > 0
              ? ((usdc_ngn - prev.usdc_ngn) / prev.usdc_ngn) * 100
              : 0,
          sol_ngn:
            prev.sol_ngn > 0
              ? ((sol_ngn - prev.sol_ngn) / prev.sol_ngn) * 100
              : 0,
        }));

        // Update latest rates
        setExchangeRates((prev) => ({
          ...prev,
          usdt_ngn,
          usdc_ngn,
          sol_ngn,
        }));
      } catch (err) {
        console.error("Failed to fetch FX rates", err);
      }
    };

    fetchRates();
    const interval = setInterval(fetchRates, 15000); // update every 15s
    return () => clearInterval(interval);
  }, []);

  //live trend
  const TrendChart = ({
    data,
    color = "#22c55e",
  }: {
    data: number[];
    color?: string;
  }) => (
    <div style={{ width: "100%", height: 50 }}>
      <Line
        data={{
          labels: data.map((_, i) => i + 1),
          datasets: [
            {
              data,
              borderColor: color,
              backgroundColor: "rgba(34,197,94,0.1)",
              tension: 0.4,
              pointRadius: 0,
            },
          ],
        }}
        options={{
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { display: false },
            y: { display: false },
          },
        }}
        height={50}
      />
    </div>
  );

  // Handle swap amount change
  useEffect(() => {
    if (swapAmount && !isNaN(Number.parseFloat(swapAmount))) {
      const amount = Number.parseFloat(swapAmount);
      let rate = 0;

      if (swapFrom === "bonk" && swapTo === "usdc") {
        rate = exchangeRates.bonk_usdc;
      } else if (swapFrom === "sol" && swapTo === "usdc") {
        rate = exchangeRates.sol_usdc;
      }

      const result = (amount * rate).toFixed(2);
      setSwapToAmount(result);
    } else {
      setSwapToAmount("0.00");
    }
  }, [swapAmount, swapFrom, swapTo, exchangeRates]);

  // Handle convert amount change
  useEffect(() => {
    if (convertAmount && !isNaN(Number.parseFloat(convertAmount))) {
      const amount = Number.parseFloat(convertAmount);
      let rate = 0;

      if (convertFrom === "usdt" && convertTo === "ngn") {
        rate = exchangeRates.usdt_ngn;
      } else if (convertFrom === "usdc" && convertTo === "ngn") {
        rate = exchangeRates.usdc_ngn;
      } else if (convertFrom === "sol" && convertTo === "ngn") {
        rate = exchangeRates.sol_ngn;
      }

      const result = (amount * rate).toFixed(2);
      setConvertToAmount(result.replace(/\B(?=(\d{3})+(?!\d))/g, ","));
    } else {
      setConvertToAmount("0.00");
    }
  }, [convertAmount, convertFrom, convertTo, exchangeRates]);

  const handleConnectWallet = async () => {
    try {
      if (!connected) {
        await setVisible(true);
      } else {
        await disconnect();
        await setVisible(true);
      }

      setWalletConnected(true);
      toast({
        title: "Wallet Connected",
        description: "Your wallet has been successfully connected.",
        variant: "default",
      });
    } catch (error) {
      console.log(error);
      toast({
        title: "Wallet Connect Error",
        description: "Your wallet failed to connect",
        variant: "destructive",
      });
    }
  };

  const handleDisconnectWallet = () => {
    setWalletConnected(false);
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected.",
      variant: "default",
    });
  };

  // Get SOL balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!publicKey) return;

      try {
        setIsLoading(true);
        const connection = new Connection(RPC_ENDPOINT, "confirmed");
        const balance = await connection.getBalance(publicKey);
        setSolBalance(balance / LAMPORTS_PER_SOL);
      } catch (error) {
        console.error("Error fetching balance:", error);
        toast({
          title: "Error",
          description: "Failed to fetch wallet balance. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (connected) {
      fetchBalance();
      // Set up a refresh interval (every 10 seconds)
      const interval = setInterval(fetchBalance, 10000);
      return () => clearInterval(interval);
    } else {
      setSolBalance(null);
    }
  }, [publicKey, connected, toast]);
  //spl-tokens and Jupiter token list
  useEffect(() => {
    const fetchTokenLists = async () => {
    setIsLoadingTokenList(true);
      
      try {
        // Try to fetch from multiple sources for better coverage
        const [officialResponse, jupiterResponse] = await Promise.allSettled([
          fetch(TOKEN_LIST_URL),
          fetch('https://token.jup.ag/all')
        ]);

        const map: Record<string, { logoURI?: string; symbol?: string; name?: string }> = {};
        
        // Process official Solana token list
        if (officialResponse.status === 'fulfilled' && officialResponse.value.ok) {
          const officialData = await officialResponse.value.json();
          if (officialData.tokens && Array.isArray(officialData.tokens)) {
            officialData.tokens.forEach((token: { address: string; logoURI?: string; symbol?: string; name?: string }) => {
            map[token.address] = {
              logoURI: token.logoURI,
              symbol: token.symbol,
              name: token.name
            };
          });
        }
        }
        
        // Process Jupiter token list (has better coverage)
        if (jupiterResponse.status === 'fulfilled' && jupiterResponse.value.ok) {
          const jupiterData = await jupiterResponse.value.json();
          if (Array.isArray(jupiterData)) {
            jupiterData.forEach((token: { address: string; logoURI?: string; symbol?: string; name?: string }) => {
              // Only overwrite if we don't have this token yet or if Jupiter has better data
              if (!map[token.address] || (!map[token.address].logoURI && token.logoURI)) {
                map[token.address] = {
                  logoURI: token.logoURI || map[token.address]?.logoURI,
                  symbol: token.symbol || map[token.address]?.symbol,
                  name: token.name || map[token.address]?.name
                };
              }
            });
          }
        }
        
        setTokenMap(map);
        console.log(`Loaded ${Object.keys(map).length} tokens from combined token lists`);
      } catch (error) {
        console.error('Failed to fetch token lists:', error);
        // Set empty map but don't block the app - fallbacks will handle this
        setTokenMap({});
      } finally {
        setIsLoadingTokenList(false);
      }
    };

    fetchTokenLists();
  }, []);

  // Enhanced token logo resolution function with multiple fallbacks
  const getTokenLogo = (mint: string, symbol?: string): string[] => {
    const urls: string[] = [];
    
    // First try to get from token lists
    const tokenInfo = tokenMap[mint];
    if (tokenInfo?.logoURI) {
      urls.push(tokenInfo.logoURI);
    }

    // Fallback to well-known token logos
    const knownTokenLogos: Record<string, string[]> = {
      'So11111111111111111111111111111111111111112': [
        'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
        'https://cryptologos.cc/logos/solana-sol-logo.png'
      ],
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': [
        'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
        'https://cryptologos.cc/logos/usd-coin-usdc-logo.png'
      ],
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': [
        'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg',
        'https://cryptologos.cc/logos/tether-usdt-logo.png'
      ],
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': [
        'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263/logo.png',
        'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I'
      ],
      'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': [
        'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So/logo.png'
      ],
      'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn': [
        'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn/logo.png'
      ],
      '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs': [
        'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs/logo.png',
        'https://cryptologos.cc/logos/ethereum-eth-logo.png'
      ],
      'A9mUU4qviSctJVPJdBJWkb28deg915LYJKrzQ19ji3FM': [
        'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/A9mUU4qviSctJVPJdBJWkb28deg915LYJKrzQ19ji3FM/logo.png'
      ],
      '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E': [
        'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E/logo.png',
        'https://cryptologos.cc/logos/bitcoin-btc-logo.png'
      ],
    };

    if (knownTokenLogos[mint]) {
      urls.push(...knownTokenLogos[mint]);
    }

    // Add constructed URLs as additional fallbacks
    urls.push(
      `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${mint}/logo.png`,
      `https://img.fotofolio.xyz/?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolana-labs%2Ftoken-list%2Fmain%2Fassets%2Fmainnet%2F${mint}%2Flogo.png`,
      `https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/solana/assets/${mint}/logo.png`
    );

    // Remove duplicates
    return [...new Set(urls)];
  };

  // Handle image load errors and try next fallback
  const handleImageError = (mint: string, currentIndex: number, totalUrls: number) => {
    if (currentIndex < totalUrls - 1) {
      setImageErrors(prev => ({
        ...prev,
        [`${mint}-${currentIndex}`]: true
      }));
    }
  };

  // Get the current image URL to display
  const getCurrentImageUrl = (mint: string, urls: string[]): string | null => {
    for (let i = 0; i < urls.length; i++) {
      if (!imageErrors[`${mint}-${i}`]) {
        return urls[i];
      }
    }
    return null;
  };

  // Enhanced token metadata resolution
  const getTokenMetadata = (mint: string) => {
    // First try token lists
    const tokenInfo = tokenMap[mint];
    if (tokenInfo) {
      return {
        symbol: tokenInfo.symbol || 'UNKNOWN',
        name: tokenInfo.name || 'Unknown Token',
        logoURLs: getTokenLogo(mint, tokenInfo.symbol)
      };
    }

    // Fallback for well-known tokens
    const knownTokens: Record<string, { symbol: string; name: string }> = {
      'So11111111111111111111111111111111111111112': { symbol: 'SOL', name: 'Solana' },
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { symbol: 'USDC', name: 'USD Coin' },
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { symbol: 'USDT', name: 'Tether USD' },
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': { symbol: 'BONK', name: 'Bonk' },
      'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': { symbol: 'mSOL', name: 'Marinade staked SOL' },
      'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn': { symbol: 'jitoSOL', name: 'Jito Staked SOL' },
      '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs': { symbol: 'ETH', name: 'Ethereum' },
      'A9mUU4qviSctJVPJdBJWkb28deg915LYJKrzQ19ji3FM': { symbol: 'USDCet', name: 'USD Coin (Ethereum)' },
      '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E': { symbol: 'BTC', name: 'Bitcoin' },
      'Ar7sXXgS88ahnwypXVKdBQJP5oDkqnJPKKrtmYs8EYb6': { symbol: 'ARB', name: 'Arbitrum' },
      'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3npyMucVvWgd2W': { symbol: 'JTO', name: 'Jito' },
      'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof': { symbol: 'RND', name: 'Render' },
      'SHDWyBxihqiCj6YekG2GUr7wqKLeLAMK1gHZck9pL6y': { symbol: 'SHDW', name: 'Shadow' },
    };

    const knownToken = knownTokens[mint];
    if (knownToken) {
      return {
        symbol: knownToken.symbol,
        name: knownToken.name,
        logoURLs: getTokenLogo(mint, knownToken.symbol)
      };
    }

    // Ultimate fallback
    return {
      symbol: mint.slice(0, 4).toUpperCase(),
      name: 'Unknown Token',
      logoURLs: getTokenLogo(mint)
    };
  };

  // Fetch SPL tokens
  useEffect(() => {
    const fetchSplTokens = async () => {
      if (!publicKey) {
        setSplTokens([]);
        return;
      }

      setIsFetchingSplTokens(true);
      try {
        const connection = new Connection(RPC_ENDPOINT, "confirmed");
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          {
            programId: TOKEN_PROGRAM_ID,
          }
        );

        const tokens = tokenAccounts.value
          .map(({ pubkey, account }) => {
            const parsed = account.data.parsed.info;
            const mint = parsed.mint;
            const amount = parsed.tokenAmount.uiAmount || 0;
            const decimals = parsed.tokenAmount.decimals;
            return {
              tokenAccount: pubkey.toBase58(),
              mint,
              amount,
              decimals,
            };
          })
          // Show all tokens, including zero balance ones (user might want to see what they've held)
          // But prioritize non-zero balances
          .sort((a, b) => {
            if (a.amount > 0 && b.amount === 0) return -1;
            if (a.amount === 0 && b.amount > 0) return 1;
            return b.amount - a.amount; // Sort by balance descending
          });

        setSplTokens(tokens);
      } catch (error) {
        console.error("Error fetching SPL tokens:", error);
        toast({
          title: "Error",
          description: "Failed to fetch SPL tokens. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsFetchingSplTokens(false);
      }
    };

    if (connected && publicKey) {
      fetchSplTokens();
      const interval = setInterval(fetchSplTokens, 30000);
      return () => clearInterval(interval);
    } else {
      setSplTokens([]);
    }
  }, [connected, publicKey, toast]);

  const handleSwapTokens = () => {
    if (
      !swapAmount ||
      isNaN(Number.parseFloat(swapAmount)) ||
      Number.parseFloat(swapAmount) <= 0
    ) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to swap.",
        variant: "destructive",
      });
      return;
    }

    // Show loading state
    setIsSwapping(true);

    // Simulate API call with a slight delay to show loading state
    setTimeout(() => {
      // Update token balances after swap
      setTokens((prevTokens) => {
        return prevTokens.map((token) => {
          if (token.symbol.toLowerCase() === swapFrom.toUpperCase()) {
            // Decrease the balance of the token being swapped
            const currentBalance = Number.parseFloat(
              token.balance.replace(/,/g, "")
            );
            const newBalance = currentBalance - Number.parseFloat(swapAmount);
            return {
              ...token,
              balance: newBalance
                .toFixed(2)
                .replace(/\B(?=(\d{3})+(?!\d))/g, ","),
              value: `$${(
                (newBalance *
                  Number.parseFloat(token.value.replace(/[$,]/g, ""))) /
                currentBalance
              )
                .toFixed(2)
                .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`,
            };
          } else if (token.symbol.toLowerCase() === swapTo.toUpperCase()) {
            // Increase the balance of the token being received
            const currentBalance = Number.parseFloat(
              token.balance.replace(/,/g, "")
            );
            const newBalance = currentBalance + Number.parseFloat(swapToAmount);
            return {
              ...token,
              balance: newBalance
                .toFixed(2)
                .replace(/\B(?=(\d{3})+(?!\d))/g, ","),
              value: `$${(
                (newBalance *
                  Number.parseFloat(token.value.replace(/[$,]/g, ""))) /
                currentBalance
              )
                .toFixed(2)
                .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`,
            };
          }
          return token;
        });
      });

      // Show success toast with more details
      toast({
        title: "Swap Successful",
        description: `You have swapped ${swapAmount} ${swapFrom.toUpperCase()} for ${swapToAmount} ${swapTo.toUpperCase()}.`,
        variant: "default",
      });

      // Reset form
      setSwapAmount("");
      setSwapToAmount("0.00");
      setIsSwapping(false);
    }, 1500);
  };

  const handleConvertCrypto = () => {
    if (
      !convertAmount ||
      isNaN(Number.parseFloat(convertAmount)) ||
      Number.parseFloat(convertAmount) <= 0
    ) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to convert.",
        variant: "destructive",
      });
      return;
    }

    if (!bankAccount) {
      toast({
        title: "Bank Account Required",
        description: "Please add a bank account before converting to fiat.",
        variant: "destructive",
      });
      return;
    }

    // Show confirmation dialog
    setShowConversionConfirmation(true);
  };

  const handleConversionConfirmed = () => {
    // Update token balances after conversion
    setTokens((prevTokens) => {
      return prevTokens.map((token) => {
        if (token.symbol.toLowerCase() === convertFrom.toUpperCase()) {
          // Decrease the balance of the token being converted
          const currentBalance = Number.parseFloat(
            token.balance.replace(/,/g, "")
          );
          const newBalance = currentBalance - Number.parseFloat(convertAmount);
          return {
            ...token,
            balance: newBalance
              .toFixed(2)
              .replace(/\B(?=(\d{3})+(?!\d))/g, ","),
            value: `$${(
              (newBalance *
                Number.parseFloat(token.value.replace(/[$,]/g, ""))) /
              currentBalance
            )
              .toFixed(2)
              .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`,
          };
        }
        return token;
      });
    });

    // Reset form after successful conversion
    setConvertAmount("");
    setConvertToAmount("0.00");
  };

  // Token mint addresses for popular tokens
  const TOKEN_MINTS = {
    USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    SOL: 'So11111111111111111111111111111111111111112', // Wrapped SOL
  };

  // Get real token balance from SPL tokens
  const getRealTokenBalance = (symbol: string): number => {
    if (symbol.toLowerCase() === 'sol') {
      return solBalance || 0;
    }

    const mintAddress = TOKEN_MINTS[symbol.toUpperCase() as keyof typeof TOKEN_MINTS];
    if (!mintAddress) return 0;

    const token = splTokens.find(t => t.mint === mintAddress);
    return token ? token.amount : 0;
  };

  // Get formatted balance for display
  const getAvailableBalance = (symbol: string): string => {
    const balance = getRealTokenBalance(symbol);
    return balance.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 6 
    });
  };

  // Get balance for specific token with proper formatting
  const getTokenBalanceForDisplay = (symbol: string): string => {
    const balance = getRealTokenBalance(symbol);
    if (balance === 0) return "0.00";
    
    // Format based on token type
    if (symbol.toLowerCase() === 'sol') {
      return balance.toLocaleString(undefined, { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 6 
      });
    } else {
      return balance.toLocaleString(undefined, { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
    }
  };

  // Calculate total portfolio value in USDT
  const calculateTotalPortfolioValueInUSDT = (): number => {
    let totalValue = 0;

    // Add SOL value (convert SOL to USDT)
    const solBalanceValue = solBalance || 0;
    if (solBalanceValue > 0 && exchangeRates.sol_ngn > 0 && exchangeRates.usdt_ngn > 0) {
      // Convert SOL -> NGN -> USDT
      const solToNgn = solBalanceValue * exchangeRates.sol_ngn;
      const solToUsdt = solToNgn / exchangeRates.usdt_ngn;
      totalValue += solToUsdt;
    }

    // Add USDT value (already in USDT)
    const usdtBalance = getRealTokenBalance('USDT');
    totalValue += usdtBalance;

    // Add USDC value (convert USDC to USDT - approximately 1:1)
    const usdcBalance = getRealTokenBalance('USDC');
    if (usdcBalance > 0 && exchangeRates.usdc_ngn > 0 && exchangeRates.usdt_ngn > 0) {
      // Convert USDC -> NGN -> USDT
      const usdcToNgn = usdcBalance * exchangeRates.usdc_ngn;
      const usdcToUsdt = usdcToNgn / exchangeRates.usdt_ngn;
      totalValue += usdcToUsdt;
    }

    return totalValue;
  };

  // Calculate portfolio balance change (mock data for now)
  const getPortfolioBalanceChange = (): string => {
    // This could be calculated by comparing current portfolio value with previous value
    // For now, using a mock positive change
    return "+2.4%";
  };

  // Get all tokens including SOL and SPL tokens for portfolio display
  const getAllTokensForPortfolio = () => {
    const allTokens = [];

    // Add SOL as the first token with proper logo from token list or fallback
    if (solBalance !== null) {
      const solMetadata = getTokenMetadata('So11111111111111111111111111111111111111112');
      allTokens.push({
        tokenAccount: 'native',
        mint: 'So11111111111111111111111111111111111111112',
        amount: solBalance,
        decimals: 9,
        symbol: solMetadata.symbol,
        name: solMetadata.name,
        logoURLs: solMetadata.logoURLs,
      });
    }

    // Add SPL tokens with enhanced metadata resolution
    splTokens.forEach(token => {
      const metadata = getTokenMetadata(token.mint);
      
      allTokens.push({
        ...token,
        symbol: metadata.symbol,
        name: metadata.name,
        logoURLs: metadata.logoURLs
      });
    });

    return allTokens;
  };

  const fetchRealTimeRates = () => {
    // Simulate API call to get real-time rates
    toast({
      title: "Updating Exchange Rates",
      description: "Fetching the latest exchange rates...",
    });

    // Simulate network delay
    setTimeout(() => {
      // Add some randomness to simulate market fluctuations
      const fluctuation = () => 1 + (Math.random() * 0.04 - 0.02); // ±2% change

      setExchangeRates((prev) => ({
        ...prev,
        usdt_ngn: prev.usdt_ngn * fluctuation(),
        usdc_ngn: prev.usdc_ngn * fluctuation(),
        sol_ngn: prev.sol_ngn * fluctuation(),
      }));

      toast({
        title: "Exchange Rates Updated",
        description: "Latest market rates have been applied.",
        variant: "default",
      });
    }, 1500);
  };

  // Get current exchange rate based on selected currencies
  const getCurrentExchangeRate = () => {
    if (convertFrom === "usdt" && convertTo === "ngn") {
      return exchangeRates.usdt_ngn;
    } else if (convertFrom === "usdc" && convertTo === "ngn") {
      return exchangeRates.usdc_ngn;
    } else if (convertFrom === "sol" && convertTo === "ngn") {
      return exchangeRates.sol_ngn;
    }
    return 0;
  };

  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);
      await disconnect();
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been successfully disconnected.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Show loading screen while verifying user
  if (isVerifying) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verifying your account...</p>
        </div>
      </div>
    );
  }

  // Only render dashboard if user is verified
  if (!isUserVerified || !connected || !publicKey) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* <AppHeader /> */}
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      <main className="flex-1 py-8 lg:ml-0">
        <div className="container">
          {/* Navigation */}
          {/* <div className="mb-8">
            <nav className="flex items-center space-x-4 lg:space-x-6">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary hover:text-black",
                    pathname === item.path
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                  onClick={() => router.push(item.path)}
                >
                  {item.name}
                </Button>
              ))}
            </nav>
          </div> */}
          <div className="mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <HamburgerMenu onClick={toggleSidebar} />
              <h1 className="text-3xl font-bold">Dashboard</h1>
            </div>
            {/* Desktop Navigation Buttons */}
            <div className="hidden lg:flex lg:items-center lg:gap-4">
              <Button
                onClick={() => router.push("/swap")}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Swap Tokens
              </Button>
              <Button
                onClick={() => router.push("/convert")}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowUpRight className="h-4 w-4" />
                Convert to Fiat
              </Button>
              <Button
                onClick={() => router.push("/transaction")}
                variant="outline"
                className="flex items-center gap-2"
              >
                <History className="h-4 w-4" />
                View Transactions
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Total Portfolio Balance Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Portfolio Balance</CardTitle>
                <CardDescription>
                  Your total portfolio value in USDT
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-bold">
                    {solBalance === null || isFetchingSplTokens ? (
                      <Loader2 className="inline w-4 h-4 animate-spin" />
                    ) : (
                      <span>
                        {calculateTotalPortfolioValueInUSDT().toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        <span className="text-lg text-muted-foreground">USDT</span>
                      </span>
                    )}
                  </div>
                  <div></div>

                  <div
                    className={`flex items-center text-sm ${
                      getPortfolioBalanceChange().startsWith("+")
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {getPortfolioBalanceChange()} (24h)
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      toast({
                        title: "Refreshing Portfolio",
                        description:
                          "Getting the latest portfolio balance...",
                      });
                      // Force refresh balances and exchange rates
                      if (connected && publicKey) {
                        // Refresh SOL balance
                        const connection = new Connection(RPC_ENDPOINT, "confirmed");
                        connection.getBalance(publicKey).then(balance => {
                          setSolBalance(balance / LAMPORTS_PER_SOL);
                        }).catch(console.error);
                        
                        // Refresh SPL tokens
                        setIsFetchingSplTokens(true);
                        connection.getParsedTokenAccountsByOwner(
                          publicKey,
                          { programId: TOKEN_PROGRAM_ID }
                        ).then(tokenAccounts => {
                          const tokens = tokenAccounts.value
                            .map(({ pubkey, account }) => {
                              const parsed = account.data.parsed.info;
                              return {
                                tokenAccount: pubkey.toBase58(),
                                mint: parsed.mint,
                                amount: parsed.tokenAmount.uiAmount || 0,
                                decimals: parsed.tokenAmount.decimals,
                              };
                            })
                            .filter((t) => t.amount > 0);
                          setSplTokens(tokens);
                        }).catch(console.error).finally(() => {
                          setIsFetchingSplTokens(false);
                        });
                      }
                    }}
                  >
                    <RefreshCw className="mr-2 h-3 w-3" />
                    Refresh
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    {/* <Link href="/transaction"> 
                      <History className="mr-2 h-3 w-3" />
                      View History
                    </Link>  */}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Wallet Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Connected Wallet</CardTitle>
                <CardDescription>Manage your connected wallet</CardDescription>
              </CardHeader>
              <CardContent>
                {connected ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-primary/20 p-2">
                          <Wallet className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {truncateAddress(publicKey?.toString() || "")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Solana
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link
                          href="https://explorer.solana.com"
                          target="_blank"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span className="sr-only">View on Explorer</span>
                        </Link>
                      </Button>
                    </div>
                    <div className="mt-4">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDisconnect}
                      >
                        Disconnect Wallet
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-4 py-4">
                    <div className="text-center text-muted-foreground">
                      No wallet connected
                    </div>
                    <Button onClick={handleConnectWallet}>
                      Connect Wallet
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bank Account Card */}
            <Card>
              <CardHeader className="pb-2 w-full sm:w-auto">
                <CardTitle>Bank Account</CardTitle>

                <CardDescription className="flex flex-row gap-1 justify-left">
                  {" "}
                  <CreditCard className="mr-2 h-4 w-4" /> link your bank account{" "}
                </CardDescription>
              </CardHeader>
              <CardContent>
              
                {bankAccount && bankAccount.accountNumber ? (
                  <>
                    <div className="rounded-md border p-3">
                      <div className="font-medium">{bankAccount.bankName}</div>
                      <div className="text-sm text-muted-foreground">
                        {bankAccount.accountName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {bankAccount.accountNumber.replace(
                          /(\d{6})(\d{4})/,
                          "$1******"
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Add New Account
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Change Bank Account</DialogTitle>
                            <DialogDescription>
                              Update your bank account details
                            </DialogDescription>
                          </DialogHeader>
                          <BankAccountForm
                            onSuccess={async (data) => {
                              const { error } = await  saveBankAccountToDbAlternative(data);
                              if (error) {
                                console.error("Save error:", error);
                                toast({
                                  title: "Error",
                                  description:
                                    "Failed to save bank details. Please try again.",
                                  variant: "destructive",
                                });
                              } else {
                                setBankAccount(data);
                                toast({
                                  title: "Bank Account Added",
                                  description:
                                    "Your bank account has been successfully added.",
                                  variant: "default",
                                });
                              }
                            }}
                          />
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          const { error } = await removeBankAccountFromDb();
                          if (error) {
                            console.error("Remove error:", error);
                            toast({
                              title: "Error",
                              description:
                                "Failed to remove bank details. Please try again.",
                              variant: "destructive",
                            });
                          } else {
                            setBankAccount({
                              bankName: "",
                              accountNumber: "",
                              accountName: "",
                            });
                            toast({
                              title: "Bank Account Removed",
                              description:
                                "Your bank account has been removed.",
                              variant: "default",
                            });
                          }
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-4 py-4">
                    <div className="text-center text-muted-foreground">
                      No bank account linked
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Add Bank Account
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Bank Details</DialogTitle>
                          <DialogDescription>
                            Add your bank details to convert crypto to fiat.
                          </DialogDescription>
                        </DialogHeader>
                        <BankAccountForm
                          onSuccess={async (data) => {
                            const { error } = await  saveBankAccountToDbAlternative(data);
                            if (error) {
                              console.error("Save error:", error);
                              toast({
                                title: "Error",
                                description:
                                  "Failed to save bank details. Please try again.",
                                variant: "destructive",
                              });
                            } else {
                              setBankAccount(data);
                              toast({
                                title: "Bank Account Added",
                                description:
                                  "Your bank account has been successfully added.",
                                variant: "default",
                              });
                            }
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 mb-4">
            <Card className="mb-6 ">
              <CardHeader>
                <CardTitle className="text-lg">Naira Exchange Rates</CardTitle>
                <CardDescription>
                  Live rates and trends for USDT/NGN, USDC/NGN, SOL/NGN
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 ">
                {[
                  {
                    label: "USDT/NGN",
                    rate: exchangeRates.usdt_ngn,
                    increment: rateIncrements.usdt_ngn,
                    trend: rateTrends.usdt_ngn,
                    color: "#22c55e",
                  },
                  {
                    label: "USDC/NGN",
                    rate: exchangeRates.usdc_ngn,
                    increment: rateIncrements.usdc_ngn,
                    trend: rateTrends.usdc_ngn,
                    color: "#3b82f6",
                  },
                  {
                    label: "SOL/NGN",
                    rate: exchangeRates.sol_ngn,
                    increment: rateIncrements.sol_ngn,
                    trend: rateTrends.sol_ngn,
                    color: "#fbbf24",
                  },
                ].map(({ label, rate, increment, trend, color }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center justify-center p-4 rounded-lg shadow bg-background transition ease-out duration-300 hover:shadow-[0_4px_24px_rgba(34,197,94,0.18)] hover:scale-[1.025] hover:border-green-400 border border-transparent cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">{label}</span>
                      <span
                        className={`ml-2 text-sm font-bold ${
                          increment >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {increment >= 0 ? "▲" : "▼"}{" "}
                        {Math.abs(increment).toFixed(2)}%
                      </span>
                    </div>
                    <div className="text-2xl font-bold my-2">
                      ₦
                      {rate
                        ? rate.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })
                        : "--"}
                    </div>
                    <TrendChart data={trend} color={color} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Spl token Cards */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Portfolio</CardTitle>
                  <CardDescription>
                    All tokens in your connected wallet ({getAllTokensForPortfolio().length} token{getAllTokensForPortfolio().length !== 1 ? 's' : ''})
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (connected && publicKey) {
                      // Clear image errors for fresh reload
                      setImageErrors({});
                      
                      // Refresh SOL balance
                      const connection = new Connection(RPC_ENDPOINT, "confirmed");
                      connection.getBalance(publicKey).then(balance => {
                        setSolBalance(balance / LAMPORTS_PER_SOL);
                      }).catch(console.error);
                      
                      // Refresh SPL tokens
                      setIsFetchingSplTokens(true);
                      connection.getParsedTokenAccountsByOwner(
                        publicKey,
                        { programId: TOKEN_PROGRAM_ID }
                      ).then(tokenAccounts => {
                        const tokens = tokenAccounts.value
                          .map(({ pubkey, account }) => {
                            const parsed = account.data.parsed.info;
                            return {
                              tokenAccount: pubkey.toBase58(),
                              mint: parsed.mint,
                              amount: parsed.tokenAmount.uiAmount || 0,
                              decimals: parsed.tokenAmount.decimals,
                            };
                          })
                          .sort((a, b) => {
                            if (a.amount > 0 && b.amount === 0) return -1;
                            if (a.amount === 0 && b.amount > 0) return 1;
                            return b.amount - a.amount;
                          });
                        setSplTokens(tokens);
                        
                        toast({
                          title: "Portfolio Refreshed",
                          description: "Your token balances have been updated.",
                        });
                      }).catch(console.error).finally(() => {
                        setIsFetchingSplTokens(false);
                      });
                    }
                  }}
                  disabled={isFetchingSplTokens || !connected}
                >
                  <RefreshCw className={`mr-2 h-3 w-3 ${isFetchingSplTokens ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isFetchingSplTokens || solBalance === null || isLoadingTokenList ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <div className="text-center">
                    <p className="text-sm font-medium">Fetching your tokens...</p>
                    <p className="text-xs text-muted-foreground">
                      {isLoadingTokenList ? "Loading token metadata..." : "Loading balances..."}
                    </p>
                  </div>
                </div>
              ) : getAllTokensForPortfolio().length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Wallet className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">No tokens found</p>
                    <p className="text-xs text-muted-foreground">
                      Your wallet doesn't contain any tokens yet
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {getAllTokensForPortfolio().map((token) => {
                    return (
                      <div
                        key={token.tokenAccount}
                        className={`
                flex flex-col justify-between
                p-5 rounded-xl 
                shadow
                transition-all duration-300 ease-out
                hover:shadow-[0_4px_24px_rgba(34,197,94,0.18)]
                hover:scale-[1.025]
                hover:border-green-400
                border border-transparent
                min-h-[170px]
                ${token.amount > 0 
                  ? 'bg-muted/40' 
                  : 'bg-muted/20 opacity-75 border-dashed border-muted-foreground/30'
                }
              `}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <TokenImage 
                              mint={token.mint}
                              symbol={token.symbol}
                              logoURLs={token.logoURLs}
                            />
                            <div className="text-left">
                              <div className="font-semibold text-base">
                                {token.symbol}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {token.name}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              {token.amount.toLocaleString(undefined, {
                                maximumFractionDigits: Math.min(token.decimals, 6),
                              })}
                            </div>
                            {token.amount === 0 && (
                              <div className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                                Zero Balance
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="font-semibold">Mint:</span>
                            <div className="flex items-center gap-1">
                              <span className="font-mono">
                                {token.mint.slice(0, 4)}...
                                {token.mint.slice(-4)}
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(token.mint);
                                  toast({
                                    title: "Copied!",
                                    description:
                                      "Mint address copied to clipboard",
                                  });
                                }}
                                className="text-muted-foreground hover:text-green-500 transition-colors"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}






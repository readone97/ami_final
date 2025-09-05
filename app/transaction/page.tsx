"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, CreditCard, RefreshCw, Loader2, Filter, Search, Calendar, ArrowLeft } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useTransactions, Transaction } from "@/hooks/use-transactions";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Sidebar, HamburgerMenu } from "@/components/sidebar";

interface TransactionHistoryProps {
  onToggleSidebar: () => void;
}

export function TransactionHistory({ onToggleSidebar }: TransactionHistoryProps) {
  const { connected, publicKey } = useWallet();
  const router = useRouter();
  const { toast } = useToast();
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  
  // Use the transactions hook
  const {
    transactions,
    isLoading,
    error,
    hasMore,
    fetchTransactions,
    loadMore,
    updateTransactionStatus,
    syncBlockchainTransactions,
  } = useTransactions({
    walletAddress: publicKey?.toString(),
    status: statusFilter,
    limit: 20,
    autoRefresh: false, // Disable auto-refresh
    refreshInterval: 0, // No automatic refresh interval
  });

  // Redirect if not connected
  useEffect(() => {
    if (!connected || !publicKey) {
      router.push("/login");
    }
  }, [connected, publicKey, router]);

  // Filter transactions based on search and date
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = searchQuery === "" || 
      transaction.transaction_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.from_currency.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (transaction.to_currency && transaction.to_currency.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesDate = dateFilter === "all" || (() => {
      const transactionDate = new Date(transaction.created_at);
      const now = new Date();
      
      switch (dateFilter) {
        case "today":
          return transactionDate.toDateString() === now.toDateString();
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return transactionDate >= weekAgo;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return transactionDate >= monthAgo;
        default:
          return true;
      }
    })();
    
    return matchesSearch && matchesDate;
  });

  const getIcon = (transaction: Transaction) => {
    // Determine transaction type based on currencies
    if (transaction.to_currency === "NGN" || transaction.to_currency === "ngn") {
      return <ArrowUpRight className="h-4 w-4 text-orange-500 dark:text-orange-400" />;
    } else if (transaction.bank_name && transaction.account_number) {
      return <CreditCard className="h-4 w-4 text-green-500 dark:text-green-400" />;
    } else {
      return <RefreshCw className="h-4 w-4 text-blue-500 dark:text-blue-400" />;
    }
  };

  const getTypeLabel = (transaction: Transaction) => {
    if (transaction.to_currency === "NGN" || transaction.to_currency === "ngn") {
      return "Convert to Fiat";
    } else if (transaction.bank_name && transaction.account_number) {
      return "Withdraw to Bank";
    } else {
      return "Token Swap";
    }
  };

  const getAmountDisplay = (transaction: Transaction) => {
    if (transaction.to_amount && transaction.to_currency) {
      return `${transaction.from_amount} ${transaction.from_currency} → ${transaction.to_amount} ${transaction.to_currency}`;
    }
    return `${transaction.from_amount} ${transaction.from_currency}`;
  };

  const getTokenDisplay = (transaction: Transaction) => {
    if (transaction.to_currency) {
      return `${transaction.from_currency}/${transaction.to_currency}`;
    }
    return transaction.from_currency;
  };

  const getTimeAgo = (dateString: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);

    if (seconds < 60) return `${seconds} seconds ago`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;

    const days = Math.floor(hours / 24);
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "cancelled":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  if (!connected || !publicKey) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Please connect your wallet to view transactions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Transaction History</CardTitle>
              <CardDescription>
                View and manage your transaction history
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={syncBlockchainTransactions}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Sync Blockchain
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchTransactions}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      {isLoading && transactions.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading transactions...</p>
          </div>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchTransactions} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                {transactions.length === 0 
                  ? "No transactions found. Start by making a swap or conversion!"
                  : "No transactions match your current filters."
                }
              </p>
              {transactions.length === 0 && (
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => router.push('/swap')}>
                    Make a Swap
                  </Button>
                  <Button onClick={() => router.push('/convert')} variant="outline">
                    Convert to Fiat
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTransactions.map((transaction) => (
            <Card key={transaction.id} className="transition-colors hover:bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                    <div className="rounded-full bg-muted p-2">
                      {getIcon(transaction)}
                    </div>
                <div>
                      <div className="font-medium">{getTypeLabel(transaction)}</div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ({getTimeAgo(transaction.created_at)})
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {transaction.transaction_id.slice(0, 8)}...{transaction.transaction_id.slice(-8)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium">{getAmountDisplay(transaction)}</div>
                    <div className="text-sm text-muted-foreground">{getTokenDisplay(transaction)}</div>
                    {transaction.exchange_rate && (
                      <div className="text-xs text-muted-foreground">
                        Rate: {transaction.exchange_rate}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(transaction.status)}>
                      {transaction.status === "pending" && (
                        <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-yellow-500 dark:bg-yellow-400"></span>
                      )}
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </Badge>
                  </div>
                </div>
                
                {/* Bank details for withdrawals */}
                {transaction.bank_name && transaction.account_number && (
                  <div className="mt-3 pt-3 border-t border-muted">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Bank:</span> {transaction.bank_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Account:</span> {transaction.account_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Number:</span> {transaction.account_number.replace(/(\d{6})(\d{4})/, "$1******")}
                    </div>
                  </div>
                )}
                
                {/* Notes */}
                {transaction.notes && (
                  <div className="mt-3 pt-3 border-t border-muted">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Notes:</span> {transaction.notes}
              </div>
              </div>
                )}
              </CardContent>
            </Card>
          ))}
          
          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Export the page component
export default function TransactionPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <div className="flex-1 flex flex-col">
        {/* Header with Back Button */}
        <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <HamburgerMenu onClick={toggleSidebar} />
              <Button variant="ghost" onClick={() => router.push("/dashboard")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold">Transaction History</h1>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 container mx-auto px-4 py-8">
          <TransactionHistory onToggleSidebar={toggleSidebar} />
        </div>
      </div>
    </div>
  );
}
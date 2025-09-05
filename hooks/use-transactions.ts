"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export interface Transaction {
  id: string;
  transaction_id: string;
  user_id: string;
  wallet_address: string;
  from_amount: number;
  from_currency: string;
  to_amount: number | null;
  to_currency: string | null;
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  exchange_rate: number | null;
  fee: string | null;
  status: "pending" | "completed" | "failed" | "cancelled";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface UseTransactionsOptions {
  walletAddress?: string;
  status?: string;
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useTransactions = (options: UseTransactionsOptions = {}) => {
  const {
    walletAddress,
    status = "all",
    limit = 50,
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
  } = options;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const { toast } = useToast();

  const fetchTransactions = useCallback(
    async (reset = false) => {
      if (!walletAddress) {
        setTransactions([]);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const currentOffset = reset ? 0 : offset;
        const params = new URLSearchParams({
          wallet_address: walletAddress,
          status,
          limit: limit.toString(),
          offset: currentOffset.toString(),
        });

        const response = await fetch(`/api/transactions?${params}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch transactions");
        }

        const newTransactions = data.transactions || [];
        
        if (reset) {
          setTransactions(newTransactions);
          setOffset(limit);
        } else {
          setTransactions((prev) => [...prev, ...newTransactions]);
          setOffset((prev) => prev + limit);
        }

        setHasMore(newTransactions.length === limit);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        console.error("Error fetching transactions:", err);
        
        toast({
          title: "Error",
          description: "Failed to fetch transactions",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [walletAddress, status, limit, offset, toast]
  );

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchTransactions(false);
    }
  }, [isLoading, hasMore, fetchTransactions]);

  const refresh = useCallback(() => {
    setOffset(0);
    fetchTransactions(true);
  }, [fetchTransactions]);

  const updateTransactionStatus = useCallback(
    async (transactionId: string, newStatus: string, notes?: string) => {
      try {
        const response = await fetch(`/api/transactions/${transactionId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus, notes }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to update transaction");
        }

        // Update the transaction in the local state
        setTransactions((prev) =>
          prev.map((tx) =>
            tx.id === transactionId
              ? { ...tx, status: newStatus as any, notes: notes || tx.notes }
              : tx
          )
        );

        toast({
          title: "Success",
          description: "Transaction status updated",
        });

        return data.transaction;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("Error updating transaction:", err);
        
        toast({
          title: "Error",
          description: "Failed to update transaction status",
          variant: "destructive",
        });
        
        throw err;
      }
    },
    [toast]
  );

  const syncBlockchainTransactions = useCallback(
    async () => {
      if (!walletAddress) return;

      try {
        const response = await fetch("/api/transactions/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ walletAddress, limit: 50 }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to sync transactions");
        }

        // Refresh transactions after sync
        await fetchTransactions(true);

        toast({
          title: "Sync Complete",
          description: `Synced ${data.synced} new transactions`,
        });

        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("Error syncing transactions:", err);
        
        toast({
          title: "Sync Error",
          description: "Failed to sync blockchain transactions",
          variant: "destructive",
        });
        
        throw err;
      }
    },
    [walletAddress, fetchTransactions, toast]
  );

  // Initial fetch
  useEffect(() => {
    if (walletAddress) {
      setOffset(0);
      fetchTransactions(true);
    }
  }, [walletAddress, status, fetchTransactions]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !walletAddress) return;

    const interval = setInterval(() => {
      fetchTransactions(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, walletAddress, fetchTransactions]);

  return {
    transactions,
    isLoading,
    error,
    hasMore,
    fetchTransactions: refresh,
    loadMore,
    updateTransactionStatus,
    syncBlockchainTransactions,
  };
};

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { fetchWalletTransactions, detectTransactionType } from "@/lib/blockchain-transactions";

// POST /api/transactions/sync - Sync blockchain transactions with database
export async function POST(request: NextRequest) {
  try {
    const { walletAddress, limit = 50 } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "wallet_address is required" },
        { status: 400 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("wallet_address", walletAddress)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Fetch blockchain transactions
    const blockchainTransactions = await fetchWalletTransactions(walletAddress, limit);

    // Get existing transaction IDs from database
    const { data: existingTransactions, error: existingError } = await supabase
      .from("transactions")
      .select("transaction_id")
      .eq("wallet_address", walletAddress);

    if (existingError) {
      console.error("Error fetching existing transactions:", existingError);
      return NextResponse.json(
        { error: "Failed to fetch existing transactions" },
        { status: 500 }
      );
    }

    const existingIds = new Set(existingTransactions?.map(tx => tx.transaction_id) || []);

    // Filter out transactions that already exist in database
    const newTransactions = blockchainTransactions.filter(
      tx => !existingIds.has(tx.signature)
    );

    if (newTransactions.length === 0) {
      return NextResponse.json({
        message: "No new transactions to sync",
        synced: 0,
        total: blockchainTransactions.length,
      });
    }

    // Convert blockchain transactions to database format
    const transactionsToInsert = newTransactions.map(tx => {
      const transactionType = detectTransactionType(tx);
      
      // For now, we'll create basic transaction records
      // In a real implementation, you'd parse the transaction data to extract amounts, tokens, etc.
      return {
        transaction_id: tx.signature,
        user_id: profile.id,
        wallet_address: walletAddress,
        from_amount: 0, // Would need to parse from transaction data
        from_currency: "UNKNOWN", // Would need to parse from transaction data
        to_amount: null,
        to_currency: null,
        exchange_rate: null,
        fee: tx.fee.toString(),
        status: tx.status === "success" ? "completed" : "failed",
        notes: `Blockchain transaction (${transactionType})`,
        created_at: tx.blockTime ? new Date(tx.blockTime * 1000).toISOString() : new Date().toISOString(),
      };
    });

    // Insert new transactions
    const { data, error } = await supabase
      .from("transactions")
      .insert(transactionsToInsert)
      .select();

    if (error) {
      console.error("Error inserting transactions:", error);
      return NextResponse.json(
        { error: "Failed to sync transactions" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Transactions synced successfully",
      synced: data?.length || 0,
      total: blockchainTransactions.length,
      transactions: data,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

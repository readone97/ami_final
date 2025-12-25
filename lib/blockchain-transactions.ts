import { Connection, PublicKey } from "@solana/web3.js";

const RPC_ENDPOINT = "https://damp-light-vineyard.solana-mainnet.quiknode.pro/05770abd303efb946ff54e7f7d1b0d289652565d/";

export interface BlockchainTransaction {
  signature: string;
  slot: number;
  blockTime: number | null;
  fee: number;
  status: "success" | "failed";
  accounts: string[];
  instructions: {
    programId: string;
    accounts: string[];
    data: string;
  }[];
}

export async function fetchWalletTransactions(
  walletAddress: string,
  limit: number = 50
): Promise<BlockchainTransaction[]> {
  try {
    const connection = new Connection(RPC_ENDPOINT, "confirmed");
    const publicKey = new PublicKey(walletAddress);

    // Get recent signatures
    const signatures = await connection.getSignaturesForAddress(publicKey, {
      limit,
    });

    if (signatures.length === 0) {
      return [];
    }

    // Get transaction details for each signature
    const transactions = await Promise.all(
      signatures.map(async (sigInfo) => {
        try {
          const tx = await connection.getTransaction(sigInfo.signature, {
            maxSupportedTransactionVersion: 0,
          });

          if (!tx) {
            return null;
          }

          return {
            signature: sigInfo.signature,
            slot: sigInfo.slot,
            blockTime: sigInfo.blockTime,
            fee: tx.meta?.fee || 0,
            status: tx.meta?.err ? "failed" : "success",
            accounts: tx.transaction.message.staticAccountKeys.map(key => key.toString()),
            instructions: tx.transaction.message.compiledInstructions.map(ix => ({
              programId: tx.transaction.message.staticAccountKeys[ix.programIdIndex].toString(),
              accounts: ix.accountKeyIndexes.map(idx => 
                tx.transaction.message.staticAccountKeys[idx].toString()
              ),
              data: Buffer.from(ix.data).toString('base64'),
            })),
          };
        } catch (error) {
          console.error(`Error fetching transaction ${sigInfo.signature}:`, error);
          return null;
        }
      })
    );

    return transactions.filter((tx): tx is BlockchainTransaction => tx !== null);
  } catch (error) {
    console.error("Error fetching wallet transactions:", error);
    throw error;
  }
}

export async function getTransactionDetails(signature: string): Promise<BlockchainTransaction | null> {
  try {
    const connection = new Connection(RPC_ENDPOINT, "confirmed");
    
    const tx = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) {
      return null;
    }

    return {
      signature,
      slot: 0, // We don't have slot info from getTransaction
      blockTime: null, // We don't have blockTime info from getTransaction
      fee: tx.meta?.fee || 0,
      status: tx.meta?.err ? "failed" : "success",
      accounts: tx.transaction.message.staticAccountKeys.map(key => key.toString()),
      instructions: tx.transaction.message.compiledInstructions.map(ix => ({
        programId: tx.transaction.message.staticAccountKeys[ix.programIdIndex].toString(),
        accounts: ix.accountKeyIndexes.map(idx => 
          tx.transaction.message.staticAccountKeys[idx].toString()
        ),
        data: Buffer.from(ix.data).toString('base64'),
      })),
    };
  } catch (error) {
    console.error("Error fetching transaction details:", error);
    return null;
  }
}

// Helper function to detect transaction type based on program IDs
export function detectTransactionType(transaction: BlockchainTransaction): "swap" | "transfer" | "other" {
  const swapProgramIds = [
    "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4", // Jupiter V6
    "JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB", // Jupiter V4
    "JUP2jxvXaqu7NQY1GmNF4m1vodw12LVXYxbFL2uJvfo", // Jupiter V3
    "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM", // Jupiter V2
  ];

  const transferProgramId = "11111111111111111111111111111111"; // System Program

  for (const instruction of transaction.instructions) {
    if (swapProgramIds.includes(instruction.programId)) {
      return "swap";
    }
    if (instruction.programId === transferProgramId) {
      return "transfer";
    }
  }

  return "other";
}



import { Connection, PublicKey, Transaction } from "@solana/web3.js"
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"
import tokens from "./tokens.json"

export interface Token {
  address: string
  chainId: number
  decimals: number
  name: string
  symbol: string
  logoURI: string
  tags: string[]
}

export interface QuoteResponse {
  inputMint: string
  outputMint: string
  inAmount: string
  outAmount: string
  otherAmountThreshold: string
  swapMode: string
  slippageBps: number
  platformFee: {
    amount: string
    feeBps: number
  }
  priceImpactPct: number
  routePlan: {
    swapInfo: {
      ammKey: string
      label: string
      inputMint: string
      outputMint: string
      inAmount: string
      outAmount: string
      feeAmount: string
      feeMint: string
    }
    percent: number
  }[]
  contextSlot: number
  timeTaken: number
}

// Jupiter Swap API v1 - Official endpoint from documentation
const JUPITER_API_URL = "https://lite-api.jup.ag/swap/v1"
const RPC_ENDPOINT ="https://damp-light-vineyard.solana-mainnet.quiknode.pro/05770abd303efb946ff54e7f7d1b0d289652565d/"

export async function getTokens(): Promise<Token[]> {
  try {
    // Return tokens from our local JSON file
    return tokens.tokens
  } catch (error) {
    console.error("Error getting tokens:", error)
    throw error
  }
}

export interface QuoteParams {
  inputMint: string
  outputMint: string
  amount: string
  slippageBps?: number
  restrictIntermediateTokens?: boolean
  onlyDirectRoutes?: boolean
  asLegacyTransaction?: boolean
  platformFeeBps?: number
  maxAccounts?: number
}

/**
 * Get a quote from Jupiter Swap API
 * @param inputMint - Input token mint address
 * @param outputMint - Output token mint address
 * @param amount - Amount in smallest unit (e.g., lamports for SOL)
 * @param slippageBps - Slippage tolerance in basis points (default: 50 = 0.5%)
 * @param options - Additional options for quote customization
 * @returns Quote response with routing information
 */
export async function getQuote(
  inputMint: string,
  outputMint: string,
  amount: string,
  slippageBps: number = 50,
  options?: Partial<QuoteParams>
): Promise<QuoteResponse> {
  try {
    const params: Record<string, string> = {
      inputMint,
      outputMint,
      amount,
      slippageBps: slippageBps.toString(),
    }

    // Add optional parameters if provided
    if (options?.restrictIntermediateTokens !== undefined) {
      params.restrictIntermediateTokens = String(options.restrictIntermediateTokens)
    }
    if (options?.onlyDirectRoutes !== undefined) {
      params.onlyDirectRoutes = String(options.onlyDirectRoutes)
    }
    if (options?.asLegacyTransaction !== undefined) {
      params.asLegacyTransaction = String(options.asLegacyTransaction)
    }
    if (options?.platformFeeBps !== undefined) {
      params.platformFeeBps = String(options.platformFeeBps)
    }
    if (options?.maxAccounts !== undefined) {
      params.maxAccounts = String(options.maxAccounts)
    }

    const urlParams = new URLSearchParams(params)
    const response = await fetch(`${JUPITER_API_URL}/quote?${urlParams}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }
    return response.json()
  } catch (error) {
    console.error("Error getting quote:", error)
    throw error
  }
}

/**
 * Get a serialized swap transaction from Jupiter Swap API
 * @param quote - Quote response from getQuote()
 * @param userPublicKey - User's wallet public key
 * @returns Serialized swap transaction in base64 format
 */
export async function getSwapTransaction(
  quote: QuoteResponse,
  userPublicKey: string
): Promise<{ swapTransaction: string }> {
  try {
    const response = await fetch(`${JUPITER_API_URL}/swap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quoteResponse: quote,
        userPublicKey: userPublicKey,
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        dynamicSlippage: true,
        prioritizationFeeLamports: {
          priorityLevelWithMaxLamports: {
            maxLamports: 1000000,
            priorityLevel: "veryHigh"
          }
        }
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }
    return response.json()
  } catch (error) {
    console.error("Error getting swap transaction:", error)
    throw error
  }
}

export interface SwapResponse {
  swapTransaction: string
  lastValidBlockHeight: number
  prioritizationFeeLamports?: number
  computeUnitLimit?: number
  prioritizationType?: {
    computeBudget?: {
      microLamports: number
      estimatedMicroLamports: number
    }
  }
  dynamicSlippageReport?: {
    slippageBps: number
    otherAmount: number
    simulatedIncurredSlippageBps: number
    amplificationRatio: string
    categoryName: string
    heuristicMaxSlippageBps: number
  }
  simulationError?: any
}

/**
 * Get a detailed swap transaction with additional metadata from Jupiter Swap API
 * @param quote - Quote response from getQuote()
 * @param userPublicKey - User's wallet public key
 * @returns Detailed swap response with transaction and metadata
 */
export async function getSwapTransactionWithDetails(
  quote: QuoteResponse,
  userPublicKey: string
): Promise<SwapResponse> {
  try {
    const response = await fetch(`${JUPITER_API_URL}/swap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quoteResponse: quote,
        userPublicKey: userPublicKey,
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        dynamicSlippage: true,
        prioritizationFeeLamports: {
          priorityLevelWithMaxLamports: {
            maxLamports: 1000000,
            priorityLevel: "veryHigh"
          }
        }
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }
    return response.json()
  } catch (error) {
    console.error("Error getting swap transaction with details:", error)
    throw error
  }
}

/**
 * Execute a swap transaction on the Solana network
 * @param swapTransaction - Base64 encoded serialized transaction from getSwapTransaction()
 * @param connection - Solana connection instance
 * @param publicKey - User's wallet public key
 * @returns Transaction signature
 */
export async function executeSwap(
  swapTransaction: string,
  connection: Connection,
  publicKey: PublicKey
): Promise<string> {
  try {
    const transaction = Transaction.from(Buffer.from(swapTransaction, "base64"))
    const signature = await connection.sendTransaction(transaction, [])
    await connection.confirmTransaction(signature, "confirmed")
    return signature
  } catch (error) {
    console.error("Error executing swap:", error)
    throw error
  }
}

export function getConnection(network: WalletAdapterNetwork = WalletAdapterNetwork.Mainnet): Connection {
  return new Connection(
    network === WalletAdapterNetwork.Mainnet
      ? "https://api.mainnet-beta.solana.com"
      : "https://api.devnet.solana.com"
  )
}

/**
 * Performs a complete swap operation: gets quote, builds transaction, and executes
 * @param inputMint - Input token mint address
 * @param outputMint - Output token mint address
 * @param amount - Amount in smallest unit (e.g., lamports for SOL)
 * @param userPublicKey - User's wallet public key as string
 * @param connection - Solana connection instance
 * @param walletPublicKey - User's wallet PublicKey instance for transaction signing
 * @param slippageBps - Slippage tolerance in basis points (default: 50 = 0.5%)
 * @param options - Additional options for quote customization
 * @returns Object containing transaction signature and quote details
 */
export async function performSwap(
  inputMint: string,
  outputMint: string,
  amount: string,
  userPublicKey: string,
  connection: Connection,
  walletPublicKey: PublicKey,
  slippageBps: number = 50,
  options?: Partial<QuoteParams>
): Promise<{ signature: string; quote: QuoteResponse }> {
  try {
    // Step 1: Get quote
    console.log("Getting quote...")
    const quote = await getQuote(inputMint, outputMint, amount, slippageBps, options)
    console.log(`Quote received: ${quote.outAmount} output tokens`)

    // Step 2: Get swap transaction
    console.log("Building swap transaction...")
    const { swapTransaction } = await getSwapTransaction(quote, userPublicKey)

    // Step 3: Execute swap
    console.log("Executing swap...")
    const signature = await executeSwap(swapTransaction, connection, walletPublicKey)
    console.log(`Swap completed! Signature: ${signature}`)

    return { signature, quote }
  } catch (error) {
    console.error("Error performing swap:", error)
    throw error
  }
} 

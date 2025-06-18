"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Wallet, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { useToast } from "@/hooks/use-toast"
import { truncateAddress } from "@/lib/utils"
import { supabase } from "@/lib/supabase/client"

interface PendingRegistration {
  userId: string
  username: string
  email: string
  timestamp: string
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [checkingUser, setCheckingUser] = useState(false)
  const [isRegistrationFlow, setIsRegistrationFlow] = useState(false)
  const [pendingRegistration, setPendingRegistration] = useState<PendingRegistration | null>(null)
  const { toast } = useToast()
  const { setVisible } = useWalletModal()
  const { connected, publicKey, disconnect } = useWallet()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check if this is part of the registration flow
  useEffect(() => {
    const step = searchParams?.get('step')
    if (step === 'connect-wallet') {
      setIsRegistrationFlow(true)
      
      // Get pending registration data
      const pendingData = localStorage.getItem('pendingRegistration')
      if (pendingData) {
        try {
          const parsed = JSON.parse(pendingData) as PendingRegistration
          setPendingRegistration(parsed)
          toast({
            title: "Welcome back!",
            description: `Hi ${parsed.username}, please connect your wallet to complete registration.`,
            variant: "default",
          })
        } catch (error) {
          console.error("Error parsing pending registration:", error)
          router.push("/register")
        }
      } else {
        // No pending registration data, redirect to register
        router.push("/register")
      }
    }
  }, [searchParams, router, toast])

  // Handle wallet connection for both flows
  useEffect(() => {
    const handleWalletConnection = async () => {
      if (connected && publicKey) {
        setCheckingUser(true)
        
        try {
          if (isRegistrationFlow && pendingRegistration) {
            // This is registration completion - save all data
            console.log("Registration completion flow detected")
            await completeRegistration(pendingRegistration, publicKey.toString())
          } else {
            // This is regular login - check if user exists
            console.log("Regular login flow - checking if user exists")
            await checkExistingUser(publicKey.toString())
          }
        } catch (error) {
          console.error("Error handling wallet connection:", error)
          toast({
            title: "Error",
            description: "Failed to process wallet connection. Please try again.",
            variant: "destructive",
          })
          setCheckingUser(false)
        }
      }
    }
    
    if (connected && publicKey) {
      handleWalletConnection()
    }
  }, [connected, publicKey, isRegistrationFlow, pendingRegistration, toast, router])

  const completeRegistration = async (registrationData: PendingRegistration, walletAddress: string) => {
    try {
      console.log("Completing registration for:", registrationData.email, "with wallet:", walletAddress)
      
      // Create the profile with all registration data using the new schema
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          auth_user_id: registrationData.userId,
          username: registrationData.username,
          email: registrationData.email,
          wallet_address: walletAddress,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()

      if (error) {
        console.error("Database error during registration completion:", error)
        console.error("Full error object:", JSON.stringify(error, null, 2))
        toast({
          title: "Registration Error",
          description: `Failed to complete registration: ${error.message || 'Unknown database error'}`,
          variant: "destructive",
        })
        setCheckingUser(false)
        return
      }

      // Clear pending registration data
      localStorage.removeItem('pendingRegistration')
      
      console.log("Registration completed successfully:", data)
      toast({
        title: "Registration Complete!",
        description: "Your account has been successfully created with wallet connection.",
        variant: "default",
      })
      
      // Add a small delay to ensure the registration state is properly set
      setCheckingUser(false);
      
      // Set verification flag
      localStorage.setItem('userVerified', 'true');
      localStorage.setItem('verifiedWallet', walletAddress);
      
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
      
    } catch (error: any) {
      console.error("Error completing registration:", error)
      console.error("Full error object:", JSON.stringify(error, null, 2))
      toast({
        title: "Registration Error",
        description: error.message || "Failed to complete registration. Please try again.",
        variant: "destructive",
      })
      setCheckingUser(false)
    }
  }

  const checkExistingUser = async (walletAddress: string) => {
    try {
      console.log("Checking if user exists with wallet:", walletAddress)
      
      // Query the profiles table for this wallet address
      const { data, error } = await supabase
        .from("profiles")
        .select("id, auth_user_id, wallet_address, username, email")
        .eq("wallet_address", walletAddress)
        .maybeSingle()

      console.log("User check result:", { data, error })

      if (error) {
        console.error("Database error:", error)
        console.error("Full error object:", JSON.stringify(error, null, 2))
        console.error("Error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        
        toast({
          title: "Database Error",
          description: `Failed to check account: ${error.message || 'Unknown database error'}`,
          variant: "destructive",
        })
        setCheckingUser(false)
        return
      }

      if (!data) {
        console.log("No account found, redirecting to register page")
        toast({
          title: "Account Not Found",
          description: "No account found for this wallet. Please register first.",
          variant: "destructive",
        })
        setCheckingUser(false)
        
        // Force navigation to register page
        window.location.href = "/register"
      } else {
        console.log("Account found, redirecting to dashboard")
        toast({
          title: "Welcome back!",
          description: `Welcome back${data.username ? `, ${data.username}` : ''}!`,
          variant: "default",
        })
        
        // Add a small delay to ensure the authentication state is properly set
        setCheckingUser(false);
        
        // Set verification flag
        localStorage.setItem('userVerified', 'true');
        localStorage.setItem('verifiedWallet', walletAddress);
        
        setTimeout(() => {
          router.push("/dashboard");
        }, 500);
      }
    } catch (err: any) {
      console.error("Error checking user:", err)
      console.error("Full error object:", JSON.stringify(err, null, 2))
      toast({
        title: "Error",
        description: `Failed to check account: ${err.message || 'Unknown error'}`,
        variant: "destructive",
      })
      setCheckingUser(false)
    }
  }

  const handleConnectWallet = async () => {
    try {
      setIsLoading(true)
      if (!connected) {
        await setVisible(true)
      } else {
        await disconnect()
        await setVisible(true)
      }
    } catch (error) {
      console.error("Wallet connection error:", error)
      toast({
        title: "Connection Error",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex min-h-screen flex-col items-center justify-center py-8 bg-background text-foreground">
      <Link href="/" className="mb-8 flex items-center text-sm font-medium text-muted-foreground hover:text-primary">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">
            {isRegistrationFlow ? "Complete Registration" : "Connect Your Wallet"}
          </CardTitle>
          <CardDescription>
            {isRegistrationFlow 
              ? "Connect your Solana wallet to complete your account setup"
              : "Connect your Solana wallet to access your dashboard"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="rounded-full bg-primary/20 p-3">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            
            {isRegistrationFlow && pendingRegistration ? (
              <>
                <h3 className="text-lg font-medium">Welcome, {pendingRegistration.username}!</h3>
                <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
                  <p className="font-medium mb-2">📧 Email verified: {pendingRegistration.email}</p>
                  <p>Now connect your Solana wallet to complete your registration and access the platform.</p>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium">Welcome to Amigo Exchange</h3>
                <p className="text-sm text-muted-foreground">
                  Connect your Solana wallet to access your tokens and start using Amigo Exchange.
                </p>
              </>
            )}

            <Button 
              onClick={handleConnectWallet} 
              disabled={isLoading || checkingUser}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {connected ? "Checking..." : "Connecting..."}
                </>
              ) : checkingUser ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isRegistrationFlow ? "Completing Registration..." : "Checking Account..."}
                </>
              ) : connected ? (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  {truncateAddress(publicKey?.toString() || '')}
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </>
              )}
            </Button>

            {(checkingUser || (connected && publicKey)) && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>
                  {isRegistrationFlow
                    ? "Completing registration..."
                    : "Checking account..."}
                </span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 border-t p-6">
          {!isRegistrationFlow && (
            <p className="text-center text-sm text-muted-foreground">
              New to Amigo Exchange?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Create an account
              </Link>
            </p>
          )}
          
          {isRegistrationFlow && (
            <p className="text-center text-sm text-muted-foreground">
              Need to use a different email?{" "}
              <button
                onClick={() => {
                  localStorage.removeItem('pendingRegistration')
                  router.push("/register")
                }}
                className="text-primary hover:underline"
              >
                Start over
              </button>
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}



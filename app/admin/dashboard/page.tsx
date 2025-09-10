"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import Link from "next/link"
import {
  ArrowUpRight,
  ChevronDown,
  Clock,
  DollarSign,
  FileText,
  LogOut,
  RefreshCw,
  Search,
  Settings,
  User,
  Wallet,
} from "lucide-react"
import { useAdminAuth } from "@/context/admin-auth-context"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { NotificationsPopover } from "@/components/notifications-popover"
import { MerchantTransactionTable } from "@/components/merchant-transaction-table"

export default function AdminDashboardPage() {
  const { toast } = useToast()
  const { logout } = useAdminAuth()
  const [activeTab, setActiveTab] = useState("pending")
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState("today")

  // Transaction interface
  interface Transaction {
    id: string
    transaction_id: string
    user_id: string
    wallet_address: string
    from_amount: number
    from_currency: string
    to_amount: number | null
    to_currency: string | null
    bank_name: string | null
    account_number: string | null
    account_name: string | null
    exchange_rate: number | null
    fee: string | null
    status: string
    notes: string | null
    created_at: string
    updated_at: string | null
  }

  // Real transactions from Supabase
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [lastTransactionCount, setLastTransactionCount] = useState(0)
  const [notificationPermission, setNotificationPermission] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null)

  // Stats
  const [stats, setStats] = useState({
    pendingCount: 0,
    completedCount: 0,
    totalVolume: "₦0",
    todayVolume: "₦0",
  })

  // Fetch only convert transactions (not swap transactions)
  const fetchTransactions = async () => {
    try {
      setIsLoading(true)
      console.log('Fetching convert transactions from Supabase...')
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .or('to_currency.eq.NGN,to_currency.eq.ngn') // Only convert transactions (to NGN)
        .order('created_at', { ascending: false })

      if (error) {
        console.log('Supabase error:', error)
        toast({
          title: "Error",
          description: "Could not fetch transactions",
          variant: "destructive",
        })
        setTransactions([])
      } else {
        console.log('Fetched convert transactions:', data)
        setTransactions(data || [])
        
        // Calculate stats for convert transactions only
        const convertTransactions = data || []
        const pending = convertTransactions.filter(tx => tx.status === 'pending').length
        const completed = convertTransactions.filter(tx => tx.status === 'completed').length
        const totalVol = convertTransactions.reduce((sum, tx) => sum + (Number(tx.to_amount) || 0), 0)
        
        setStats({
          pendingCount: pending,
          completedCount: completed,
          totalVolume: `₦${totalVol.toLocaleString()}`,
          todayVolume: `₦${totalVol.toLocaleString()}`,
        })
        
        // Check for new transactions and show notification
        if (convertTransactions.length > lastTransactionCount && lastTransactionCount > 0) {
          const newTransactionCount = convertTransactions.length - lastTransactionCount
          showNotification(`New conversion request! ${newTransactionCount} new transaction${newTransactionCount > 1 ? 's' : ''} pending approval.`)
          
          toast({
            title: "New Transaction Alert!",
            description: `${newTransactionCount} new conversion request${newTransactionCount > 1 ? 's' : ''} received`,
            variant: "default",
          })
        }
        
        setLastTransactionCount(convertTransactions.length)
        setLastRefreshTime(new Date())
        
        if (convertTransactions.length > 0) {
          console.log(`Loaded ${convertTransactions.length} convert transactions`)
        }
      }
    } catch (err) {
      console.log('Error:', err)
      toast({
        title: "Error",
        description: "Connection failed",
        variant: "destructive",
      })
      setTransactions([])
    } finally {
      setIsLoading(false)
    }
  }

  // Request notification permission and show notifications
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission === 'granted')
      return permission === 'granted'
    }
    return false
  }

  const showNotification = (message: string) => {
    if (notificationPermission && 'Notification' in window) {
      new Notification('MigoX Admin - New Transaction', {
        body: message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'new-transaction',
        requireInteraction: true,
      })
    }
  }

  // Format for table
  const formatTransactions = () => {
    return transactions.map(tx => ({
      id: tx.transaction_id || tx.id,
      userId: tx.wallet_address || 'Unknown',
      userName: tx.account_name || 'Unknown',
      fromAmount: tx.from_amount?.toString() || '0',
      fromCurrency: tx.from_currency || 'N/A',
      toAmount: tx.to_amount?.toLocaleString() || '0',
      toCurrency: tx.to_currency || 'NGN',
      bankName: tx.bank_name || 'N/A',
      accountNumber: tx.account_number || 'N/A',
      accountName: tx.account_name || 'N/A',
      status: tx.status || 'pending',
      createdAt: tx.created_at || new Date().toISOString(),
      updatedAt: tx.updated_at || null,
      notes: tx.notes || "",
    }))
  }

  // Filter transactions
  const filteredTransactions = formatTransactions().filter((tx) => {
    if (activeTab === "pending" && tx.status !== "pending") return false
    if (activeTab === "completed" && tx.status !== "completed") return false
    if (activeTab === "rejected" && tx.status !== "rejected") return false
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        tx.id.toLowerCase().includes(query) ||
        tx.userName.toLowerCase().includes(query) ||
        tx.accountNumber.includes(query)
      )
    }
    
    return true
  })

  // Fetch on mount and request notification permission
  useEffect(() => {
    fetchTransactions()
    requestNotificationPermission()
  }, [])

  // Auto-refresh every 2 minutes (120,000ms)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Auto-refreshing transactions...')
      fetchTransactions()
    }, 120000) // 2 minutes

    return () => clearInterval(interval)
  }, [])

  // Handle transaction approval
  const handleApproveTransaction = async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('transaction_id', transactionId)

      if (error) {
        toast({
          title: "Error",
          description: "Failed to approve transaction",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Transaction approved successfully",
        })
        // Refresh transactions to show updated status
        fetchTransactions()
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to approve transaction",
        variant: "destructive",
      })
    }
  }

  // Handle transaction rejection
  const handleRejectTransaction = async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('transaction_id', transactionId)

      if (error) {
        toast({
          title: "Error",
          description: "Failed to reject transaction",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Transaction rejected successfully",
        })
        // Refresh transactions to show updated status
        fetchTransactions()
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to reject transaction",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-xl font-bold text-primary">
              Amigo Exchange <span className="text-sm font-normal text-muted-foreground">Admin</span>
            </Link>
          </div>
          <nav className="flex items-center gap-4">
            {!notificationPermission && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={requestNotificationPermission}
              >
                Enable Notifications
              </Button>
            )}
            <NotificationsPopover />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>AD</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-sm">
                    <span>Admin</span>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </header>

      <main className="flex-1 py-8">
        <div className="container">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage user crypto-to-fiat conversions</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Export Report
              </Button>
              <Button onClick={fetchTransactions}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Data
              </Button>
              {lastRefreshTime && (
                <div className="text-sm text-muted-foreground flex items-center">
                  Last updated: {lastRefreshTime.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Transactions</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? "..." : stats.pendingCount}</div>
                <p className="text-xs text-muted-foreground">Requires action</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? "..." : stats.completedCount}</div>
                <p className="text-xs text-muted-foreground">Successfully processed</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? "..." : stats.totalVolume}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Merchant Balance</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦2,500,000</div>
                <p className="text-xs text-muted-foreground">Available</p>
              </CardContent>
            </Card>
          </div>

          {/* Transactions Table */}
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Transactions</CardTitle>
                  <CardDescription>Review and process user conversion requests</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search transactions..."
                      className="pl-8 w-[250px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="pending">
                    Pending
                    <Badge variant="secondary" className="ml-2">
                      {stats.pendingCount}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                  <TabsTrigger value="all">All Transactions</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-6">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-muted-foreground">Loading transactions...</div>
                    </div>
                  ) : (
                    <MerchantTransactionTable
                      transactions={filteredTransactions}
                      onViewTransaction={(id) => console.log('View transaction:', id)}
                      onApproveTransaction={handleApproveTransaction}
                      onRejectTransaction={handleRejectTransaction}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

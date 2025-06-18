"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import Link from "next/link"
import {
  ArrowDownUp,
  ArrowUpRight,
  ChevronDown,
  Clock,
  DollarSign,
  FileText,
  Filter,
  LogOut,
  RefreshCw,
  Search,
  Settings,
  User,
  Wallet,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { MerchantTransactionDetails } from "@/components/merchant-transaction-details"
import { Label } from "@/components/ui/label"

interface Transaction {
  id: string
  transaction_id?: string
  wallet_address?: string
  from_amount: number
  from_currency: string
  to_amount: number
  to_currency: string
  bank_name: string
  account_number: string
  account_name: string
  exchange_rate?: number
  fee?: string
  status: string
  notes?: string
  created_at: string
  updated_at?: string
}

export default function MerchantDashboardPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("pending")
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null)
  const [showTransactionDetails, setShowTransactionDetails] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState("today")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showFilterDialog, setShowFilterDialog] = useState(false)
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    minAmount: "",
    maxAmount: "",
    currency: "all",
    bankName: "",
  })

  // Stats calculated from real transactions
  const [stats, setStats] = useState({
    pendingCount: 0,
    completedCount: 0,
    rejectedCount: 0,
    totalVolume: "₦0",
    todayVolume: "₦0",
    balance: {
      usdt: "5,000", // Mock merchant balance
      usdc: "7,500",
      sol: "25",
    },
  })

  // Real transactions from Supabase
  const [transactions, setTransactions] = useState<Transaction[]>([])

  // Fetch transactions from Supabase
  const fetchTransactions = async () => {
    try {
      setIsLoading(true)
      console.log('Starting to fetch transactions from Supabase...')
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('Supabase response data:', data)
      console.log('Supabase response error:', error)

      if (error) {
        console.error('Supabase error:', error)
        toast({
          title: "Database Error",
          description: error.message || "Failed to fetch transactions",
          variant: "destructive",
        })
        return
      }

      console.log(`Successfully fetched ${data?.length || 0} transactions`)
      
      if (data) {
        setTransactions(data)
        calculateStats(data)
        
        if (data.length > 0) {
          toast({
            title: "Success",
            description: `Loaded ${data.length} transactions from database`,
          })
        } else {
          console.log('No transactions found in database')
        }
      }
      
    } catch (error) {
      console.error('Fetch error:', error)
      toast({
        title: "Connection Error",
        description: "Failed to connect to database",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate stats from real transactions
  const calculateStats = (transactionData: Transaction[]) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const pendingCount = transactionData.filter(tx => tx.status === 'pending').length
    const completedCount = transactionData.filter(tx => tx.status === 'completed').length
    const rejectedCount = transactionData.filter(tx => tx.status === 'rejected').length

    // Calculate total volume (all completed transactions)
    const totalVolume = transactionData
      .filter(tx => tx.status === 'completed')
      .reduce((sum, tx) => sum + Number(tx.to_amount || 0), 0)

    // Calculate today's volume
    const todayVolume = transactionData
      .filter(tx => {
        const txDate = new Date(tx.created_at)
        return tx.status === 'completed' && txDate >= today
      })
      .reduce((sum, tx) => sum + Number(tx.to_amount || 0), 0)

    setStats(prev => ({
      ...prev,
      pendingCount,
      completedCount,
      rejectedCount,
      totalVolume: `₦${totalVolume.toLocaleString()}`,
      todayVolume: `₦${todayVolume.toLocaleString()}`,
    }))
  }

  // Fetch transactions on component mount
  useEffect(() => {
    fetchTransactions()
  }, [])

  const handleViewTransaction = (transactionId: string) => {
    setSelectedTransaction(transactionId)
    setShowTransactionDetails(true)
  }

  const handleProcessTransaction = async (transactionId: string) => {
    setIsProcessing(true)

    try {
      const { error } = await supabase
        .from('transactions')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString(),
          notes: 'Processed by merchant'
        })
        .eq('id', transactionId)

      if (error) {
        toast({
          title: "Error",
          description: "Failed to process transaction",
          variant: "destructive",
        })
        return
      }

      // Refresh transactions
      await fetchTransactions()
      setShowTransactionDetails(false)

      toast({
        title: "Transaction Processed",
        description: `Transaction has been successfully processed.`,
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process transaction",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRejectTransaction = async (transactionId: string, reason: string) => {
    setIsProcessing(true)

    try {
      const { error } = await supabase
        .from('transactions')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString(),
          notes: `Rejected: ${reason}`
        })
        .eq('id', transactionId)

      if (error) {
        toast({
          title: "Error",
          description: "Failed to reject transaction",
          variant: "destructive",
        })
        return
      }

      // Refresh transactions
      await fetchTransactions()
      setShowTransactionDetails(false)

      toast({
        title: "Transaction Rejected",
        description: `Transaction has been rejected.`,
        variant: "destructive",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject transaction",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const applyFilters = () => {
    toast({
      title: "Filters Applied",
      description: "Transaction list has been filtered according to your criteria.",
    })
    setShowFilterDialog(false)
  }

  const resetFilters = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      minAmount: "",
      maxAmount: "",
      currency: "all",
      bankName: "",
    })
    toast({
      title: "Filters Reset",
      description: "All filters have been cleared.",
    })
  }

  const filteredTransactions = transactions.filter((tx) => {
    // Filter by status
    if (activeTab === "pending" && tx.status !== "pending") return false
    if (activeTab === "completed" && tx.status !== "completed") return false
    if (activeTab === "rejected" && tx.status !== "rejected") return false

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        tx.transaction_id?.toLowerCase().includes(query) ||
        tx.account_name?.toLowerCase().includes(query) ||
        tx.account_number?.includes(query) ||
        tx.wallet_address?.toLowerCase().includes(query)
      )
    }

    return true
  })

  const getSelectedTransaction = () => {
    return transactions.find((tx) => tx.id === selectedTransaction) || null
  }

  const formatTransactionForTable = (tx: Transaction) => ({
    id: tx.transaction_id || tx.id,
    userId: tx.wallet_address || 'Unknown',
    userName: tx.account_name,
    fromAmount: tx.from_amount.toString(),
    fromCurrency: tx.from_currency,
    toAmount: tx.to_amount.toLocaleString(),
    toCurrency: tx.to_currency,
    bankName: tx.bank_name,
    accountNumber: tx.account_number,
    accountName: tx.account_name,
    status: tx.status,
    createdAt: tx.created_at,
    updatedAt: tx.updated_at,
    notes: tx.notes || "",
  })

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-xl font-bold text-primary">
              Amigo Exchange <span className="text-sm font-normal text-muted-foreground">Merchant</span>
            </Link>
          </div>
          <nav className="flex items-center gap-4">
            <NotificationsPopover />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg?height=32&width=32&text=ME" alt="Merchant" />
                    <AvatarFallback>ME</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-sm">
                    <span>Merchant</span>
                    <span className="text-xs text-muted-foreground">Admin</span>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
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
                <DropdownMenuItem>
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
              <h1 className="text-3xl font-bold">Merchant Dashboard</h1>
              <p className="text-muted-foreground">Manage and process user crypto-to-fiat conversions</p>
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
                <p className="text-xs text-muted-foreground">Requires your action</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
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
                <CardTitle className="text-sm font-medium">Today's Volume</CardTitle>
                <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? "..." : stats.todayVolume}</div>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </CardContent>
            </Card>
          </div>

          {/* Merchant Balance */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Merchant Balance</CardTitle>
              <CardDescription>Your current crypto balance for processing transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                    <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">USDT Balance</p>
                    <p className="text-2xl font-bold">{stats.balance.usdt}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                    <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">USDC Balance</p>
                    <p className="text-2xl font-bold">{stats.balance.usdc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                    <Wallet className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">SOL Balance</p>
                    <p className="text-2xl font-bold">{stats.balance.sol}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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
                  <Button variant="outline" size="sm" onClick={() => setShowFilterDialog(true)}>
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
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
                  ) : filteredTransactions.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-muted-foreground">
                        {searchQuery ? 'No transactions match your search.' : 'No transactions found.'}
                      </div>
                    </div>
                  ) : (
                    <MerchantTransactionTable
                      transactions={filteredTransactions.map(formatTransactionForTable)}
                      onViewTransaction={handleViewTransaction}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Transaction Details Dialog */}
      {selectedTransaction && (
        <MerchantTransactionDetails
          transaction={getSelectedTransaction()}
          open={showTransactionDetails}
          onOpenChange={setShowTransactionDetails}
          onProcessTransaction={handleProcessTransaction}
          onRejectTransaction={handleRejectTransaction}
          isProcessing={isProcessing}
        />
      )}

      {/* Filter Dialog */}
      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter Transactions</DialogTitle>
            <DialogDescription>Set criteria to filter the transaction list</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateFrom">Date From</Label>
                <Input
                  id="dateFrom"
                  name="dateFrom"
                  type="date"
                  value={filters.dateFrom}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo">Date To</Label>
                <Input
                  id="dateTo"
                  name="dateTo"
                  type="date"
                  value={filters.dateTo}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minAmount">Min Amount</Label>
                <Input
                  id="minAmount"
                  name="minAmount"
                  type="number"
                  placeholder="0"
                  value={filters.minAmount}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxAmount">Max Amount</Label>
                <Input
                  id="maxAmount"
                  name="maxAmount"
                  type="number"
                  placeholder="1000000"
                  value={filters.maxAmount}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select name="currency" value={filters.currency} onValueChange={(value) => setFilters(prev => ({...prev, currency: value}))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Currencies</SelectItem>
                  <SelectItem value="usdt">USDT</SelectItem>
                  <SelectItem value="usdc">USDC</SelectItem>
                  <SelectItem value="sol">SOL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                name="bankName"
                placeholder="Enter bank name"
                value={filters.bankName}
                onChange={handleFilterChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetFilters}>
              Reset
            </Button>
            <Button onClick={applyFilters}>Apply Filters</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


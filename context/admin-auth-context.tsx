"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

type AdminAuthContextType = {
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  login: async () => false,
  logout: () => {},
})

// Admin credentials from environment variables
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Check if admin is already authenticated
    const adminAuth = localStorage.getItem('admin_authenticated')
    if (adminAuth === 'true') {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])
  

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        setIsAuthenticated(true)
        localStorage.setItem('admin_authenticated', 'true')
        toast({
          title: "Success",
          description: "Admin login successful!",
          variant: "default",
        })
        return true
      } else {
        toast({
          title: "Error",
          description: "Invalid admin credentials",
          variant: "destructive",
        })
        return false
      }
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Error",
        description: "Login failed. Please try again.",
        variant: "destructive",
      })
      return false
    }
  }

  const logout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('admin_authenticated')
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
      variant: "default",
    })
    router.push('/admin/login')
  }

  const value = {
    isAuthenticated,
    isLoading,
    login,
    logout,
  }

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider")
  }
  return context
}

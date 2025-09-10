"use client"

import { useAdminAuth } from "@/context/admin-auth-context"

export default function AdminTestPage() {
  const { isAuthenticated, isLoading } = useAdminAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Admin Test Page</h1>
        <p className="text-muted-foreground mb-4">
          This page tests the admin authentication context
        </p>
        <div className="space-y-2">
          <p>Loading: {isLoading ? "Yes" : "No"}</p>
          <p>Authenticated: {isAuthenticated ? "Yes" : "No"}</p>
        </div>
      </div>
    </div>
  )
}

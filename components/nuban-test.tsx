"use client"

import { useState } from 'react'
import { verifyBankAccount, testNubanApi } from '../services/bankApi'

export default function NubanTest() {
  const [accountNumber, setAccountNumber] = useState('')
  const [bankCode, setBankCode] = useState('058') // GTBank
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testVerification = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      console.log('Testing NUBAN API with:', { accountNumber, bankCode })
      
      // Test direct API call first
      console.log('=== Testing Direct NUBAN API ===');
      const directResponse = await testNubanApi(accountNumber, bankCode)
      console.log('Direct API Response:', directResponse)
      
      // Test through verification function
      console.log('=== Testing through verifyBankAccount ===');
      const response = await verifyBankAccount(accountNumber, bankCode)
      console.log('Verification Response:', response)
      
      setResult({
        directApi: directResponse,
        verification: response
      })
    } catch (error) {
      console.error('Test error:', error)
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 bg-gray-900 rounded-lg m-4">
      <h2 className="text-xl font-bold text-white mb-4">NUBAN API Test</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-2">Account Number</label>
          <input
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder="Enter 10-digit account number"
            className="w-full p-2 border border-gray-600 rounded bg-gray-800 text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm text-gray-300 mb-2">Bank Code</label>
          <select
            value={bankCode}
            onChange={(e) => setBankCode(e.target.value)}
            className="w-full p-2 border border-gray-600 rounded bg-gray-800 text-white"
          >
            <option value="058">Guaranty Trust Bank (058)</option>
            <option value="011">First Bank of Nigeria (011)</option>
            <option value="033">United Bank For Africa (033)</option>
            <option value="044">Access Bank (044)</option>
          </select>
        </div>
        
        <button
          onClick={testVerification}
          disabled={loading || accountNumber.length !== 10}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Verification'}
        </button>
        
        {result && (
          <div className="mt-4 p-4 bg-gray-800 rounded">
            <h3 className="text-lg font-semibold text-white mb-2">Result:</h3>
            <pre className="text-sm text-gray-300 overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

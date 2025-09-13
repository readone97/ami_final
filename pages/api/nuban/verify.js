// pages/api/nuban/verify.js

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { account_number, bank_code } = req.query
  const apiKey = process.env.NEXT_PUBLIC_NUBAN_API_KEY

  if (!apiKey) {
    return res.status(500).json({ message: 'Missing NUBAN API key in environment.' })
  }

  if (!account_number || String(account_number).length !== 10) {
    return res.status(400).json({ message: 'Invalid or missing account_number parameter.' })
  }

  if (!bank_code) {
    return res.status(400).json({ message: 'Invalid or missing bank_code parameter.' })
  }

  try {
    // Verify account details using NUBAN API with the correct format
    // Format: https://app.nuban.com.ng/api/API-KEY?bank_code=xxx&acc_no=xxx
    const verifyRes = await fetch(
      `https://app.nuban.com.ng/api/${apiKey}?bank_code=${bank_code}&acc_no=${account_number}`,
      { 
        headers: { 
          'Content-Type': 'application/json'
        } 
      }
    )
    
    if (!verifyRes.ok) {
      const err = await verifyRes.json().catch(() => null)
      return res.status(verifyRes.status).json({ 
        message: err?.message || 'Verification failed',
        status: false 
      })
    }

    const verifyData = await verifyRes.json()
    
    console.log('NUBAN API Response:', verifyData)
    
    // Check if the response indicates an error
    if (verifyData.error) {
      console.log('NUBAN API returned error:', verifyData.message)
      return res.status(400).json({
        message: verifyData.message || 'Account verification failed',
        status: false
      })
    }

    // Extract account name from various possible response formats
    const accountName = verifyData.account_name || verifyData.name || verifyData.data?.account_name || verifyData.accountName
    
    console.log('Extracted account name:', accountName)

    return res.status(200).json({
      status: true,
      message: 'Account verification successful',
      data: {
        account_name: accountName,
        account_number: account_number,
        bank_code: bank_code
      }
    })
  } catch (error) {
    console.error('NUBAN API proxy error:', error)
    return res.status(500).json({ 
      message: error.message || 'Internal server error',
      status: false 
    })
  }
}
// pages/api/nuban/banks.js

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Since NUBAN doesn't have a banks endpoint, return mock banks data
    const mockBanks = [
      { id: '1', code: '044', name: 'Access Bank' },
      { id: '2', code: '023', name: 'Citibank Nigeria' },
      { id: '3', code: '050', name: 'Ecobank Nigeria' },
      { id: '4', code: '011', name: 'First Bank of Nigeria' },
      { id: '5', code: '214', name: 'First City Monument Bank' },
      { id: '6', code: '070', name: 'Fidelity Bank Nigeria' },
      { id: '7', code: '058', name: 'Guaranty Trust Bank' },
      { id: '8', code: '030', name: 'Heritage Bank' },
      { id: '9', code: '301', name: 'Jaiz Bank' },
      { id: '10', code: '082', name: 'Keystone Bank' },
      { id: '11', code: '221', name: 'Stanbic IBTC Bank' },
      { id: '12', code: '068', name: 'Standard Chartered Bank' },
      { id: '13', code: '232', name: 'Sterling Bank' },
      { id: '14', code: '032', name: 'Union Bank of Nigeria' },
      { id: '15', code: '033', name: 'United Bank For Africa' },
      { id: '16', code: '215', name: 'Unity Bank' },
      { id: '17', code: '035', name: 'Wema Bank' },
      { id: '18', code: '057', name: 'Zenith Bank' },
    ]

    return res.status(200).json({
      status: true,
      message: 'Banks fetched successfully',
      data: mockBanks
    })
  } catch (error) {
    console.error('Banks API error:', error)
    return res.status(500).json({ 
      message: error.message || 'Internal server error',
      status: false 
    })
  }
}
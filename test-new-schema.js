const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://pifbldakoykhavivriwu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpZmJsZGFrb3lraGF2aXZyaXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2NjMxMTYsImV4cCI6MjA1NjIzOTExNn0.xM8EPguadI_c97XLD2vi7mqV51M-YZdW6f5TtwPyuxU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testNewSchema() {
  try {
    console.log('Testing new database schema...')
    
    // Test 1: Test basic query
    console.log('\n1. Testing basic profiles query...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(3)

    console.log('Profiles query:')
    console.log('Data:', profiles)
    console.log('Error:', profilesError)
    
    // Test 2: Test wallet address query (the one that was failing)
    console.log('\n2. Testing wallet address query...')
    const { data: walletData, error: walletError } = await supabase
      .from('profiles')
      .select('id, auth_user_id, wallet_address, username, email')
      .eq('wallet_address', 'test-wallet-123')
      .maybeSingle()

    console.log('Wallet query:')
    console.log('Data:', walletData)
    console.log('Error:', walletError)
    
    if (walletError) {
      console.log('Wallet error details:', {
        message: walletError.message,
        details: walletError.details,
        hint: walletError.hint,
        code: walletError.code
      })
    }
    
    // Test 3: Test insert with new schema (without auth_user_id)
    console.log('\n3. Testing insert...')
    const testData = {
      wallet_address: 'test-wallet-' + Date.now(),
      username: 'test-user',
      email: 'test@example.com'
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert(testData)
      .select()

    console.log('Insert result:')
    console.log('Data:', insertData)
    console.log('Error:', insertError)
    
    if (insertError) {
      console.log('Insert error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      })
    }
    
    console.log('\n✅ Schema test completed!')
    
  } catch (err) {
    console.error('❌ Test failed:', err)
  }
}

testNewSchema() 
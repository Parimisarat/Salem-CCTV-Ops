import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const envContent = fs.readFileSync(path.resolve('./.env'), 'utf-8')
const env = {}
envContent.split('\n').forEach(line => {
  const [key, val] = line.split('=')
  if (key && val) env[key.trim()] = val.trim()
})

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

async function testDB() {
  console.log('Testing attendance_logs...')
  try {
    const res1 = await supabase.from('attendance_logs').select('*').limit(1)
    console.log('attendance_logs:', res1.error ? res1.error.message : 'OK, Columns: ' + (res1.data && res1.data.length ? Object.keys(res1.data[0]).join(', ') : 'Empty'))
  } catch (e) {
    console.log('attendance_logs error:', e.message)
  }

  console.log('\nTesting work_logs...')
  try {
    const res2 = await supabase.from('work_logs').select('*').limit(1)
    console.log('work_logs:', res2.error ? res2.error.message : 'OK, Columns: ' + (res2.data && res2.data.length ? Object.keys(res2.data[0]).join(', ') : 'Empty'))
  } catch(e) {
    console.log('work_logs error:', e.message)
  }

  console.log('\nTesting customers...')
  try {
    const res3 = await supabase.from('customers').select('*').limit(1)
    console.log('customers:', res3.error ? res3.error.message : 'OK, Columns: ' + (res3.data && res3.data.length ? Object.keys(res3.data[0]).join(', ') : 'Empty'))
  } catch (e) {
    console.log('customers error:', e.message)
  }
}

testDB()

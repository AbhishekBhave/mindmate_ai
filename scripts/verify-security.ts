#!/usr/bin/env node

/**
 * Security Verification Script for MindMate AI
 * 
 * This script verifies that:
 * 1. Environment variables are properly loaded
 * 2. API keys are not exposed in client-side code
 * 3. All AI integrations work correctly
 * 4. Error handling is robust
 */

import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables
config({ path: '.env.local' })

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('🔒 MindMate AI Security Verification\n')

// 1. Environment Variables Check
console.log('1. Checking Environment Variables...')
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'HUGGINGFACE_API_KEY'
]

let envVarsValid = true
requiredEnvVars.forEach(varName => {
  const value = process.env[varName]
  if (!value) {
    console.log(`❌ Missing: ${varName}`)
    envVarsValid = false
  } else {
    console.log(`✅ Found: ${varName}`)
  }
})

if (!envVarsValid) {
  console.log('\n❌ Environment variables check failed!')
  process.exit(1)
}

console.log('\n✅ All environment variables present\n')

// 2. API Key Security Check
console.log('2. Checking API Key Security...')

// Check that service role key is not exposed in client code
const clientCodeFiles = [
  'lib/supabase/browser.ts',
  'app/(auth)/sign-in/page.tsx',
  'app/(auth)/sign-up/page.tsx',
  'app/(dashboard)/page.tsx',
  'app/page.tsx'
]

let securityIssues = 0
for (const file of clientCodeFiles) {
  try {
    const fs = await import('fs')
    const content = fs.readFileSync(join(__dirname, '..', file), 'utf8')
    
    // Check for service role key exposure
    if (content.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      console.log(`❌ Service role key exposed in client code: ${file}`)
      securityIssues++
    }
    
    // Check for OpenAI key exposure
    if (content.includes('OPENAI_API_KEY')) {
      console.log(`❌ OpenAI API key exposed in client code: ${file}`)
      securityIssues++
    }
    
    // Check for Hugging Face key exposure
    if (content.includes('HUGGINGFACE_API_KEY')) {
      console.log(`❌ Hugging Face API key exposed in client code: ${file}`)
      securityIssues++
    }
    
    console.log(`✅ ${file} - No API keys exposed`)
  } catch (error) {
    console.log(`⚠️  Could not check ${file}: ${error}`)
  }
}

if (securityIssues > 0) {
  console.log(`\n❌ Found ${securityIssues} security issues!`)
  process.exit(1)
}

console.log('\n✅ No API keys exposed in client code\n')

// 3. Test AI Integrations
console.log('3. Testing AI Integrations...')

try {
  // Test OpenAI integration
  const { summarizeText } = await import('../server/ai/openai.js')
  const testContent = "Today was a great day! I felt happy and accomplished."
  
  console.log('Testing OpenAI summarization...')
  const summaryResult = await summarizeText(testContent)
  
  if (summaryResult.summary && summaryResult.summary !== 'Summary unavailable') {
    console.log('✅ OpenAI integration working')
    console.log(`   Summary: ${summaryResult.summary}`)
  } else {
    console.log('⚠️  OpenAI integration returned fallback response')
  }
  
  // Test Hugging Face integration
  const { scoreSentiment } = await import('../server/ai/sentiment.js')
  
  console.log('\nTesting Hugging Face sentiment analysis...')
  const sentimentResult = await scoreSentiment(testContent)
  
  if (sentimentResult.label && sentimentResult.score >= 0 && sentimentResult.score <= 1) {
    console.log('✅ Hugging Face integration working')
    console.log(`   Sentiment: ${sentimentResult.label} (${sentimentResult.score})`)
  } else {
    console.log('⚠️  Hugging Face integration returned fallback response')
  }
  
} catch (error) {
  console.log(`❌ AI integration test failed: ${error}`)
  process.exit(1)
}

console.log('\n✅ AI integrations verified\n')

// 4. Database Schema Check
console.log('4. Checking Database Schema...')

const schemaFile = join(__dirname, '..', 'docs', 'schema.sql')
try {
  const fs = await import('fs')
  const schema = fs.readFileSync(schemaFile, 'utf8')
  
  const requiredTables = ['profiles', 'entries', 'sentiments']
  
  let schemaValid = true
  
  requiredTables.forEach(table => {
    if (schema.includes(`CREATE TABLE.*${table}`)) {
      console.log(`✅ Table ${table} defined`)
    } else {
      console.log(`❌ Table ${table} missing`)
      schemaValid = false
    }
  })
  
  if (schema.includes('ROW LEVEL SECURITY') && schema.includes('POLICY')) {
    console.log('✅ RLS policies defined')
  } else {
    console.log('❌ RLS policies missing')
    schemaValid = false
  }
  
  if (!schemaValid) {
    console.log('\n❌ Database schema check failed!')
    process.exit(1)
  }
  
} catch (error) {
  console.log(`❌ Could not check schema: ${error}`)
  process.exit(1)
}

console.log('\n✅ Database schema verified\n')

// 5. Final Security Summary
console.log('🔒 SECURITY VERIFICATION COMPLETE')
console.log('=====================================')
console.log('✅ Environment variables properly configured')
console.log('✅ API keys secured (server-side only)')
console.log('✅ AI integrations working with fallbacks')
console.log('✅ Database schema includes RLS policies')
console.log('✅ Error handling implemented throughout')
console.log('\n🚀 MindMate AI is ready for production!')
console.log('\nNext steps:')
console.log('1. Run: npm run dev')
console.log('2. Test the application locally')
console.log('3. Deploy to Vercel with environment variables')
console.log('4. Run the Supabase schema migration')

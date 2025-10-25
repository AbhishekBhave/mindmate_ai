#!/usr/bin/env node

import { execSync, spawn } from 'child_process'
import { existsSync, unlinkSync, rmdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

function isRunningOnMacOS() {
  return process.platform === 'darwin'
}

function findNextDevProcess() {
  try {
    if (isRunningOnMacOS()) {
      // Use ps to find Next.js dev processes
      const output = execSync('ps aux | grep "next dev" | grep -v grep', { encoding: 'utf8' })
      const lines = output.trim().split('\n').filter(line => line.length > 0)
      
      for (const line of lines) {
        const parts = line.trim().split(/\s+/)
        const pid = parts[1]
        const command = line.includes('next dev')
        
        if (command && pid) {
          return { pid, command: line }
        }
      }
    } else {
      // Fallback for other platforms
      const output = execSync('ps aux | grep "next dev" | grep -v grep', { encoding: 'utf8' })
      const lines = output.trim().split('\n').filter(line => line.length > 0)
      
      for (const line of lines) {
        const parts = line.trim().split(/\s+/)
        const pid = parts[1]
        
        if (pid && line.includes('next dev')) {
          return { pid, command: line }
        }
      }
    }
  } catch (error) {
    // ps command failed, continue with lock file cleanup
  }
  
  return null
}

function removeLockFile() {
  const lockPath = join(projectRoot, '.next', 'dev', 'lock')
  
  if (existsSync(lockPath)) {
    try {
      unlinkSync(lockPath)
      console.log('✅ Removed stale lock file')
      
      // Try to remove empty parent directories
      const devDir = join(projectRoot, '.next', 'dev')
      const nextDir = join(projectRoot, '.next')
      
      try {
        rmdirSync(devDir)
        console.log('✅ Removed empty .next/dev directory')
      } catch {
        // Directory not empty, that's fine
      }
      
      try {
        rmdirSync(nextDir)
        console.log('✅ Removed empty .next directory')
      } catch {
        // Directory not empty, that's fine
      }
      
      return true
    } catch (error) {
      console.error('❌ Failed to remove lock file:', error.message)
      return false
    }
  }
  
  return false
}

function main() {
  console.log('🔍 Checking for running Next.js dev processes...')
  
  const runningProcess = findNextDevProcess()
  
  if (runningProcess) {
    console.log(`❌ Next.js dev process is already running (PID: ${runningProcess.pid})`)
    console.log(`   Command: ${runningProcess.command}`)
    console.log('')
    console.log('Please stop the existing process first:')
    console.log(`   kill ${runningProcess.pid}`)
    console.log('')
    console.log('Or use: npm run clean && npm run dev')
    process.exit(1)
  }
  
  console.log('✅ No running Next.js dev processes found')
  
  // Check for stale lock file
  const lockPath = join(projectRoot, '.next', 'dev', 'lock')
  if (existsSync(lockPath)) {
    console.log('🔓 Found stale lock file, removing...')
    const removed = removeLockFile()
    if (!removed) {
      console.log('⚠️  Could not remove lock file automatically')
      console.log('   Please run: rm -rf .next/dev/lock')
      process.exit(1)
    }
  } else {
    console.log('✅ No stale lock files found')
  }
  
  console.log('🚀 Ready to start development server')
}

main()


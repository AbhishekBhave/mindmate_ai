'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Home, Bell, Settings, User as UserIcon, LogOut, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'

interface JournalHeaderProps {
  userEmail: string
  onSignOut: () => void
  onSettingsOpen?: () => void
  onNotificationsOpen?: () => void
}

export function JournalHeader({ userEmail, onSignOut, onSettingsOpen, onNotificationsOpen }: JournalHeaderProps) {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="sticky top-0 z-50 backdrop-blur-md bg-white/10 border-b border-white/20 shadow-lg"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side: Home icon and logo */}
          <div className="flex items-center space-x-4">
            <Link href="/">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-xl backdrop-blur-sm bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 group"
              >
                <Home className="h-5 w-5 text-purple-500 group-hover:drop-shadow-[0_0_8px_rgba(147,51,234,0.5)] transition-all duration-300" />
              </motion.div>
            </Link>
            <div className="flex items-center">
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-purple-600 to-indigo-600 bg-clip-text text-transparent"
              >
                MindMate AI
              </motion.h1>
            </div>
          </div>

          {/* Center: Search bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search entries..."
                className="pl-10 backdrop-blur-sm bg-white/5 border-white/20 focus:ring-purple-400/50"
              />
            </div>
          </div>

          {/* Right side: Icons */}
          <div className="flex items-center space-x-3">
            {/* Notification bell */}
            <motion.button
              onClick={onNotificationsOpen}
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-xl backdrop-blur-sm bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer group relative"
            >
              <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300 group-hover:text-purple-500 transition-colors duration-300" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full"></span>
            </motion.button>

            {/* Settings gear */}
            <motion.button
              onClick={onSettingsOpen}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="p-2 rounded-xl backdrop-blur-sm bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer group"
            >
              <Settings className="h-5 w-5 text-gray-700 dark:text-gray-300 group-hover:text-purple-500 transition-colors duration-300" />
            </motion.button>

            {/* User avatar with purple gradient ring */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 p-[2px]">
                    <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center backdrop-blur-xl">
                      <UserIcon className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 backdrop-blur-xl bg-white/10 border border-white/20" align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium text-gray-900 dark:text-white">{userEmail}</p>
                  </div>
                </div>
                <DropdownMenuItem onClick={onSignOut} className="text-red-500 focus:text-red-500 focus:bg-red-50/10">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </motion.header>
  )
}


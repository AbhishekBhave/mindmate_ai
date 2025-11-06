'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, Home, Bell, Bookmark, Search, Heart, Hand, PartyPopper,
  Plus, ArrowUpCircle, MessageSquare, TrendingUp, Clock, Trophy, Zap,
  Shield, GraduationCap, Users, Heart as HeartIcon, Moon, Book, Brain,
  Lightbulb, ChevronDown, MoreHorizontal, Share2, Flag, CornerUpLeft,
  X, Smile, Meh, Frown, AlertCircle
} from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { AnimatedBackground } from '@/components/dashboard/AnimatedBackground'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { Category, Post, Reply, CommunityState } from '@/types'
import {
  getUserReaction,
  isPostSaved,
  saveUserInteraction,
  getReactionsCount,
  getCurrentUserId
} from './interactions'

// Wordlists for pseudonym generation
const adjectives = [
  'Gentle', 'Calm', 'Kind', 'Bright', 'Peaceful', 'Tranquil', 'Serene', 'Warm', 
  'Hopeful', 'Brave', 'Quiet', 'Soft', 'Clear', 'Pure', 'Safe', 'Secure',
  'Understanding', 'Caring', 'Supportive', 'Encouraging', 'Thoughtful', 'Wise'
]

const nouns = [
  'Cloud', 'Ocean', 'Mountain', 'River', 'Star', 'Moon', 'Sun', 'Breeze', 
  'Wave', 'Forest', 'Meadow', 'Lighthouse', 'Shelter', 'Harbor', 'Garden',
  'Reflection', 'Path', 'Journey', 'Light', 'Dawn', 'Dusk', 'Hope'
]

const colors = [
  '#B794F6', '#9F7AEA', '#805AD5', '#6366F1', '#8B5CF6', '#A78BFA',
  '#C084FC', '#D8B4FE', '#E9D5FF', '#F3E8FF', '#EDE9FE'
]

interface CommunityClientProps {
  user: SupabaseUser
}

export default function CommunityClient({ user }: CommunityClientProps) {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const [sortBy, setSortBy] = useState<'hot' | 'new' | 'top' | 'rising'>('hot')
  const [notificationCount, setNotificationCount] = useState(0)

  // Create post form state
  const [newPostCategory, setNewPostCategory] = useState<string>('')
  const [newPostTitle, setNewPostTitle] = useState<string>('')
  const [newPostContent, setNewPostContent] = useState<string>('')
  const [isCreatingPost, setIsCreatingPost] = useState(false)

  // Interaction state
  const [reactions, setReactions] = useState<Record<string, string>>({})
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set())
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({})

  useEffect(() => {
    // Load saved state from localStorage
    const userId = getCurrentUserId()
    const saved = localStorage.getItem('mindmate_community_interactions')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setSavedPosts(new Set(data.saved?.map((s: any) => s.postId) || []))
        const reactionMap: Record<string, string> = {}
        data.reactions?.forEach((r: any) => {
          if (r.userId === userId) {
            reactionMap[r.postId] = r.emoji
          }
        })
        setReactions(reactionMap)
      } catch (e) {
        console.error('Failed to load interactions:', e)
      }
    }
  }, [])

  useEffect(() => {
    loadCategories()
    loadPosts()
  }, [selectedCategory, sortBy])

  const generatePseudonym = (categoryId?: string) => {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]
    const num = Math.floor(1000 + Math.random() * 9000)
    return `${adj}${noun}${num}`
  }

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/community/categories')
      const data = await response.json()
      if (data.ok) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadPosts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/community/posts?category=${selectedCategory || 'all'}&sort=${sortBy}`)
      const data = await response.json()
      if (data.ok) {
        setPosts(data.data)
      }
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const getIconForCategory = (iconName: string | null) => {
    const iconMap: Record<string, any> = {
      'shield': Shield,
      'graduation-cap': GraduationCap,
      'users': Users,
      'heart': HeartIcon,
      'moon': Moon,
      'book': Book,
      'brain': Brain,
      'lightbulb': Lightbulb,
      'trophy': Trophy,
    }
    return iconMap[iconName || ''] || MessageSquare
  }

  const handleCreatePost = async () => {
    if (!newPostCategory || !newPostTitle || !newPostContent) {
      toast.error('Please fill in all fields')
      return
    }

    setIsCreatingPost(true)
    try {
      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: newPostCategory,
          title: newPostTitle,
          content: newPostContent,
          content_warnings: [],
          mood_tags: []
        })
      })

      const data = await response.json()
      
      if (data.ok) {
        toast.success('Post created successfully!')
        setShowCreatePost(false)
        setNewPostCategory('')
        setNewPostTitle('')
        setNewPostContent('')
        // Refresh the posts list
        loadPosts()
      } else {
        console.error('API returned error:', data.error)
        toast.error(data.error || 'Failed to create post')
      }
    } catch (error: any) {
      console.error('Error creating post:', error)
      toast.error(error?.message || 'An unexpected error occurred. Please try again.')
    } finally {
      setIsCreatingPost(false)
    }
  }

  // Reaction handlers
  const handleReaction = (postId: string, emoji: string) => {
    const currentReaction = reactions[postId]
    
    // Toggle reaction
    if (currentReaction === emoji) {
      // Remove reaction
      const newReactions = { ...reactions }
      delete newReactions[postId]
      setReactions(newReactions)
      saveUserInteraction('reaction', { postId, emoji: null })
    } else {
      // Add or change reaction
      const newReactions = { ...reactions, [postId]: emoji }
      setReactions(newReactions)
      saveUserInteraction('reaction', { postId, emoji })
    }
  }

  // Save handler
  const handleSave = (postId: string) => {
    const newSavedPosts = new Set(savedPosts)
    if (newSavedPosts.has(postId)) {
      newSavedPosts.delete(postId)
      toast.success('Post unsaved')
    } else {
      newSavedPosts.add(postId)
      toast.success('Post saved')
    }
    setSavedPosts(newSavedPosts)
    saveUserInteraction('saved', { postId })
  }

  // Reply handlers
  const handleReplyClick = (postId: string) => {
    const newExpanded = new Set(expandedReplies)
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId)
    } else {
      newExpanded.add(postId)
    }
    setExpandedReplies(newExpanded)
  }

  const handleReplySubmit = async (postId: string) => {
    const content = replyInputs[postId]?.trim()
    if (!content) return

    const sanitized = content.replace(/<[^>]*>/g, '') // Basic sanitization
    
    // Save to localStorage
    saveUserInteraction('comment', { postId, content: sanitized })

    // Clear input
    const newInputs = { ...replyInputs }
    delete newInputs[postId]
    setReplyInputs(newInputs)

    toast.success('Reply posted!')
  }

  const handleReplyInput = (postId: string, value: string) => {
    setReplyInputs({ ...replyInputs, [postId]: value })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/20 relative overflow-hidden">
      <AnimatedBackground />

      {/* Sticky Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 backdrop-blur-md bg-white/10 border-b border-white/20 shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Back and Home */}
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05, x: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.back()}
                className="p-2 rounded-xl backdrop-blur-sm bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              >
                <ChevronLeft className="h-5 w-5 text-purple-500" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/')}
                className="p-2 rounded-xl backdrop-blur-sm bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              >
                <Home className="h-5 w-5 text-purple-500" />
              </motion.button>
            </div>

            {/* Center: Search */}
            <div className="flex-1 max-w-2xl mx-4 hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search posts, users, categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 backdrop-blur-sm bg-white/5 border-white/20 focus:ring-purple-400/50"
                />
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSaved(!showSaved)}
                className="p-2 rounded-xl backdrop-blur-sm bg-white/5 hover:bg-white/10 border border-white/10 transition-all relative"
              >
                <Bookmark className="h-5 w-5 text-purple-500" />
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center">
                  3
                </Badge>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-xl backdrop-blur-sm bg-white/5 hover:bg-white/10 border border-white/10 transition-all relative"
              >
                <Bell className="h-5 w-5 text-purple-500" />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </motion.button>
              <Button
                onClick={() => setShowCreatePost(true)}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Categories Filter */}
        <div className="mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                selectedCategory === null
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg'
                  : 'bg-white/50 backdrop-blur-sm border border-white/20 text-slate-700 hover:bg-white/70'
              }`}
            >
              All
            </motion.button>
            {categories.map((category) => {
              const Icon = getIconForCategory(category.icon_name)
              return (
                <motion.button
                  key={category.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg'
                      : 'bg-white/50 backdrop-blur-sm border border-white/20 text-slate-700 hover:bg-white/70'
                  }`}
                >
                  <Icon className="h-4 w-4" style={{ color: category.color }} />
                  {category.name}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant={sortBy === 'hot' ? 'default' : 'outline'}
            onClick={() => setSortBy('hot')}
            size="sm"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Hot
          </Button>
          <Button
            variant={sortBy === 'new' ? 'default' : 'outline'}
            onClick={() => setSortBy('new')}
            size="sm"
          >
            <Clock className="h-4 w-4 mr-2" />
            New
          </Button>
          <Button
            variant={sortBy === 'top' ? 'default' : 'outline'}
            onClick={() => setSortBy('top')}
            size="sm"
          >
            <Trophy className="h-4 w-4 mr-2" />
            Top
          </Button>
          <Button
            variant={sortBy === 'rising' ? 'default' : 'outline'}
            onClick={() => setSortBy('rising')}
            size="sm"
          >
            <Zap className="h-4 w-4 mr-2" />
            Rising
          </Button>
        </div>

        {/* Posts Feed */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded w-full mt-2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {posts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl hover:shadow-2xl transition-all cursor-pointer"
                    onClick={() => router.push(`/community/post/${post.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" style={{ backgroundColor: '#FFF5E6', color: '#805AD5' }}>
                              <Shield className="h-3 w-3 mr-1" />
                              Anonymous
                            </Badge>
                            {post.category && (
                              <Badge variant="outline">
                                {post.category.name}
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-xl">{post.title}</CardTitle>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600 dark:text-slate-400 mb-4 line-clamp-3">
                        {post.content}
                      </p>
                      
                      {/* Interaction buttons */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleReaction(post.id, '❤️')
                            }}
                            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                              reactions[post.id] === '❤️' ? 'bg-pink-100 text-pink-600' : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            ❤️ {post.reaction_count + (reactions[post.id] ? 1 : 0)}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleReaction(post.id, '👍')
                            }}
                            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                              reactions[post.id] === '👍' ? 'bg-blue-100 text-blue-600' : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            👍 {post.reaction_count}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleReaction(post.id, '🎉')
                            }}
                            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                              reactions[post.id] === '🎉' ? 'bg-yellow-100 text-yellow-600' : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            🎉 {post.reaction_count}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleReplyClick(post.id)
                            }}
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            💬 Reply
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSave(post.id)
                            }}
                            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                              savedPosts.has(post.id) ? 'text-yellow-600' : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {savedPosts.has(post.id) ? '📌 Saved' : '🔖 Save'}
                          </button>
                        </div>
                        <span className="text-xs text-slate-500">{getTimeAgo(post.created_at)}</span>
                      </div>

                      {/* Reply input */}
                      {expandedReplies.has(post.id) && (
                        <div className="mt-4 pt-4 border-t border-slate-200" onClick={(e) => e.stopPropagation()}>
                          <Textarea
                            placeholder="Write a reply..."
                            value={replyInputs[post.id] || ''}
                            onChange={(e) => handleReplyInput(post.id, e.target.value)}
                            rows={3}
                            className="mb-2"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.ctrlKey) {
                                handleReplySubmit(post.id)
                              }
                            }}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleReplySubmit(post.id)}
                              disabled={!replyInputs[post.id]?.trim()}
                            >
                              Submit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReplyClick(post.id)}
                            >
                              Cancel
                            </Button>
                            <span className="text-xs text-slate-500 self-center ml-auto">Ctrl+Enter to submit</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {posts.length === 0 && (
              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                  <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                  <p className="text-slate-500 mb-4">
                    Be the first to share in this category!
                  </p>
                  <Button onClick={() => setShowCreatePost(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Post
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Create Post Dialog */}
      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Post</DialogTitle>
            <DialogDescription>
              Share anonymously with our supportive community
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <select 
                className="w-full p-2 border rounded-md"
                value={newPostCategory}
                onChange={(e) => setNewPostCategory(e.target.value)}
              >
                <option value="">Select a category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Title</label>
              <Input 
                placeholder="Enter your post title..."
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Content</label>
              <Textarea 
                placeholder="Share your thoughts..."
                rows={8}
                className="min-h-[200px]"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowCreatePost(false)}
                disabled={isCreatingPost}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1"
                onClick={handleCreatePost}
                disabled={isCreatingPost}
              >
                <Plus className="h-4 w-4 mr-2" />
                {isCreatingPost ? 'Posting...' : 'Post Anonymously'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


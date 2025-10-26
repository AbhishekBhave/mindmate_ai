'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ChevronLeft, Home, Bell, Share2, Flag, Heart, Hand, PartyPopper,
  MessageSquare, Bookmark, MoreHorizontal, CornerUpLeft, Clock,
  Shield, AlertCircle
} from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Post, Reply } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AnimatedBackground } from '@/components/dashboard/AnimatedBackground'
import { toast } from 'sonner'

interface PostClientProps {
  user: SupabaseUser
  postId: string
}

export default function PostClient({ user, postId }: PostClientProps) {
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [replyContent, setReplyContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showFullPost, setShowFullPost] = useState(true)

  useEffect(() => {
    loadPost()
    loadReplies()
  }, [postId])

  const loadPost = async () => {
    try {
      const response = await fetch(`/api/community/post/${postId}`)
      const data = await response.json()
      if (data.ok) {
        setPost(data.data)
      } else {
        toast.error('Failed to load post')
        router.push('/community')
      }
    } catch (error) {
      console.error('Error loading post:', error)
      toast.error('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const loadReplies = async () => {
    try {
      const response = await fetch(`/api/community/post/${postId}/replies`)
      const data = await response.json()
      if (data.ok) {
        setReplies(data.data)
      }
    } catch (error) {
      console.error('Error loading replies:', error)
    }
  }

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) return
    
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/community/post/${postId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent })
      })
      
      const data = await response.json()
      if (data.ok) {
        toast.success('Reply posted!')
        setReplyContent('')
        loadReplies()
      } else {
        toast.error('Failed to post reply')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setIsSubmitting(false)
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
      </div>
    )
  }

  if (!post) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/20 relative overflow-hidden">
      <AnimatedBackground />

      {/* Sticky Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 backdrop-blur-md bg-white/10 border-b border-white/20 shadow-lg"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.back()}
                className="p-2 rounded-xl backdrop-blur-sm bg-white/5 hover:bg-white/10 border border-white/10"
              >
                <ChevronLeft className="h-5 w-5 text-purple-500" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/')}
                className="p-2 rounded-xl backdrop-blur-sm bg-white/5 hover:bg-white/10 border border-white/10"
              >
                <Home className="h-5 w-5 text-purple-500" />
              </motion.button>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Flag className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Post */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl mb-6">
            <CardHeader>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" style={{ backgroundColor: '#FFF5E6', color: '#805AD5' }}>
                    <Shield className="h-3 w-3 mr-1" />
                    Anonymous
                  </Badge>
                  {post.category && (
                    <Badge variant="outline">{post.category.name}</Badge>
                  )}
                  <Badge variant="outline">
                    {getTimeAgo(post.created_at)}
                  </Badge>
                </div>
              </div>
              <CardTitle className="text-2xl">{post.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {post.content}
              </p>

              {post.content_warnings && post.content_warnings.length > 0 && (
                <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-900">Content Warnings</p>
                      <p className="text-xs text-amber-700">{post.content_warnings.join(', ')}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 mt-6 pt-4 border-t border-slate-200">
                <Button variant="ghost" size="sm">
                  <Heart className="h-4 w-4 mr-2" />
                  {post.reaction_count}
                </Button>
                <Button variant="ghost" size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {post.reply_count}
                </Button>
                <Button variant="ghost" size="sm">
                  <Bookmark className="h-4 w-4 mr-2" />
                  {post.save_count}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Reply Section */}
        <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl mb-6">
          <CardHeader>
            <CardTitle>Add a Reply</CardTitle>
            <CardDescription>Share your thoughts and provide support</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Share your thoughts..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={4}
              className="min-h-[100px]"
            />
            <Button 
              onClick={handleSubmitReply}
              disabled={isSubmitting || !replyContent.trim()}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600"
            >
              <CornerUpLeft className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Posting...' : 'Post Reply Anonymously'}
            </Button>
            <p className="text-xs text-center text-slate-500">
              <Shield className="h-3 w-3 inline mr-1" />
              Your reply will be posted anonymously
            </p>
          </CardContent>
        </Card>

        {/* Replies */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            {post.reply_count} {post.reply_count === 1 ? 'Reply' : 'Replies'}
          </h3>
          
          {replies.map((reply) => (
            <Card key={reply.id} className="backdrop-blur-xl bg-white/80 border-white/20 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="secondary" style={{ backgroundColor: '#FFF5E6', color: '#805AD5' }}>
                    <Shield className="h-3 w-3 mr-1" />
                    {reply.pseudonym?.anonymous_username || 'Anonymous User'}
                  </Badge>
                  <span className="text-xs text-slate-500">{getTimeAgo(reply.created_at)}</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {reply.content}
                </p>
                <div className="flex items-center gap-4 mt-4">
                  <Button variant="ghost" size="sm">
                    <Heart className="h-4 w-4 mr-2" />
                    {reply.reaction_count}
                  </Button>
                  {reply.is_mark_as_helpful && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      ✓ Most Helpful Reply
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {replies.length === 0 && (
            <Card className="backdrop-blur-xl bg-white/80 border-white/20">
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                <p className="text-slate-500">No replies yet. Be the first to respond!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}


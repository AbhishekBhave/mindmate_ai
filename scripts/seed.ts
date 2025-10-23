import { supabaseAdmin } from '../server/supabase/admin'

// Sample journal entries for demo
const sampleEntries = [
  {
    content: "Today was amazing! I finally finished my project and got great feedback from my team. I feel so accomplished and proud of what I've achieved. The weather was beautiful too, which made my walk home even more enjoyable.",
    expectedSentiment: { score: 0.8, label: 'positive' as const }
  },
  {
    content: "Feeling a bit overwhelmed with all the tasks I have to complete this week. There's so much on my plate and I'm not sure how I'll get everything done. I need to prioritize better and maybe ask for help.",
    expectedSentiment: { score: 0.3, label: 'negative' as const }
  },
  {
    content: "Had a regular day at work. Nothing particularly exciting happened, but nothing bad either. I had lunch with my colleague and we talked about weekend plans. Looking forward to some downtime.",
    expectedSentiment: { score: 0.5, label: 'neutral' as const }
  },
  {
    content: "I'm grateful for the small moments today. The coffee tasted perfect this morning, and I had a nice conversation with a stranger at the bus stop. Sometimes it's the little things that make life beautiful.",
    expectedSentiment: { score: 0.7, label: 'positive' as const }
  },
  {
    content: "Struggling with some personal issues today. Feeling lonely and disconnected from friends. I know these feelings will pass, but right now it's hard to see the light at the end of the tunnel.",
    expectedSentiment: { score: 0.2, label: 'negative' as const }
  }
]

async function seedDatabase() {
  try {
    console.log('Starting database seed...')

    // Create a test user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'demo@mindmate.ai',
      password: 'demo123456',
      email_confirm: true
    })

    if (authError) {
      console.error('Error creating user:', authError)
      return
    }

    const userId = authData.user.id
    console.log('Created demo user:', userId)

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        display_name: 'Demo User'
      })

    if (profileError) {
      console.error('Error creating profile:', profileError)
    }

    // Create entries with timestamps spread over the last 30 days
    const now = new Date()
    const entries = []

    for (let i = 0; i < sampleEntries.length; i++) {
      const daysAgo = Math.floor(Math.random() * 30)
      const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)

      const { data: entry, error: entryError } = await supabaseAdmin
        .from('entries')
        .insert({
          user_id: userId,
          content: sampleEntries[i].content,
          created_at: createdAt.toISOString()
        })
        .select()
        .single()

      if (entryError) {
        console.error('Error creating entry:', entryError)
        continue
      }

      // Create sentiment data
      const { error: sentimentError } = await supabaseAdmin
        .from('sentiments')
        .insert({
          entry_id: entry.id,
          score: sampleEntries[i].expectedSentiment.score,
          label: sampleEntries[i].expectedSentiment.label,
          summary: `AI-generated summary for entry ${i + 1}`,
          created_at: createdAt.toISOString()
        })

      if (sentimentError) {
        console.error('Error creating sentiment:', sentimentError)
      }

      entries.push(entry)
    }

    console.log(`Successfully created ${entries.length} entries`)
    console.log('Demo credentials:')
    console.log('Email: demo@mindmate.ai')
    console.log('Password: demo123456')
    console.log('Database seed completed!')

  } catch (error) {
    console.error('Seed error:', error)
  }
}

// Run the seed function
seedDatabase()

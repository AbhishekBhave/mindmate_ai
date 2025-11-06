# Personalized Suggestions Update

## What Changed
The "Personalized Suggestions" section now generates **contextually relevant advice** based on the actual content the user typed in their journal entry.

## Before
- Generic suggestions like "Consider reflecting on what brought you to write this entry today"
- Same suggestions for every entry
- Not related to the user's actual content

## After
Suggestions are now **dynamically generated** based on detected themes in the entry:

### Contextual Detection
The system now detects specific themes and provides relevant suggestions:

**Work/Stress:**
- "Work stress is valid. Consider setting boundaries to protect your personal time."

**Relationships/Social:**
- "Nurture your relationships by expressing appreciation for the people who support you."

**Sleep/Rest:**
- "Prioritize rest - quality sleep is essential for emotional well-being."

**Anxiety/Worry:**
- "Try a 5-minute breathing exercise: inhale for 4 counts, hold for 4, exhale for 4."

**Sadness/Hurt:**
- "It's okay to feel this way. Consider writing about what specifically triggered these feelings."

**Gratitude:**
- "Keep this gratitude practice going - it builds resilience and positive emotions."

**Goals/Future:**
- "Break your goals into smaller, achievable steps to maintain momentum."

**Family:**
- "Family relationships can be complex. Reflect on what boundaries might serve you."

**Exercise:**
- "Physical activity releases endorphins. Aim to move your body in ways that bring you joy."

**Overwhelm:**
- "When feeling overwhelmed, try the '2-minute rule' - tackle just one small task to regain momentum."

### Sentiment-Aware Suggestions
The system also provides sentiment-specific guidance:

- **Positive entries** → Celebratory, momentum-building suggestions
- **Negative entries** → Supportive, coping-strategy suggestions
- **Neutral entries** → Reflective, self-exploration suggestions

### Main Message Changes
The main suggestion message is now also contextually aware:

- Positive + achievement words → "Celebrate your achievements! Take a moment to acknowledge how you got here. 🌟"
- Positive + gratitude → "Your gratitude practice is powerful. Keep nurturing this positive mindset! 🌟"
- Negative + anxiety → "Anxiety is understandable. Try deep breathing - you have the tools to navigate this. 💜"
- Negative + sadness → "I hear you, and these feelings matter. Self-compassion goes a long way. 💜"
- Negative + anger → "Anger often signals a need. What boundary or action might help address this? 💜"

## Technical Implementation
File: `components/dashboard/AIInsightsSection.tsx`

- Added `generateSuggestions()` function that analyzes entry content
- Uses keyword detection to identify themes
- Provides context-specific suggestions based on detected themes
- Falls back to sentiment-based general suggestions if needed
- Ensures 3-4 suggestions are always provided

## Example
If a user writes: "I'm feeling anxious about my job interview tomorrow and worried I won't do well"

They might receive:
- "Try a 5-minute breathing exercise: inhale for 4 counts, hold for 4, exhale for 4."
- "Work stress is valid. Consider setting boundaries to protect your personal time."
- "Try to identify one small action you can take today to improve your emotional state."

All suggestions are now **directly related** to what the user actually wrote!


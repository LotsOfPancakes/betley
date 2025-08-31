// ============================================================================
// File: frontend/app/api/telegram/webhook/route.ts
// Telegram Bot Webhook Handler
// Purpose: Handle incoming Telegram updates and process /betley commands
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, generateRandomId } from '@/lib/supabase'

// ============================================================================
// TYPES
// ============================================================================

interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    from: {
      id: number
      is_bot: boolean
      first_name: string
      username?: string
      language_code?: string
    }
    chat: {
      id: number
      type: string
      title?: string
      username?: string
    }
    date: number
    text: string
  }
}

interface BetCommandData {
  title: string
  options: string[]
  duration: string
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const BOT_TOKEN = process.env.BOT_TOKEN
const BETLEY_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://betley.xyz'

if (!BOT_TOKEN) {
  console.error('BOT_TOKEN environment variable is required')
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function parseCommand(text: string): BetCommandData | null {
  // Parse: /create "title" "option1,option2" "duration"
  const regex = /^\/create\s+"([^"]+)"\s+"([^"]+)"\s+"([^"]+)"$/i
  const match = text.trim().match(regex)
  
  if (!match) return null
  
  const [, title, optionsStr, duration] = match
  const options = optionsStr.split(',').map(opt => opt.trim()).filter(Boolean)
  
  return { title, options, duration }
}

function validateCommand(data: BetCommandData): ValidationResult {
  const errors: string[] = []
  
  // Validate title
  if (data.title.length < 5 || data.title.length > 200) {
    errors.push('Title must be 5-200 characters')
  }
  
  if (!/^[a-zA-Z0-9\s\?\!\.\,\-\(\)\>\<\$]+$/.test(data.title)) {
    errors.push('Title contains invalid characters')
  }
  
  // Validate options
  if (data.options.length < 2 || data.options.length > 4) {
    errors.push('Must have 2-4 options')
  }
  
  for (const option of data.options) {
    if (option.length === 0 || option.length > 100) {
      errors.push('Each option must be 1-100 characters')
    }
    
    if (!/^[a-zA-Z0-9\s\-\(\)\>\<\$]+$/.test(option)) {
      errors.push(`Option "${option}" contains invalid characters`)
    }
  }
  
  // Check for duplicate options
  const uniqueOptions = new Set(data.options.map(opt => opt.toLowerCase()))
  if (uniqueOptions.size !== data.options.length) {
    errors.push('Options must be unique')
  }
  
  // Validate duration
  const durationRegex = /^(\d+)(m|h|d|w)$/i
  const durationMatch = data.duration.match(durationRegex)
  
  if (!durationMatch) {
    errors.push('Invalid duration format. Use: 30m, 24h, 7d, 2w')
  } else {
    const [, value, unit] = durationMatch
    const numValue = parseInt(value, 10)
    
    if (unit.toLowerCase() === 'm' && numValue < 30) {
      errors.push('Minimum duration is 30 minutes')
    }
    
    if (numValue <= 0) {
      errors.push('Duration must be positive')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

function sanitizeInput(input: string): string {
  return input
    .replace(/[\"'&{}[\]\\]/g, '') // Remove dangerous chars (keep <>$ for price comparisons)
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

function generateBetSetupUrl(data: BetCommandData, userId: string, chatId: string, tempBetId: string): string {
  const params = new URLSearchParams({
    title: sanitizeInput(data.title),
    options: data.options.map(opt => sanitizeInput(opt)).join(','),
    duration: data.duration,
    source: 'telegram',
    tg_user: userId,
    tg_group: chatId,
    temp_bet_id: tempBetId
  })
  
  return `${BETLEY_BASE_URL}/setup?${params.toString()}`
}

function formatDuration(duration: string): string {
  const match = duration.match(/^(\d+)(m|h|d|w)$/i)
  if (!match) return duration
  
  const [, value, unit] = match
  const numValue = parseInt(value, 10)
  
  switch (unit.toLowerCase()) {
    case 'm': return `${numValue} minute${numValue !== 1 ? 's' : ''}`
    case 'h': return `${numValue} hour${numValue !== 1 ? 's' : ''}`
    case 'd': return `${numValue} day${numValue !== 1 ? 's' : ''}`
    case 'w': return `${numValue} week${numValue !== 1 ? 's' : ''}`
    default: return duration
  }
}

interface TelegramMessageOptions {
  parse_mode?: string
  disable_web_page_preview?: boolean
  reply_markup?: object
}

interface TelegramMessageResult {
  success: boolean
  messageId?: number
  error?: string
}

async function sendTelegramMessage(chatId: number, text: string, options: TelegramMessageOptions = {}): Promise<TelegramMessageResult> {
  if (!BOT_TOKEN) return { success: false, error: 'Bot token not configured' }
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...options
      })
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      console.error('Telegram API error:', result)
      return { success: false, error: result.description || 'Unknown API error' }
    }
    
    return { 
      success: true, 
      messageId: result.result?.message_id 
    }
  } catch (error) {
    console.error('Failed to send Telegram message:', error)
    return { success: false, error: 'Network error' }
  }
}

// ============================================================================
// COMMAND HANDLERS
// ============================================================================

async function handleCreateCommand(update: TelegramUpdate): Promise<void> {
  const message = update.message!
  const userId = message.from.id.toString()
  const chatId = message.chat.id
  const messageText = message.text
  
  console.log('Processing /create command:', {
    userId,
    chatId,
    messageText: messageText.substring(0, 100) + '...'
  })
  
  // Parse command
  const parsedCommand = parseCommand(messageText)
  if (!parsedCommand) {
    await sendTelegramMessage(chatId, `
❌ <b>Invalid format!</b>

Use: <code>/create "Bet title" "Option1, Option2" "24h"</code>

<b>Examples:</b>
• <code>/create "Will it rain tomorrow?" "Yes, No" "24h"</code>
• <code>/create "Next US President" "Trump, Biden, Other" "30d"</code>
• <code>/create "Team wins tonight?" "Yes, No" "3h"</code>
    `.trim())
    return
  }
  
  // Validate command
  const validation = validateCommand(parsedCommand)
  if (!validation.isValid) {
    const errorMessage = `❌ <b>Invalid parameters:</b>\n\n${validation.errors.map(err => `• ${err}`).join('\n')}`
    await sendTelegramMessage(chatId, errorMessage)
    return
  }
  
  // Generate temporary bet ID for tracking
  const tempBetId = generateRandomId()
  
  // Generate setup URL
  const setupUrl = generateBetSetupUrl(parsedCommand, userId, chatId.toString(), tempBetId)
  
  // Send success response
  const responseMessage = `
📋 <b>${parsedCommand.title}</b>
⚖️ <b>Options:</b> ${parsedCommand.options.join(', ')}
⏰ <b>Duration:</b> ${formatDuration(parsedCommand.duration)}
🔗 <b><a href="${setupUrl}">Click here to Create Bet</a></b> 
    `.trim()
  
  const messageResult = await sendTelegramMessage(chatId, responseMessage)
  
  if (messageResult.success && messageResult.messageId) {
    // Store the temporary bet mapping with message ID for auto-deletion
    const serverSupabase = createServerSupabaseClient()
    
    try {
      await serverSupabase
        .from('bet_mappings')
        .insert({
          random_id: tempBetId,
          numeric_id: -1, // Temporary placeholder - will be updated when bet is actually created
          creator_address: '0x0000000000000000000000000000000000000000', // Placeholder
          bet_name: parsedCommand.title,
          source: 'telegram',
          source_metadata: {
            telegram_group_id: chatId.toString(),
            telegram_user_id: userId
          },
          telegram_setup_message_id: messageResult.messageId.toString(),
          is_public: true // Default for Telegram bets
        })
      
      console.log('Successfully stored temp bet mapping:', {
        tempBetId,
        messageId: messageResult.messageId,
        userId,
        chatId
      })
    } catch (error) {
      console.error('Failed to store temp bet mapping:', error)
      // Continue anyway - the auto-delete feature will just not work for this bet
    }
  }
  
  console.log('Successfully processed /create command:', {
    userId,
    chatId,
    title: parsedCommand.title,
    optionsCount: parsedCommand.options.length,
    duration: parsedCommand.duration,
    tempBetId,
    messageId: messageResult.messageId
  })
}

async function handleHelpCommand(update: TelegramUpdate): Promise<void> {
  const chatId = update.message!.chat.id
  
  const helpMessage = `
🤖 <b>Betley Bot Help</b>

<b>Create bets directly from Telegram!</b>

<b>Commands:</b>
• <code>/create "title" "options" "duration"</code> - Create a new bet
• <code>/help</code> - Show this help message

<b>Format:</b>
<code>/create "Bet title" "Option1, Option2" "duration"</code>

<b>Duration formats:</b>
• Minutes: <code>30m</code>, <code>45m</code>
• Hours: <code>1h</code>, <code>24h</code>
• Days: <code>1d</code>, <code>7d</code>
• Weeks: <code>1w</code>, <code>2w</code>

<b>Examples:</b>
• <code>/create "Will Bitcoin hit $200k this year?" "Yes, No" "30d"</code>
• <code>/create "Who will win the game?" "Team A, Team B, Draw" "2h"</code>

Made with ❤️ by <a href="https://betley.xyz">Betley</a>
  `.trim()
  
  await sendTelegramMessage(chatId, helpMessage)
}

// ============================================================================
// MAIN WEBHOOK HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Log for debugging
    const userAgent = request.headers.get('user-agent') || ''
    console.log('Webhook request received:', {
      userAgent,
      contentType: request.headers.get('content-type'),
      hasBody: !!request.body
    })
    
    // Parse update
    const update: TelegramUpdate = await request.json()
    
    // Skip if no message or message is too old (>5 minutes)
    const message = update.message
    if (!message || !message.text) {
      return NextResponse.json({ ok: true })
    }
    
    const messageAge = Date.now() / 1000 - message.date
    if (messageAge > 300) { // 5 minutes
      console.log('Ignoring old message:', messageAge, 'seconds old')
      return NextResponse.json({ ok: true })
    }
    
    // Skip bot messages
    if (message.from.is_bot) {
      return NextResponse.json({ ok: true })
    }
    
    // Handle commands
    const text = message.text.trim()
    
    if (text.startsWith('/create')) {
      await handleCreateCommand(update)
    } else if (text === '/help' || text === '/help@BetleyBot') {
      await handleHelpCommand(update)
    } else if (text === '/start') {
      await handleHelpCommand(update) // Same as help for now
    }
    
    return NextResponse.json({ ok: true })
    
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    bot_configured: !!BOT_TOKEN 
  })
}
// ============================================================================
// File: frontend/app/api/telegram/webhook/route.ts
// Telegram Bot Webhook Handler
// Purpose: Handle incoming Telegram updates and process /betley commands
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'

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
const BETLEY_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://betley.app'

if (!BOT_TOKEN) {
  console.error('BOT_TOKEN environment variable is required')
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function parseCommand(text: string): BetCommandData | null {
  // Parse: /betley "title" "option1,option2" "duration"
  const regex = /^\/betley\s+"([^"]+)"\s+"([^"]+)"\s+"([^"]+)"$/i
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
  
  if (!/^[a-zA-Z0-9\s\?\!\.\,\-\(\)]+$/.test(data.title)) {
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
    
    if (!/^[a-zA-Z0-9\s\-\(\)]+$/.test(option)) {
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
    .replace(/[<>\"'&{}[\]\\]/g, '') // Remove dangerous chars
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

function generateBetSetupUrl(data: BetCommandData, userId: string, chatId: string): string {
  const params = new URLSearchParams({
    title: sanitizeInput(data.title),
    options: data.options.map(opt => sanitizeInput(opt)).join(','),
    duration: data.duration,
    visibility: 'public',
    source: 'telegram',
    tg_user: userId,
    tg_group: chatId
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

async function sendTelegramMessage(chatId: number, text: string, options: TelegramMessageOptions = {}): Promise<boolean> {
  if (!BOT_TOKEN) return false
  
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
        disable_web_page_preview: false,
        ...options
      })
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      console.error('Telegram API error:', result)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Failed to send Telegram message:', error)
    return false
  }
}

// ============================================================================
// COMMAND HANDLERS
// ============================================================================

async function handleBetleyCommand(update: TelegramUpdate): Promise<void> {
  const message = update.message!
  const userId = message.from.id.toString()
  const chatId = message.chat.id
  const messageText = message.text
  
  console.log('Processing /betley command:', {
    userId,
    chatId,
    messageText: messageText.substring(0, 100) + '...'
  })
  
  // Parse command
  const parsedCommand = parseCommand(messageText)
  if (!parsedCommand) {
    await sendTelegramMessage(chatId, `
❌ <b>Invalid format!</b>

Use: <code>/betley "Bet title" "Option1, Option2" "24h"</code>

<b>Examples:</b>
• <code>/betley "Will it rain tomorrow?" "Yes, No" "24h"</code>
• <code>/betley "Next US President" "Trump, Biden, Other" "30d"</code>
• <code>/betley "Team wins tonight?" "Yes, No" "3h"</code>
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
  
  // Generate setup URL
  const setupUrl = generateBetSetupUrl(parsedCommand, userId, chatId.toString())
  
  // Send success response
  const responseMessage = `
🎲 <b>Bet setup ready!</b>

📋 <b>${parsedCommand.title}</b>
⚖️ <b>Options:</b> ${parsedCommand.options.join(', ')}
⏰ <b>Duration:</b> ${formatDuration(parsedCommand.duration)}

<a href="${setupUrl}">🔗 Click here to create your bet!</a>

👆 Connect your wallet and finalize the bet on Betley.
  `.trim()
  
  await sendTelegramMessage(chatId, responseMessage)
  
  console.log('Successfully processed /betley command:', {
    userId,
    chatId,
    title: parsedCommand.title,
    optionsCount: parsedCommand.options.length,
    duration: parsedCommand.duration
  })
}

async function handleHelpCommand(update: TelegramUpdate): Promise<void> {
  const chatId = update.message!.chat.id
  
  const helpMessage = `
🤖 <b>Betley Bot Help</b>

<b>Create bets directly from Telegram!</b>

<b>Commands:</b>
• <code>/betley "title" "options" "duration"</code> - Create a new bet
• <code>/help</code> - Show this help message

<b>Format:</b>
<code>/betley "Bet title" "Option1, Option2" "duration"</code>

<b>Duration formats:</b>
• Minutes: <code>30m</code>, <code>45m</code>
• Hours: <code>1h</code>, <code>24h</code>
• Days: <code>1d</code>, <code>7d</code>
• Weeks: <code>1w</code>, <code>2w</code>

<b>Examples:</b>
• <code>/betley "Will Bitcoin hit $100k this year?" "Yes, No" "30d"</code>
• <code>/betley "Who will win the game?" "Team A, Team B, Draw" "2h"</code>
• <code>/betley "Will it be sunny tomorrow?" "Yes, No" "24h"</code>

Made with ❤️ by <a href="https://betley.app">Betley</a>
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
    
    if (text.startsWith('/betley')) {
      await handleBetleyCommand(update)
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
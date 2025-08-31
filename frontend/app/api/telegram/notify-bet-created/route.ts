// ============================================================================
// File: frontend/app/api/telegram/notify-bet-created/route.ts
// Telegram Bet Creation Notification Endpoint
// Purpose: Send success notification to Telegram groups after bet creation
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'

// ============================================================================
// TYPES
// ============================================================================

interface NotificationRequest {
  bet_url: string
  bet_title: string
  telegram_group_id: string
  telegram_user_id?: string
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const BOT_TOKEN = process.env.BOT_TOKEN
const TELEGRAM_BOT_API_KEY = process.env.TELEGRAM_BOT_API_KEY || 'dev-key'

if (!BOT_TOKEN) {
  console.warn('BOT_TOKEN environment variable is not set - notifications will fail')
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function sendTelegramMessage(chatId: number, text: string): Promise<boolean> {
  if (!BOT_TOKEN) {
    console.error('Cannot send Telegram message - BOT_TOKEN not configured')
    return false
  }
  
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
        disable_notification: false
      })
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      console.error('Telegram API error:', result)
      return false
    }
    
    console.log('Successfully sent Telegram notification to chat:', chatId)
    return true
    
  } catch (error) {
    console.error('Failed to send Telegram message:', error)
    return false
  }
}

// ============================================================================
// MAIN NOTIFICATION HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    console.log('Received bet creation notification request')
    
    // ✅ SECURITY: Verify API key
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${TELEGRAM_BOT_API_KEY}`) {
      console.warn('Unauthorized notification request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // ✅ VALIDATION: Parse and validate request body
    let body: NotificationRequest
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }
    
    const { bet_url, bet_title, telegram_group_id } = body
    
    // ✅ VALIDATION: Check required fields
    if (!bet_url || !bet_title || !telegram_group_id) {
      console.error('Missing required fields:', { bet_url: !!bet_url, bet_title: !!bet_title, telegram_group_id: !!telegram_group_id })
      return NextResponse.json({ error: 'Missing required fields: bet_url, bet_title, telegram_group_id' }, { status: 400 })
    }
    
    // ✅ VALIDATION: Validate URL format
    try {
      new URL(bet_url)
    } catch {
      return NextResponse.json({ error: 'Invalid bet_url format' }, { status: 400 })
    }
    
    // ✅ VALIDATION: Validate Telegram group ID format
    const groupId = parseInt(telegram_group_id)
    if (isNaN(groupId)) {
      return NextResponse.json({ error: 'Invalid telegram_group_id format' }, { status: 400 })
    }
    
    console.log('Sending notification for bet:', { bet_title, telegram_group_id })
    
    // ✅ NOTIFICATION: Create success message
    const message = `
✅ Betting is now open - good luck! 🚀

🎲 <b>${bet_title}</b>
🔗 <a href="${bet_url}">Place your Bets!</a>
    `.trim()
    
    // ✅ SEND: Send notification to Telegram group
    const success = await sendTelegramMessage(groupId, message)
    
    if (success) {
      console.log('Successfully sent bet notification')
      return NextResponse.json({ 
        success: true,
        message: 'Notification sent successfully'
      })
    } else {
      console.error('Failed to send Telegram notification')
      return NextResponse.json({ 
        error: 'Failed to send notification to Telegram' 
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Telegram notification error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    service: 'telegram-notification',
    bot_configured: !!BOT_TOKEN,
    timestamp: new Date().toISOString()
  })
}
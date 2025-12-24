import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.dramz.fun'
const WEB_APP_URL = process.env.NEXT_PUBLIC_WEB_APP_URL || 'https://dramz.tv'


async function sendMessage(chatId: number, text: string, replyMarkup?: any) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN is not set')
    return
  }

  const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Telegram API error:', error)
    return null
  }

  return response.json()
}

async function answerCallbackQuery(callbackQueryId: string, text?: string, showAlert?: boolean) {
  if (!TELEGRAM_BOT_TOKEN) return
  await fetch(`${TELEGRAM_API_URL}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text,
      show_alert: !!showAlert
    })
  })
}

function buildInitData(user: any): string {
  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN is not configured')
  }

  const authDate = Math.floor(Date.now() / 1000)
  const userData: Record<string, any> = {
    id: user.id,
    first_name: user.first_name || ''
  }

  if (user.last_name) userData.last_name = user.last_name
  if (user.username) userData.username = user.username
  if (user.photo_url) userData.photo_url = user.photo_url
  if (user.language_code) userData.language_code = user.language_code

  const userJson = JSON.stringify(userData)
  
  const params = new Map<string, string>()
  params.set('auth_date', authDate.toString())
  params.set('user', userJson)

  const sortedParams = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b))
  const data = sortedParams
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')
  
  const secret = crypto.createHash('sha256').update(TELEGRAM_BOT_TOKEN).digest()
  const hash = crypto.createHmac('sha256', secret).update(data).digest('hex')
  
  const parts: string[] = []
  parts.push(`auth_date=${authDate}`)
  parts.push(`user=${encodeURIComponent(userJson)}`)
  parts.push(`hash=${hash}`)
  
  return parts.join('&')
}

async function registerUser(user: any): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/user/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        telegramId: user.id,
        username: user.username || null,
        displayName: [user.first_name, user.last_name].filter(Boolean).join(' ') || null
      })
    })

    return response.ok
  } catch (error) {
    console.error('User registration error:', error)
    return false
  }
}

async function generateToken(user: any, sessionId?: string): Promise<string | null> {
  try {
    console.log('[WEBHOOK] generateToken - Starting, user:', user?.id, 'sessionId:', sessionId)
    
    if (!TELEGRAM_BOT_TOKEN) {
      console.error('[WEBHOOK] ERROR: TELEGRAM_BOT_TOKEN is not set in generateToken!')
      return null
    }
    
    const registerResult = await registerUser(user)
    console.log('[WEBHOOK] User registration result:', registerResult)
    
    const initData = buildInitData(user)
    console.log('[WEBHOOK] InitData generated, length:', initData.length)
    
    const requestBody: any = { initData }
    if (sessionId) {
      requestBody.sessionId = sessionId
      console.log('[WEBHOOK] Including sessionId in request')
    }
    
    const url = `${API_BASE_URL}/user/token`
    console.log('[WEBHOOK] Calling API:', url)
    console.log('[WEBHOOK] Request body keys:', Object.keys(requestBody))
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    console.log('[WEBHOOK] API Response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[WEBHOOK] Failed to generate token - Status:', response.status)
      console.error('[WEBHOOK] Error response:', errorText)
      return null
    }

    const data = await response.json()
    console.log('[WEBHOOK] API Response data keys:', Object.keys(data))
    console.log('[WEBHOOK] sentViaSSE:', data.sentViaSSE)
    
    if (sessionId && data.sentViaSSE) {
      console.log('[WEBHOOK] Token sent via SSE')
      return 'SSE_SENT'
    }
    
    const token = data.accessToken || data.token || null
    if (token) {
      console.log('[WEBHOOK] Token received, length:', token.length)
    } else {
      console.error('[WEBHOOK] No token in response!')
    }
    return token
  } catch (error) {
    console.error('[WEBHOOK] Token generation error:', error)
    if (error instanceof Error) {
      console.error('[WEBHOOK] Error message:', error.message)
      console.error('[WEBHOOK] Error stack:', error.stack)
    }
    return null
  }
}

function appendTokenParam(url: string, token: string): string {
  try {
    const u = new URL(url)
    u.searchParams.set('token', token)
    return u.toString()
  } catch {
    try {
      const base = new URL(WEB_APP_URL)
      base.searchParams.set('token', token)
      return base.toString()
    } catch {
      return `${WEB_APP_URL}?token=${encodeURIComponent(token)}`
    }
  }
}

const sessionStore = new Map<number, string>()

async function handleStartCommand(chatId: number, user: any, sessionId?: string) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('[WEBHOOK] ERROR: TELEGRAM_BOT_TOKEN is not set in handleStartCommand!')
    await sendMessage(chatId, '❌ Бот не настроен. Обратитесь к администратору.')
    return
  }

  try {
    if (sessionId) {
      sessionStore.set(chatId, sessionId)
      console.log('[WEBHOOK] Stored sessionId for chatId:', chatId, 'sessionId:', sessionId)
    } else {
      console.log('[WEBHOOK] No sessionId provided for chatId:', chatId, '- user may have typed /start directly')
    }

    const welcomeText = sessionId 
      ? `🎬 Добро пожаловать в <b>DRAMZ</b>!

Чтобы продолжить, войдите в аккаунт.`
      : `🎬 Добро пожаловать в <b>DRAMZ</b>!

Чтобы продолжить, войдите в аккаунт.

💡 <i>Совет: Для автоматической авторизации используйте ссылку с сайта.</i>`

    const replyMarkup = {
      inline_keyboard: [
        [
          { text: '🔐 Войти', callback_data: 'login' },
          { text: '✖️ Отмена', callback_data: 'cancel' }
        ]
      ]
    }

    await sendMessage(chatId, welcomeText, replyMarkup)
  } catch (error) {
    console.error('[WEBHOOK] Error handling /start:', error)
    await sendMessage(chatId, '❌ Произошла ошибка. Попробуйте позже.')
  }
}

async function handleLoginAction(chatId: number, user: any) {
  try {
    const sessionId = sessionStore.get(chatId)
    console.log('[WEBHOOK] handleLoginAction - chatId:', chatId, 'sessionId:', sessionId, 'user:', user?.id)
    
    if (!TELEGRAM_BOT_TOKEN) {
      console.error('[WEBHOOK] ERROR: TELEGRAM_BOT_TOKEN is not set!')
      await sendMessage(chatId, '❌ Ошибка конфигурации бота. Обратитесь к администратору.')
      return
    }
    
    const token = await generateToken(user, sessionId)
    console.log('[WEBHOOK] Token generation result:', token ? (token === 'SSE_SENT' ? 'SSE_SENT' : 'TOKEN_RECEIVED') : 'FAILED')
    
    if (sessionId && token === 'SSE_SENT') {
      await sendMessage(chatId, '✅ Авторизация успешна! Вернитесь на сайт — вы будете автоматически авторизованы.')
      sessionStore.delete(chatId)
      return
    }
    
    if (!token) {
      console.error('[WEBHOOK] ERROR: Token generation failed!')
      console.error('[WEBHOOK] User:', JSON.stringify(user, null, 2))
      console.error('[WEBHOOK] SessionId:', sessionId)
      console.error('[WEBHOOK] API_BASE_URL:', API_BASE_URL)
      await sendMessage(chatId, '❌ Ошибка авторизации. Попробуйте позже.')
      return
    }
    
    const webUrl = appendTokenParam(WEB_APP_URL, token)
    const webAppUrl = webUrl

    const text = `Готово! Выберите, где продолжить:`

    const replyMarkup = {
      inline_keyboard: [
        [
          { text: '🌐 Продолжить в веб', url: webUrl }
        ],
        [
          { text: '📱 Продолжить в Telegram', web_app: { url: webAppUrl } }
        ],
      ],
    }

    await sendMessage(chatId, text, replyMarkup)
    sessionStore.delete(chatId)
  } catch (error) {
    console.error('[WEBHOOK] Error handling login action:', error)
    await sendMessage(chatId, '❌ Произошла ошибка. Попробуйте позже.')
    sessionStore.delete(chatId)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (body.message) {
      const { message } = body
      const chatId = message.chat.id
      const text = message.text
      const user = message.from

      if (text && text.startsWith('/start')) {
        const parts = text.split(' ')
        const sessionId = parts.length > 1 ? parts[1] : undefined
        await handleStartCommand(chatId, user, sessionId)
      }
    }

    if (body.callback_query) {
      const { callback_query } = body
      const data = callback_query.data as string | undefined
      const user = callback_query.from
      const chatId = callback_query.message?.chat?.id
      const cqId = callback_query.id
      if (cqId) await answerCallbackQuery(cqId)
      if (chatId && data === 'login') {
        await handleLoginAction(chatId, user)
      } else if (chatId && data === 'cancel') {
        await sendMessage(chatId, 'Отменено. Можете вернуться командой /start')
      }
    }

    if (body.my_chat_member) {
      const { my_chat_member } = body
      const chatId = my_chat_member.chat.id
      const user = my_chat_member.from
      const oldStatus = my_chat_member.old_chat_member?.status
      const newStatus = my_chat_member.new_chat_member.status

      if ((oldStatus === 'left' || oldStatus === 'kicked' || !oldStatus) && 
          (newStatus === 'member' || newStatus === 'administrator')) {
        await handleStartCommand(chatId, user)
      }
    }

    if (body.chat_member) {
      const { chat_member } = body
      const chatId = chat_member.chat.id
      const user = chat_member.from
      const oldStatus = chat_member.old_chat_member?.status
      const newStatus = chat_member.new_chat_member.status

      if ((oldStatus === 'left' || oldStatus === 'kicked' || !oldStatus) && 
          (newStatus === 'member' || newStatus === 'administrator')) {
        await handleStartCommand(chatId, user)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ message: 'Telegram webhook endpoint. Use POST method.' })
}


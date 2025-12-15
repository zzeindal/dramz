import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class TelegramAuthService {
  private readonly botToken: string;

  constructor() {
    // Получаем токен бота из переменных окружения
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    if (!this.botToken) {
      console.warn('TELEGRAM_BOT_TOKEN is not set. Telegram authentication will not work.');
    }
  }

  /**
   * Проверяет подпись Telegram Web App initData или данных от бота
   * Поддерживает два формата:
   * 1. Web App initData (формат: query_id=...&user=...&hash=...)
   * 2. Данные от бота через веб-ссылку (формат: user=...&hash=...)
   * 
   * @param initData - строка initData от Telegram Web App или бота
   * @returns объект с данными пользователя или null, если подпись невалидна
   */
  validateInitData(initData: string): {
    telegramId: number;
    username?: string;
    firstName?: string;
    lastName?: string;
    languageCode?: string;
  } | null {
    if (!this.botToken) {
      throw new BadRequestException('Telegram bot token is not configured');
    }

    try {
      const pairs: Array<[string, string]> = []
      let hash = ''
      
      for (const pair of initData.split('&')) {
        const [key, ...valueParts] = pair.split('=')
        const value = valueParts.join('=')
        
        if (key === 'hash') {
          hash = value
        } else {
          pairs.push([key, value])
        }
      }
      
      if (!hash) {
        throw new UnauthorizedException('Invalid initData: hash is missing')
      }

      pairs.sort(([a], [b]) => a.localeCompare(b))

      const dataCheckString = pairs
        .map(([key, value]) => `${key}=${value}`)
        .join('\n')
      
      const dataCheckStringDecoded = pairs
        .map(([key, value]) => `${key}=${decodeURIComponent(value)}`)
        .join('\n')

      const hasQueryId = pairs.some(([key]) => key === 'query_id')
      
      let calculatedHash: string;
      
      if (hasQueryId) {
        const secretKey = crypto
          .createHmac('sha256', 'WebAppData')
          .update(this.botToken)
          .digest()

        calculatedHash = crypto
          .createHmac('sha256', secretKey)
          .update(dataCheckString)
          .digest('hex')
      } else {
        const variants: Array<{ name: string; hash: string }> = []
        
        // Вариант 1: WebAppData секрет + encoded значения
        let secretKey = crypto
          .createHmac('sha256', 'WebAppData')
          .update(this.botToken)
          .digest()
        variants.push({
          name: 'WebAppData + encoded',
          hash: crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex')
        })
        
        // Вариант 2: WebAppData секрет + decoded значения
        variants.push({
          name: 'WebAppData + decoded',
          hash: crypto.createHmac('sha256', secretKey).update(dataCheckStringDecoded).digest('hex')
        })
        
        // Вариант 3: Токен бота напрямую + encoded
        variants.push({
          name: 'botToken direct + encoded',
          hash: crypto.createHmac('sha256', this.botToken).update(dataCheckString).digest('hex')
        })
        
        // Вариант 4: Токен бота напрямую + decoded
        variants.push({
          name: 'botToken direct + decoded',
          hash: crypto.createHmac('sha256', this.botToken).update(dataCheckStringDecoded).digest('hex')
        })
        
        // Вариант 5: SHA256 от токена как секрет + encoded
        const sha256Token = crypto.createHash('sha256').update(this.botToken).digest()
        variants.push({
          name: 'SHA256 token + encoded',
          hash: crypto.createHmac('sha256', sha256Token).update(dataCheckString).digest('hex')
        })
        
        // Вариант 6: SHA256 от токена как секрет + decoded
        variants.push({
          name: 'SHA256 token + decoded',
          hash: crypto.createHmac('sha256', sha256Token).update(dataCheckStringDecoded).digest('hex')
        })
        
        // Ищем совпадение
        const matchingVariant = variants.find(v => v.hash === hash)
        
        if (matchingVariant) {
          calculatedHash = matchingVariant.hash
          console.log('Hash validation succeeded with variant:', matchingVariant.name)
        } else {
          calculatedHash = variants[0].hash
          console.log('All hash variants failed:');
          variants.forEach(v => {
            console.log(`  ${v.name}:`, v.hash);
          })
        }
      }

      if (calculatedHash !== hash) {
        throw new UnauthorizedException('Invalid initData: signature verification failed')
      }

      const params = new URLSearchParams(initData)
      const authDate = params.get('auth_date')
      if (authDate) {
        const authTimestamp = parseInt(authDate, 10)
        const currentTimestamp = Math.floor(Date.now() / 1000)
        const timeDiff = currentTimestamp - authTimestamp
        
        // Для Web App и обычного бота данные должны быть свежими (24 часа)
        const maxAge = 86400
        if (timeDiff > maxAge) {
          throw new UnauthorizedException('Invalid initData: data is too old')
        }
      }

      const userStr = params.get('user')
      if (!userStr) {
        throw new UnauthorizedException('Invalid initData: user data is missing')
      }

      const user = JSON.parse(decodeURIComponent(userStr))
      
      if (!user.id) {
        throw new UnauthorizedException('Invalid initData: user ID is missing')
      }

      return {
        telegramId: user.id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        languageCode: user.language_code,
      }
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error
      }
      throw new UnauthorizedException('Invalid initData: parsing failed')
    }
  }
}


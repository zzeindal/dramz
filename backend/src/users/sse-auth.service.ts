import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import * as crypto from 'crypto';

interface SSEClient {
  sessionId: string;
  response: Response;
  createdAt: Date;
}

@Injectable()
export class SseAuthService {
  private clients: Map<string, SSEClient> = new Map();
  private readonly SESSION_TIMEOUT = 5 * 60 * 1000; // 5 минут
  private keepAliveInterval: NodeJS.Timeout | null = null;

  /**
   * Генерирует уникальный sessionId
   */
  generateSessionId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Регистрирует новое SSE соединение
   */
  registerClient(sessionId: string, response: Response): void {
    // Закрываем старое соединение, если оно существует
    this.closeClient(sessionId);

    // Настраиваем SSE заголовки
    response.status(200);
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('X-Accel-Buffering', 'no'); // Отключаем буферизацию в Nginx
    response.setHeader('Access-Control-Allow-Origin', '*'); // CORS для SSE
    response.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

    // Сохраняем клиента ПЕРЕД отправкой сообщений
    this.clients.set(sessionId, {
      sessionId,
      response,
      createdAt: new Date(),
    });

    // Отправляем начальное сообщение
    try {
      const initialMessage = `event: connected\ndata: ${JSON.stringify({ message: 'SSE connection established', sessionId })}\n\n`;
      if (!response.writableEnded && !response.destroyed) {
        response.write(initialMessage);
        // Принудительно сбрасываем буфер, если доступно
        if (typeof (response as any).flush === 'function') {
          (response as any).flush();
        }
        console.log(`SSE connection established for session ${sessionId}`);
      } else {
        console.warn(`Cannot write to response for session ${sessionId}: response ended or destroyed`);
        this.closeClient(sessionId);
        return;
      }
    } catch (error) {
      console.error(`Error writing initial SSE message for session ${sessionId}:`, error);
      this.closeClient(sessionId);
      return;
    }

    // Очищаем соединение при закрытии
    response.on('close', () => {
      this.closeClient(sessionId);
    });

    response.on('error', (error) => {
      console.error(`SSE connection error for session ${sessionId}:`, error);
      this.closeClient(sessionId);
    });

    // Очищаем устаревшие соединения
    this.cleanupExpiredSessions();

    // Запускаем keep-alive, если еще не запущен
    this.startKeepAlive();
  }

  /**
   * Запускает периодическую отправку keep-alive сообщений
   */
  private startKeepAlive(): void {
    if (this.keepAliveInterval) {
      return; // Уже запущен
    }

    this.keepAliveInterval = setInterval(() => {
      if (this.clients.size === 0) {
        // Нет активных соединений, останавливаем keep-alive
        if (this.keepAliveInterval) {
          clearInterval(this.keepAliveInterval);
          this.keepAliveInterval = null;
        }
        return;
      }

      // Отправляем комментарий (keep-alive) всем активным клиентам
      for (const [sessionId, client] of this.clients.entries()) {
        try {
          // SSE комментарии начинаются с ":"
          client.response.write(': keep-alive\n\n');
        } catch (error) {
          // Если ошибка, закрываем соединение
          this.closeClient(sessionId);
        }
      }
    }, 30000); // Каждые 30 секунд
  }

  /**
   * Отправляет событие конкретному клиенту
   */
  sendToClient(sessionId: string, event: string, data: any): boolean {
    const client = this.clients.get(sessionId);
    if (!client) {
      return false;
    }

    try {
      const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      client.response.write(message);
      return true;
    } catch (error) {
      console.error(`Error sending SSE message to session ${sessionId}:`, error);
      this.closeClient(sessionId);
      return false;
    }
  }

  /**
   * Отправляет токен авторизации клиенту
   */
  sendToken(sessionId: string, tokenData: { accessToken: string; user: any }): boolean {
    return this.sendToClient(sessionId, 'token', tokenData);
  }

  /**
   * Закрывает соединение с клиентом
   */
  closeClient(sessionId: string): void {
    const client = this.clients.get(sessionId);
    if (client) {
      try {
        client.response.end();
      } catch (error) {
        // Игнорируем ошибки при закрытии
      }
      this.clients.delete(sessionId);
    }
  }

  /**
   * Проверяет, существует ли клиент с данным sessionId
   */
  hasClient(sessionId: string): boolean {
    return this.clients.has(sessionId);
  }

  /**
   * Очищает устаревшие соединения
   */
  private cleanupExpiredSessions(): void {
    const now = new Date();
    for (const [sessionId, client] of this.clients.entries()) {
      const age = now.getTime() - client.createdAt.getTime();
      if (age > this.SESSION_TIMEOUT) {
        this.closeClient(sessionId);
      }
    }
  }

  /**
   * Получает количество активных соединений
   */
  getActiveConnectionsCount(): number {
    return this.clients.size;
  }
}


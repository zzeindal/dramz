import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class OptionalUserJwtAuthGuard extends AuthGuard('user-jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const result = super.canActivate(context);
    
    // Если результат - Observable, обрабатываем ошибки
    if (result instanceof Observable) {
      return result.pipe(
        catchError(() => of(true)), // Если ошибка, разрешаем доступ (пользователь будет undefined)
      );
    }
    
    // Если результат - Promise, обрабатываем ошибки
    if (result instanceof Promise) {
      return result.catch(() => true); // Если ошибка, разрешаем доступ
    }
    
    // Если результат - boolean, возвращаем как есть
    return result;
  }

  handleRequest(err: any, user: any, info: any) {
    // Если есть ошибка или пользователь не найден, возвращаем undefined
    if (err || !user) {
      return undefined;
    }
    return user;
  }
}


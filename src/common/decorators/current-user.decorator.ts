import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Usage : @CurrentUser() user dans un contrôleur protégé par
// JwtAuthGuard. Retourne le payload décodé par JwtStrategy.validate()
// ({ userId, phone }), jamais les infos sensibles du compte.
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
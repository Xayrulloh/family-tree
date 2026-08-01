import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { GoogleOauthGuard } from '~/common/guards/google-oauth.guard';
import { checkedEnv } from '~/config/env/env';
import type { AuthenticatedRequest } from '~/shared/types/request-with-user';
import { COOKIES_ACCESS_TOKEN_KEY } from '~/utils/constants';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // This method intentionally left empty since the guard handles redirection
  @Get('google')
  @UseGuards(GoogleOauthGuard)
  async auth() {}

  // This method works when google hits this endpoint
  @Get('google/callback')
  @UseGuards(GoogleOauthGuard)
  async googleAuthCallback(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    const user = req.user;

    if (!user) {
      throw new Error('No user found in request');
    }

    const token = await this.authService.signIn(user);

    res.cookie(COOKIES_ACCESS_TOKEN_KEY, token, {
      maxAge: 2592000000, // 30 days
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      domain: checkedEnv.COOKIE_DOMAIN,
    });

    const redirectUrl = req.cookies.auth_redirect_url || '/family-trees';

    res.clearCookie('auth_redirect_url', {
      domain: checkedEnv.COOKIE_DOMAIN,
    });

    res.redirect(`${checkedEnv.COOKIE_CLIENT_URL}${redirectUrl}`);
  }

  // Logout
  @Get('logout')
  async logout(@Req() _req: Request, @Res() res: Response): Promise<void> {
    res.clearCookie(COOKIES_ACCESS_TOKEN_KEY, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      domain: checkedEnv.COOKIE_DOMAIN,
    });

    res.status(200).send();
  }
}

import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleOauthGuard } from '../../common/guards/google-oauth.guard';
import { UserSchemaType } from '@family-tree/shared';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(GoogleOauthGuard)
  async auth() {
    // This method intentionally left empty since the guard handles redirection
  }

  @Get('google/callback')
  @UseGuards(GoogleOauthGuard)
  async googleAuthCallback(
    @Req() req: Request & { user: UserSchemaType },
    @Res() res: Response
  ): Promise<void> {
    const user = req.user;

    if (!user) {
      throw new Error('No user found in request');
    }

    const token = await this.authService.signIn(user);

    res.cookie('access_token', token, {
      maxAge: 2592000000, // 30 days
      httpOnly: true,
      sameSite: 'strict',
    });

    res.redirect('http://localhost:8080');
  }
}

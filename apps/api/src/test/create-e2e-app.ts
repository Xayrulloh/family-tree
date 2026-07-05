/// <reference types="jest" />
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import supertest from 'supertest';
import { AppModule } from '~/app.module';
import { CacheService } from '~/config/cache/cache.service';
import { GLOBAL_PREFIX } from '~/utils/constants';

// No-op cache: cache behavior is covered by unit tests; E2E focuses on HTTP + DB.
const noOpCacheService = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
  delByPattern: jest.fn().mockResolvedValue(undefined),
  getUser: jest.fn().mockResolvedValue(null),
  setUser: jest.fn().mockResolvedValue(undefined),
  cleanUser: jest.fn().mockResolvedValue(undefined),
  getUserFamilyTrees: jest.fn().mockResolvedValue(null),
  setUserFamilyTrees: jest.fn().mockResolvedValue(undefined),
  cleanUserFamilyTrees: jest.fn().mockResolvedValue(undefined),
  getFamilyTreeMembers: jest.fn().mockResolvedValue(null),
  setFamilyTreeMembers: jest.fn().mockResolvedValue(undefined),
  cleanFamilyTreeMembers: jest.fn().mockResolvedValue(undefined),
  getFamilyTreeMemberConnections: jest.fn().mockResolvedValue(null),
  setFamilyTreeMemberConnections: jest.fn().mockResolvedValue(undefined),
  cleanFamilyTreeMemberConnections: jest.fn().mockResolvedValue(undefined),
} satisfies Record<keyof CacheService, unknown>;

export async function createE2EApp(): Promise<{
  app: INestApplication;
  req: ReturnType<typeof supertest>;
  jwtService: JwtService;
}> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(CacheService)
    .useValue(noOpCacheService)
    .compile();

  const app = moduleRef.createNestApplication();

  app.setGlobalPrefix(GLOBAL_PREFIX);
  app.use(cookieParser());

  await app.init();

  const jwtService = app.get(JwtService);

  return { app, req: supertest(app.getHttpServer()), jwtService };
}

export async function signToken(
  jwtService: JwtService,
  user: { id: string; email: string },
): Promise<string> {
  return jwtService.signAsync({ sub: user.id, email: user.email });
}

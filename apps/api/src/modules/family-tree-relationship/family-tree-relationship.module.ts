import { Module } from '@nestjs/common';
import { FamilyTreeRelationshipService } from './family-tree-relationship.service';
import { FamilyTreeRelationshipController } from './family-tree-relationship.controller';
import { DrizzleModule } from '../../database/drizzle.module';
import { CloudflareConfig } from '../../config/cloudflare/cloudflare.config';

@Module({
  imports: [DrizzleModule],
  controllers: [FamilyTreeRelationshipController],
  providers: [FamilyTreeRelationshipService, CloudflareConfig],
})
export class FamilyTreeRelationshipModule {}

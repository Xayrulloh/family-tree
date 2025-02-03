import { Module } from '@nestjs/common';
import { FamilyTreeService } from './family-tree.service';
import { FamilyTreeController } from './family-tree.controller';
import { DrizzleModule } from '../../database/drizzle.module';
import { FamilyTreeRelationshipService } from '../family-tree-relationship/family-tree-relationship.service';

@Module({
  imports: [DrizzleModule],
  controllers: [FamilyTreeController],
  providers: [FamilyTreeService, FamilyTreeRelationshipService],
})
export class FamilyTreeModule {}

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as schema from '../../database/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from '../../database/drizzle.provider';
import { and, eq, ilike, isNull } from 'drizzle-orm';
import {
  FamilyTreeArrayResponseDto,
  FamilyTreeCreateRequestDto,
  FamilyTreeResponseDto,
  FamilyTreeUpdateRequestDto,
} from './dto/family-tree.dto';
import { CloudflareConfig } from '../../config/cloudflare/cloudflare.config';
import { CLOUDFLARE_TREE_FOLDER } from '../../utils/constants';

@Injectable()
export class FamilyTreeService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
    private cloudflareConfig: CloudflareConfig
  ) {}

  async getFamilyTreesOfUser(
    userId: string
  ): Promise<FamilyTreeArrayResponseDto> {
    return this.db.query.familyTreesSchema.findMany({
      where: eq(schema.familyTreesSchema.createdBy, userId),
    });
  }

  async getFamilyTreesByName(
    name: string
  ): Promise<FamilyTreeArrayResponseDto> {
    return this.db.query.familyTreesSchema.findMany({
      where: and(
        ilike(schema.familyTreesSchema.name, `%${name}%`),
        eq(schema.familyTreesSchema.visibility, true),
        isNull(schema.familyTreesSchema.deletedAt)
      ),
      limit: 5,
    });
  }

  async getFamilyTreeById(id: string): Promise<FamilyTreeResponseDto> {
    const familyTree = await this.db.query.familyTreesSchema.findFirst({
      where: and(
        eq(schema.familyTreesSchema.id, id),
        isNull(schema.familyTreesSchema.deletedAt)
      ),
    });

    if (!familyTree) {
      throw new NotFoundException(`Family tree with id ${id} not found`);
    }

    return familyTree;
  }

  async createFamilyTree(
    userId: string,
    body: FamilyTreeCreateRequestDto
  ): Promise<FamilyTreeResponseDto> {
    const isFamilyTreeExist = await this.db.query.familyTreesSchema.findFirst({
      where: and(
        eq(schema.familyTreesSchema.createdBy, userId),
        ilike(schema.familyTreesSchema.name, `%${body.name}%`)
      ),
    });

    if (isFamilyTreeExist) {
      throw new BadRequestException(
        `Family tree with name ${body.name} already exist`
      );
    }

    const [familyTree] = await this.db
      .insert(schema.familyTreesSchema)
      .values({
        createdBy: userId,
        name: body.name,
        image: body.image,
        visibility: body.visibility || false,
      })
      .returning();

    return familyTree;
  }

  async updateFamilyTree(
    userId: string,
    id: string,
    body: FamilyTreeUpdateRequestDto
  ): Promise<void> {
    const familyTree = await this.db.query.familyTreesSchema.findFirst({
      where: and(
        eq(schema.familyTreesSchema.id, id),
        eq(schema.familyTreesSchema.createdBy, userId),
        isNull(schema.familyTreesSchema.deletedAt)
      ),
    });

    if (!familyTree) {
      throw new NotFoundException(`Family tree with id ${id} not found`);
    }

    if (body.image && familyTree.image !== body.image) {
      this.cloudflareConfig.deleteFile(CLOUDFLARE_TREE_FOLDER, body.image);
    }

    await this.db
      .update(schema.familyTreesSchema)
      .set({
        name: body.name,
        image: body.image,
        visibility: body.visibility || false,
      })
      .where(eq(schema.familyTreesSchema.id, id));
  }

  async deleteFamilyTree(userId: string, id: string): Promise<void> {
    const familyTree = await this.db.query.familyTreesSchema.findFirst({
      where: and(
        eq(schema.familyTreesSchema.id, id),
        eq(schema.familyTreesSchema.createdBy, userId)
      ),
    });

    if (!familyTree) {
      throw new NotFoundException(`Family tree with id ${id} not found`);
    }

    if (familyTree.deletedAt) {
      await this.db
        .delete(schema.familyTreesSchema)
        .where(eq(schema.familyTreesSchema.id, id));
    } else {
      await this.db
        .update(schema.familyTreesSchema)
        .set({
          deletedAt: new Date(),
        })
        .where(eq(schema.familyTreesSchema.id, id));
    }
  }
}

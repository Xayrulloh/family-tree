import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, ilike, notLike, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CloudflareConfig } from '~/config/cloudflare/cloudflare.config';
import { DrizzleAsyncProvider } from '~/database/drizzle.provider';
import * as schema from '~/database/schema';
import { DICEBEAR_URL } from '~/utils/constants';
import type {
  FamilyTreeCreateRequestDto,
  FamilyTreePaginationAndSearchQueryDto,
  FamilyTreePaginationResponseDto,
  FamilyTreeResponseDto,
  FamilyTreeUpdateRequestDto,
} from '../dto/family-tree.dto';

@Injectable()
export class FamilyTreeService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
    private cloudflareConfig: CloudflareConfig,
  ) {}

  private async paginateFamilyTrees(
    whereConditions: Parameters<typeof and>[0][],
    {
      page,
      perPage,
      sortByVisits = false,
    }: { page: number; perPage: number; sortByVisits?: boolean },
  ): Promise<FamilyTreePaginationResponseDto> {
    const offset = (page - 1) * perPage;

    const [familyTrees, countResult] = await Promise.all([
      this.db.query.familyTreesSchema.findMany({
        where: and(...whereConditions),
        orderBy: sortByVisits
          ? [
              desc(schema.familyTreesSchema.visitCount),
              // Newest first among equal visit counts, so a freshly published
              // tree surfaces at the top of the (large) zero-visit block
              // instead of being buried where it can never earn visits.
              desc(schema.familyTreesSchema.createdAt),
              // Neither key above is unique, and `createdAt` ties whenever rows
              // are inserted in one transaction. Without a unique final key the
              // order isn't total, so LIMIT/OFFSET can repeat or drop a tree
              // across pages.
              desc(schema.familyTreesSchema.id),
            ]
          : asc(schema.familyTreesSchema.createdAt),
        limit: perPage,
        offset,
      }),

      this.db
        .select({
          totalCount: sql<number>`COUNT(*)::int`,
        })
        .from(schema.familyTreesSchema)
        .where(and(...whereConditions)),
    ]);

    const totalCount = countResult[0]?.totalCount ?? 0;
    const totalPages = Math.ceil(totalCount / perPage);

    return {
      familyTrees,
      page,
      perPage,
      totalCount,
      totalPages,
    };
  }

  async getFamilyTreesOfUser(
    userId: string,
    { page, perPage, name }: FamilyTreePaginationAndSearchQueryDto,
  ): Promise<FamilyTreePaginationResponseDto> {
    const whereConditions = [
      eq(schema.familyTreesSchema.createdBy, userId),
      name ? ilike(schema.familyTreesSchema.name, `%${name}%`) : undefined,
    ];

    return this.paginateFamilyTrees(whereConditions, { page, perPage });
  }

  async getPublicFamilyTrees({
    page,
    perPage,
    name,
  }: FamilyTreePaginationAndSearchQueryDto): Promise<FamilyTreePaginationResponseDto> {
    const whereConditions = [
      name ? ilike(schema.familyTreesSchema.name, `%${name}%`) : undefined,
      eq(schema.familyTreesSchema.isPublic, true),
    ];

    return this.paginateFamilyTrees(whereConditions, {
      page,
      perPage,
      sortByVisits: true,
    });
  }

  async incrementPublicFamilyTreeVisitCount(
    familyTreeId: string,
  ): Promise<void> {
    // Raw SQL on purpose: drizzle's `.update()` triggers the `$onUpdate` hook on
    // `updatedAt`, which would mark a tree as modified every time it is merely
    // viewed. The increment is read-modify-write free, so it is race-safe.
    await this.db.execute(
      sql`UPDATE ${schema.familyTreesSchema}
          SET visit_count = visit_count + 1
          WHERE ${schema.familyTreesSchema.id} = ${familyTreeId}`,
    );
  }

  async getFamilyTreeById(id: string): Promise<FamilyTreeResponseDto> {
    const familyTree = await this.db.query.familyTreesSchema.findFirst({
      where: eq(schema.familyTreesSchema.id, id),
    });

    if (!familyTree) {
      throw new NotFoundException(`Family tree with id ${id} not found`);
    }

    return familyTree;
  }

  async createFamilyTree(
    userId: string,
    body: FamilyTreeCreateRequestDto,
  ): Promise<FamilyTreeResponseDto> {
    const isFamilyTreeExist = await this.db.query.familyTreesSchema.findFirst({
      where: and(
        eq(schema.familyTreesSchema.createdBy, userId),
        eq(schema.familyTreesSchema.name, body.name),
      ),
    });

    if (isFamilyTreeExist) {
      throw new BadRequestException(
        `Family tree with name ${body.name} already exist`,
      );
    }

    const [familyTree] = await this.db
      .insert(schema.familyTreesSchema)
      .values({
        createdBy: userId,
        name: body.name,
        image: body.image,
        isPublic: body.isPublic,
      })
      .returning();

    return familyTree;
  }

  async updateFamilyTree(
    id: string,
    body: FamilyTreeUpdateRequestDto,
  ): Promise<void> {
    const familyTree = await this.db.query.familyTreesSchema.findFirst({
      where: eq(schema.familyTreesSchema.id, id),
    });

    if (!familyTree) {
      throw new NotFoundException(`Family tree with id ${id} not found`);
    }

    if (familyTree.image && familyTree.image !== body.image) {
      this.cloudflareConfig.deleteFile(familyTree.image);
    }

    await this.db
      .update(schema.familyTreesSchema)
      .set({
        name: body.name,
        image: body.image,
        isPublic: body.isPublic,
      })
      .where(eq(schema.familyTreesSchema.id, id));
  }

  async deleteFamilyTree(id: string): Promise<void> {
    const familyTree = await this.db.query.familyTreesSchema.findFirst({
      where: eq(schema.familyTreesSchema.id, id),
    });

    if (!familyTree) {
      throw new NotFoundException(`Family tree with id ${id} not found`);
    }

    if (familyTree.image) {
      this.cloudflareConfig.deleteFile(familyTree.image);
    }

    await this.db.query.familyTreeMembersSchema
      .findMany({
        where: and(
          eq(schema.familyTreeMembersSchema.familyTreeId, id),
          notLike(schema.familyTreeMembersSchema.image, `${DICEBEAR_URL}%`),
        ),
      })
      .then((members) => {
        members.forEach((member) => {
          if (member.image) {
            this.cloudflareConfig.deleteFile(member.image);
          }
        });
      });

    await this.db
      .delete(schema.familyTreesSchema)
      .where(eq(schema.familyTreesSchema.id, id));
  }
}

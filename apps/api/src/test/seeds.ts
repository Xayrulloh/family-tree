import { randomUUID } from 'node:crypto';
import { UserGenderEnum } from '@family-tree/shared';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '~/database/schema';

type UserInsert = typeof schema.usersSchema.$inferInsert;
type FamilyTreeInsert = typeof schema.familyTreesSchema.$inferInsert;
type MemberInsert = typeof schema.familyTreeMembersSchema.$inferInsert;

export async function seedUser(
  db: NodePgDatabase<typeof schema>,
  overrides: Partial<UserInsert> = {},
) {
  const uid = randomUUID();
  const [user] = await db
    .insert(schema.usersSchema)
    .values({
      email: `user-${uid}@test.com`,
      name: 'Test User',
      username: `testUser-${uid}`,
      gender: UserGenderEnum.MALE,
      image: null,
      ...overrides,
    })
    .returning();

  return user;
}

export async function seedFamilyTree(
  db: NodePgDatabase<typeof schema>,
  createdBy: string,
  overrides: Partial<Omit<FamilyTreeInsert, 'createdBy'>> = {},
) {
  const [tree] = await db
    .insert(schema.familyTreesSchema)
    .values({
      name: `Tree-${randomUUID().slice(0, 8)}`,
      createdBy,
      isPublic: false,
      ...overrides,
    })
    .returning();

  return tree;
}

export async function seedMember(
  db: NodePgDatabase<typeof schema>,
  familyTreeId: string,
  overrides: Partial<Omit<MemberInsert, 'familyTreeId'>> = {},
) {
  const [member] = await db
    .insert(schema.familyTreeMembersSchema)
    .values({
      name: 'Test Member',
      gender: UserGenderEnum.MALE,
      familyTreeId,
      image: null,
      ...overrides,
    })
    .returning();

  return member;
}

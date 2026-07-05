/// <reference types="jest" />
import { FamilyTreeMemberConnectionEnum } from '@family-tree/shared';
import * as schema from '~/database/schema';
import { seedFamilyTree, seedMember, seedUser } from '~/test/seeds';
import { getTestDb, truncateTables } from '~/test/test-db';
import { FamilyTreeMemberConnectionService } from './family-tree-member-connection.service';

async function seedConnection(
  familyTreeId: string,
  fromMemberId: string,
  toMemberId: string,
) {
  const [row] = await getTestDb()
    .insert(schema.familyTreeMemberConnectionsSchema)
    .values({
      familyTreeId,
      fromMemberId,
      toMemberId,
      type: FamilyTreeMemberConnectionEnum.PARENT,
    })
    .returning();
  return row;
}

describe('FamilyTreeMemberConnectionService (integration)', () => {
  let service: FamilyTreeMemberConnectionService;

  beforeAll(() => {
    service = new FamilyTreeMemberConnectionService(getTestDb());
  });

  beforeEach(async () => {
    await truncateTables();
  });

  describe('getAllFamilyTreeMemberConnections', () => {
    it('returns all connections that belong to the given tree', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id);
      const [m1, m2] = await Promise.all([
        seedMember(getTestDb(), tree.id),
        seedMember(getTestDb(), tree.id),
      ]);

      await seedConnection(tree.id, m1.id, m2.id);

      const result = await service.getAllFamilyTreeMemberConnections({
        familyTreeId: tree.id,
      });

      expect(result).toHaveLength(1);
      expect(result[0].fromMemberId).toBe(m1.id);
      expect(result[0].toMemberId).toBe(m2.id);
    });

    it('returns an empty array when the tree has no connections', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id);

      const result = await service.getAllFamilyTreeMemberConnections({
        familyTreeId: tree.id,
      });

      expect(result).toHaveLength(0);
    });

    it('does not return connections from a different tree', async () => {
      const user = await seedUser(getTestDb());
      const [treeA, treeB] = await Promise.all([
        seedFamilyTree(getTestDb(), user.id),
        seedFamilyTree(getTestDb(), user.id),
      ]);

      const [mA1, mA2] = await Promise.all([
        seedMember(getTestDb(), treeA.id),
        seedMember(getTestDb(), treeA.id),
      ]);

      await seedConnection(treeA.id, mA1.id, mA2.id);

      const result = await service.getAllFamilyTreeMemberConnections({
        familyTreeId: treeB.id,
      });

      expect(result).toHaveLength(0);
    });
  });

  describe('getFamilyTreeMemberConnections', () => {
    it('returns connections filtered by both tree and fromMember', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id);

      const [m1, m2, m3] = await Promise.all([
        seedMember(getTestDb(), tree.id),
        seedMember(getTestDb(), tree.id),
        seedMember(getTestDb(), tree.id),
      ]);

      await seedConnection(tree.id, m1.id, m2.id);
      await seedConnection(tree.id, m3.id, m2.id);

      const result = await service.getFamilyTreeMemberConnections({
        familyTreeId: tree.id,
        memberUserId: m1.id,
      });

      expect(result).toHaveLength(1);
      expect(result[0].fromMemberId).toBe(m1.id);
    });

    it('returns an empty array when the member has no connections', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id);
      const member = await seedMember(getTestDb(), tree.id);

      const result = await service.getFamilyTreeMemberConnections({
        familyTreeId: tree.id,
        memberUserId: member.id,
      });

      expect(result).toHaveLength(0);
    });
  });
});

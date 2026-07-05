import { SearchOutlined } from '@ant-design/icons';
import type { FamilyTreeSharedUserResponseType } from '@family-tree/shared';
import {
  Avatar,
  Button,
  Card,
  Flex,
  Input,
  Pagination,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useUnit } from 'effector-react';
import type React from 'react';
import { editSharedTreeModel } from '~/features/shared-tree-users/edit';
import type { LazyPageProps } from '~/shared/lib/lazy-page';
import { PageLoading } from '~/shared/ui/loading';
import type { factory } from '../model';

const { Title, Text } = Typography;

// Types
type Model = ReturnType<typeof factory>;
export type Props = LazyPageProps<Model>;

const SharedTreeUsers: React.FC<Props> = ({ model }) => {
  const [
    paginatedUsers,
    loading,
    mutating,
    page,
    searchQuery,
    pageChanged,
    searchChanged,
  ] = useUnit([
    model.$paginatedUsers,
    model.$loading,
    editSharedTreeModel.$mutating,
    model.$page,
    model.$searchQuery,
    model.pageChanged,
    model.searchChanged,
  ]);

  if (loading) {
    return <PageLoading />;
  }

  const columns: ColumnsType<FamilyTreeSharedUserResponseType> = [
    {
      title: 'User',
      key: 'name',
      render: (_, record) => (
        <Space>
          <Avatar src={record.image}>{record.name?.[0]}</Avatar>
          <Space orientation="vertical" size={0}>
            <Text strong>{record.name}</Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.email}
            </Text>
          </Space>
          {record.isBlocked && <Tag color="error">Blocked</Tag>}
        </Space>
      ),
    },
    {
      title: 'Permissions',
      key: 'permissions',
      render: (_, record) => (
        <Space size="large">
          <Space orientation="vertical" size="small" align="center">
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Add Members
            </Text>
            <Switch
              checked={record.canAddMembers}
              disabled={record.isBlocked || mutating}
              onChange={(checked) =>
                editSharedTreeModel.editTrigger({
                  ...record,
                  canAddMembers: checked,
                })
              }
            />
          </Space>
          <Space orientation="vertical" size="small" align="center">
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Edit Members
            </Text>
            <Switch
              checked={record.canEditMembers}
              disabled={record.isBlocked || mutating}
              onChange={(checked) =>
                editSharedTreeModel.editTrigger({
                  ...record,
                  canEditMembers: checked,
                })
              }
            />
          </Space>
          <Space orientation="vertical" size="small" align="center">
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Delete Members
            </Text>
            <Switch
              checked={record.canDeleteMembers}
              disabled={record.isBlocked || mutating}
              onChange={(checked) =>
                editSharedTreeModel.editTrigger({
                  ...record,
                  canDeleteMembers: checked,
                })
              }
            />
          </Space>
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Button
          danger={!record.isBlocked}
          type={record.isBlocked ? 'default' : 'primary'}
          loading={mutating}
          onClick={() =>
            editSharedTreeModel.editTrigger({
              ...record,
              isBlocked: !record.isBlocked,
            })
          }
        >
          {record.isBlocked ? 'Unblock Access' : 'Block Access'}
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Card variant="outlined" className="shadow-sm">
        <Flex
          justify="space-between"
          align="center"
          style={{ marginBottom: 32 }}
        >
          <div>
            <Flex align="center" gap={8}>
              <Title level={3} style={{ margin: 0 }}>
                Shared Users
              </Title>
              <Tag
                variant="filled"
                style={{
                  margin: 0,
                  borderRadius: '12px',
                  padding: '0 8px',
                  backgroundColor: '#f0f0f0',
                  color: '#666',
                  fontWeight: 600,
                }}
              >
                {paginatedUsers.totalCount}
              </Tag>
            </Flex>
            <Text type="secondary">
              Manage permissions for users who have access to this family tree.
            </Text>
          </div>
          <Input
            placeholder="Search users..."
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => searchChanged(e.target.value)}
            allowClear
            style={{ width: 300 }}
          />
        </Flex>

        <Table
          dataSource={paginatedUsers.sharedFamilyTreeUsers}
          columns={columns}
          rowKey="userId"
          pagination={false}
          className="border border-gray-100 rounded-lg overflow-hidden mb-6"
        />

        {paginatedUsers.totalPages > 1 && (
          <Flex justify="center">
            <Pagination
              current={page}
              total={paginatedUsers.totalCount}
              pageSize={paginatedUsers.perPage}
              onChange={pageChanged}
              showSizeChanger={false}
              showTotal={(total, range) =>
                `${range[0]}-${range[1]} of ${total} users`
              }
            />
          </Flex>
        )}
      </Card>
    </div>
  );
};

export const component = SharedTreeUsers;
export { factory as createModel } from '../model';

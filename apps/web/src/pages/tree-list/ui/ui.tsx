import {
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type {
  FamilyTreeResponseType,
  FamilyTreeSharedResponseType,
} from '@family-tree/shared';
import {
  Button,
  Card,
  Col,
  Dropdown,
  Flex,
  Input,
  type MenuProps,
  Pagination,
  Row,
  Tabs,
  Typography,
  theme,
} from 'antd';
import { Link } from 'atomic-router-react';
import { useUnit } from 'effector-react';
import {
  CreateEditTreeModal,
  createEditTreeModel,
} from '~/features/tree/create-edit';
import { DeleteTreeModal, deleteTreeModel } from '~/features/tree/delete';
import { routes } from '~/shared/config/routing';
import type { LazyPageProps } from '~/shared/lib/lazy-page';
import { PageLoading } from '~/shared/ui/loading';
import type { factory } from '../model';

// Types
type Model = ReturnType<typeof factory>;
type Props = LazyPageProps<Model>;
type TreeCardProps = {
  tree: FamilyTreeResponseType;
};
type SharedTreeCardProps = {
  tree: FamilyTreeSharedResponseType;
};

type BaseTreeCardProps = {
  tree: { id?: string; name: string; image: string | null };
  actions?: React.ReactNode;
  linkTo?:
    | typeof routes.treesDetail
    | typeof routes.sharedTreesDetail
    | typeof routes.publicTreesDetail;
  linkParams?: { id: string };
};

// Base Tree Card Component
const BaseTreeCard: React.FC<BaseTreeCardProps> = ({
  tree,
  actions,
  linkTo,
  linkParams,
}) => {
  const { token } = theme.useToken();

  const cardContent = (
    <Card
      hoverable
      styles={{
        body: {
          padding: '12px 16px 16px',
          height: 'calc(100% - 140px)',
        },
      }}
      style={{
        height: '100%',
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
      }}
      cover={
        <div
          style={{
            height: 140,
            background: token.colorFillContent,
            display: 'flex',
            overflow: 'hidden',
            position: 'relative',
            ...(tree.image
              ? {}
              : {
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: token.colorFillSecondary,
                }),
          }}
        >
          {tree.image ? (
            <img
              src={tree.image}
              loading="eager"
              alt={tree.name}
              style={{
                height: '100%',
                width: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                transition: 'transform 0.3s',
              }}
            />
          ) : (
            <span
              role="img"
              aria-label="tree"
              style={{
                fontSize: 48,
                lineHeight: 1,
                color: token.colorTextDescription,
              }}
            >
              🌲
            </span>
          )}
        </div>
      }
    >
      {actions}
      <Typography.Title
        level={5}
        style={{
          marginBottom: 4,
          marginTop: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        title={tree.name}
      >
        {tree.name}
      </Typography.Title>
    </Card>
  );

  if (linkTo && linkParams) {
    return (
      <Link to={linkTo} params={linkParams}>
        {cardContent}
      </Link>
    );
  }

  return cardContent;
};

// Tree Card Component for Already Created Tree
export const TreeCard: React.FC<TreeCardProps> = ({ tree }) => {
  const menuItems: MenuProps['items'] = [
    {
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: (event) => {
        event.domEvent.stopPropagation();
        createEditTreeModel.editTrigger({
          id: tree.id,
          values: {
            image: tree.image,
            name: tree.name,
            isPublic: tree.isPublic,
          },
        });
      },
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: (event) => {
        event.domEvent.stopPropagation();
        deleteTreeModel.deleteTrigger({ id: tree.id });
      },
    },
  ];

  return (
    <BaseTreeCard
      tree={tree}
      linkTo={routes.treesDetail}
      linkParams={{ id: tree.id }}
      actions={
        <Dropdown
          menu={{ items: menuItems }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button
            shape="circle"
            icon={<EllipsisOutlined />}
            size="small"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            style={{
              position: 'absolute',
              bottom: 8,
              right: 20,
              zIndex: 1,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 25,
            }}
          />
        </Dropdown>
      }
    />
  );
};

// Public Tree Card Component
export const PublicTreeCard: React.FC<TreeCardProps> = ({ tree }) => {
  return (
    <BaseTreeCard
      tree={tree}
      linkTo={routes.publicTreesDetail}
      linkParams={{ id: tree.id }}
    />
  );
};

// Shared Tree Card Component
export const SharedTreeCard: React.FC<SharedTreeCardProps> = ({ tree }) => {
  return (
    <BaseTreeCard
      tree={tree}
      linkTo={routes.sharedTreesDetail}
      linkParams={{ id: tree.familyTreeId }}
    />
  );
};

// Trees Grid Component => Already Created Trees Component
const TreesGrid: React.FC<Props> = ({ model }) => {
  const [
    mode,
    paginatedTrees,
    paginatedSharedTrees,
    paginatedPublicTrees,
    myTreesPage,
    sharedTreesPage,
    publicTreesPage,
    myTreesSearchQuery,
    sharedTreesSearchQuery,
    publicTreesSearchQuery,
  ] = useUnit([
    model.$mode,
    model.$paginatedUserTrees,
    model.$paginatedSharedTrees,
    model.$paginatedPublicTrees,
    model.$myTreesPage,
    model.$sharedTreesPage,
    model.$publicTreesPage,
    model.$myTreesSearchQuery,
    model.$sharedTreesSearchQuery,
    model.$publicTreesSearchQuery,
  ]);

  const { token } = theme.useToken();

  const searchQueryByMode = {
    'my-trees': myTreesSearchQuery,
    'shared-trees': sharedTreesSearchQuery,
    'public-trees': publicTreesSearchQuery,
  };
  const currentSearchQuery = searchQueryByMode[mode];

  const tabItems = [
    {
      key: 'my-trees',
      label: (
        <span>
          My Family Trees{' '}
          <span
            style={{
              marginLeft: 6,
              padding: '2px 8px',
              borderRadius: 12,
              backgroundColor: token.colorFillSecondary,
              color: token.colorTextSecondary,
              fontSize: 12,
              fontWeight: 'normal',
            }}
          >
            {paginatedTrees.totalCount}
          </span>
        </span>
      ),
      children: (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {/* Create A New Tree - First Item */}
            <Col xs={12} sm={8} md={6} lg={6} xl={4}>
              <Card
                hoverable
                onClick={() => createEditTreeModel.createTrigger()}
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  border: '1px dashed #ccc',
                  minHeight: 200,
                }}
              >
                <span
                  role="img"
                  aria-label="tree"
                  style={{ fontSize: 40, position: 'relative', left: 22 }}
                >
                  🌲
                </span>
                <br />
                <Typography.Text style={{ fontSize: 15 }}>
                  Create A New Tree
                </Typography.Text>
              </Card>
            </Col>

            {/* Own Trees */}
            {paginatedTrees.familyTrees.map((tree) => (
              <Col xs={12} sm={8} md={6} lg={6} xl={4} key={tree.id}>
                <TreeCard tree={tree} />
              </Col>
            ))}
          </Row>

          {/* Pagination for My Trees */}
          {paginatedTrees.totalPages > 1 && (
            <Flex justify="center" style={{ marginTop: 24 }}>
              <Pagination
                current={myTreesPage}
                total={paginatedTrees.totalCount}
                pageSize={paginatedTrees.perPage}
                onChange={(page) => model.myTreesPageChanged(page)}
                showSizeChanger={false}
                showTotal={(total, range) =>
                  `${range[0]}-${range[1]} of ${total} trees`
                }
              />
            </Flex>
          )}
        </>
      ),
    },
    {
      key: 'shared-trees',
      label: (
        <span>
          Shared With Me{' '}
          <span
            style={{
              marginLeft: 6,
              padding: '2px 8px',
              borderRadius: 12,
              backgroundColor: token.colorFillSecondary,
              color: token.colorTextSecondary,
              fontSize: 12,
              fontWeight: 'normal',
            }}
          >
            {paginatedSharedTrees.totalCount}
          </span>
        </span>
      ),
      children: (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {/* Shared Trees */}
            {paginatedSharedTrees.sharedFamilyTrees.map((sharedTree) => (
              <Col
                xs={12}
                sm={8}
                md={6}
                lg={6}
                xl={4}
                key={sharedTree.familyTreeId}
              >
                <SharedTreeCard tree={sharedTree} />
              </Col>
            ))}
          </Row>

          {/* Pagination for Shared Trees */}
          {paginatedSharedTrees.totalPages > 1 && (
            <Flex justify="center" style={{ marginTop: 24 }}>
              <Pagination
                current={sharedTreesPage}
                total={paginatedSharedTrees.totalCount}
                pageSize={paginatedSharedTrees.perPage}
                onChange={(page) => model.sharedTreesPageChanged(page)}
                showSizeChanger={false}
                showTotal={(total, range) =>
                  `${range[0]}-${range[1]} of ${total} trees`
                }
              />
            </Flex>
          )}
        </>
      ),
    },
    {
      key: 'public-trees',
      label: (
        <span>
          Public Family Trees{' '}
          <span
            style={{
              marginLeft: 6,
              padding: '2px 8px',
              borderRadius: 12,
              backgroundColor: token.colorFillSecondary,
              color: token.colorTextSecondary,
              fontSize: 12,
              fontWeight: 'normal',
            }}
          >
            {paginatedPublicTrees.totalCount}
          </span>
        </span>
      ),
      children: (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {/* Public Trees */}
            {paginatedPublicTrees.familyTrees.map((publicTree) => (
              <Col xs={12} sm={8} md={6} lg={6} xl={4} key={publicTree.id}>
                <PublicTreeCard tree={publicTree} />
              </Col>
            ))}
          </Row>

          {/* Pagination for Public Trees */}
          {paginatedPublicTrees.totalPages > 1 && (
            <Flex justify="center" style={{ marginTop: 24 }}>
              <Pagination
                current={publicTreesPage}
                total={paginatedPublicTrees.totalCount}
                pageSize={paginatedPublicTrees.perPage}
                onChange={(page) => model.publicTreesPageChanged(page)}
                showSizeChanger={false}
                showTotal={(total, range) =>
                  `${range[0]}-${range[1]} of ${total} trees`
                }
              />
            </Flex>
          )}
        </>
      ),
    },
  ];

  return (
    <div style={{ padding: '0 16px' }}>
      <Tabs
        activeKey={mode}
        onChange={(key) => {
          if (key === 'my-trees') {
            model.myTreesTriggered();
          } else if (key === 'shared-trees') {
            model.sharedTreesTriggered();
          } else {
            model.publicTreesTriggered();
          }
        }}
        items={tabItems}
        size="large"
        tabBarExtraContent={
          <Input
            placeholder="Search trees..."
            prefix={<SearchOutlined />}
            value={currentSearchQuery}
            onChange={(e) => {
              const value = e.target.value;
              switch (mode) {
                case 'my-trees':
                  model.myTreesSearchChanged(value);
                  break;
                case 'shared-trees':
                  model.sharedTreesSearchChanged(value);
                  break;
                case 'public-trees':
                  model.publicTreesSearchChanged(value);
                  break;
              }
            }}
            status={
              currentSearchQuery.length > 0 && currentSearchQuery.length < 3
                ? 'error'
                : undefined
            }
            allowClear
            style={{
              width: 250,
            }}
          />
        }
      />
    </div>
  );
};

// Main Component => Trees Grid Component
const TreesPage: React.FC<Props> = ({ model }) => {
  const [treesFetching] = useUnit([model.$fetching]);
  const { token } = theme.useToken();

  // Loader
  if (treesFetching) {
    return <PageLoading />;
  }

  return (
    <Flex vertical gap={token.size}>
      <TreesGrid model={model} />
      <CreateEditTreeModal />
      <DeleteTreeModal />
    </Flex>
  );
};

export const component = TreesPage;
export { factory as createModel } from '../model';

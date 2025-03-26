import { Flex, Table, TableColumnProps, theme } from 'antd';
import { factory } from '../model';
import { LazyPageProps } from '../../../shared/lib/lazy-page';
import { useUnit } from 'effector-react';
import { FamilyTreeResponseType } from '@family-tree/shared';
import { CreateTree } from '../../../features/tree/create';

type Model = ReturnType<typeof factory>;
type Props = LazyPageProps<Model>;

const useColumns = (): TableColumnProps<FamilyTreeResponseType>[] => {
  return [
    {
      title: 'Name',
      dataIndex: 'name',
    },
  ];
};

const TreesPage: React.FC<Props> = ({ model }) => {
  const [trees, treesFetching] = useUnit([model.$trees, model.$treesFetching]);
  const columns = useColumns();
  const { token } = theme.useToken();

  return (
    <Flex vertical gap={token.size}>
      <Flex justify="end">
        <CreateTree />
      </Flex>
      <Table
        dataSource={trees}
        loading={treesFetching}
        columns={columns}
        rowKey="id"
      />
    </Flex>
  );
};

export const component = TreesPage;
export const createModel = factory;

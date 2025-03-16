import { Flex, Typography } from 'antd';

type Props = {
  message?: string;
  label: string;
  isError: boolean;
};

export const FieldWrapper: React.FC<React.PropsWithChildren<Props>> = (
  props
) => {
  const { children, message, label, isError } = props;

  return (
    <Flex vertical>
      <label style={{ display: 'flex', flexDirection: 'column' }}>
        <Typography.Text type="secondary">{label}</Typography.Text>
        {children}
      </label>
      {isError && (
        <Typography.Text type="danger" style={{ fontSize: '12px' }}>
          {message ?? 'Обязательное поле'}
        </Typography.Text>
      )}
    </Flex>
  );
};

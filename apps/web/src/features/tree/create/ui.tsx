import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Modal, theme, Upload } from 'antd';
import { zodResolver } from '@hookform/resolvers/zod';

import * as model from './model';
import { useUnit } from 'effector-react';
import { useId, useState } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { FieldWrapper } from '../../../shared/ui/field-wrapper';
import { getImage } from '../../../shared/lib/get-image';

export const CreateTree: React.FC = () => {
  const [isOpen] = useUnit([model.disclosure.$isOpen]);
  const id = useId();
  const form = useForm<model.FormValues>({
    resolver: zodResolver(model.formSchema),
  });
  model.form.useBindFormWithModel({ form });
  const { token } = theme.useToken();
  const [img, setImg] = useState('');

  return (
    <>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => model.disclosure.opened()}
      >
        Create
      </Button>
      <Modal
        open={isOpen}
        title="Creating tree"
        onCancel={() => model.disclosure.closed()}
        okText="Create"
        okButtonProps={{ type: 'primary', form: id, htmlType: 'submit' }}
      >
        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(() => model.formValidated())}
            id={id}
          >
            <Flex vertical gap={token.size}>
              <Controller
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FieldWrapper
                    label="Name"
                    isError={!!form.formState.errors['name']?.message}
                    message={form.formState.errors['name']?.message}
                  >
                    <Input
                      value={field.value}
                      onChange={(value) => field.onChange(value.target.value)}
                    />
                  </FieldWrapper>
                )}
              />
              <Upload
                action={async (file) => {
                  const res = await model.uploadFileFx(file);
                  const img = URL.createObjectURL(file);
                  setImg(img);
                  return img;
                }}
              >
                <Button icon={<UploadOutlined />}>Upload</Button>
              </Upload>
              <img src={img} />
            </Flex>
          </form>
        </FormProvider>
      </Modal>
    </>
  );
};

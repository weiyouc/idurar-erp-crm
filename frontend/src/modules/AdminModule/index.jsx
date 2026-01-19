import CrudModule from '@/modules/CrudModule/CrudModule';
import AdminRolesForm from '@/forms/AdminRolesForm';
import { Tag, Space } from 'antd';

export default function AdminModule({ config }) {
  const entity = 'admin';

  const dataTableColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 150,
    },
    {
      title: 'Surname',
      dataIndex: 'surname',
      key: 'surname',
      width: 150,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 220,
    },
    {
      title: 'Roles',
      dataIndex: 'roles',
      key: 'roles',
      width: 220,
      render: (roles) => (
        <Space wrap>
          {(roles || []).map(role => (
            <Tag key={role._id} color="blue">
              {role.displayName?.en || role.name}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (enabled) => (
        <Tag color={enabled ? 'green' : 'red'}>
          {enabled ? 'Active' : 'Disabled'}
        </Tag>
      ),
    },
  ];

  const readColumns = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Surname', dataIndex: 'surname' },
    { title: 'Email', dataIndex: 'email' },
    {
      title: 'Roles',
      dataIndex: 'roles',
      render: (roles) =>
        (roles || []).map(role => role.displayName?.en || role.name).join(', '),
    },
    { title: 'Enabled', dataIndex: 'enabled', render: (value) => (value ? 'Yes' : 'No') },
  ];

  const searchConfig = {
    displayLabels: ['name', 'email'],
    searchFields: 'name,email',
    outputValue: '_id',
  };

  const finalConfig = {
    entity,
    dataTableColumns,
    readColumns,
    searchConfig,
    disableAdd: true,
    disableDelete: true,
    ...config,
  };

  return (
    <CrudModule
      createForm={<AdminRolesForm />}
      updateForm={<AdminRolesForm isUpdateForm={true} />}
      config={finalConfig}
    />
  );
}

import { useEffect } from 'react';
import CrudModule from '@/modules/CrudModule/CrudModule';
import RoleForm from '@/forms/RoleForm';
import { Tag, Space } from 'antd';

export default function RoleModule({ config }) {
  const entity = 'roles';
  
  const dataTableColumns = [
    {
      title: 'Role Name',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 150,
    },
    {
      title: 'Display Name',
      dataIndex: ['displayName', 'en'],
      key: 'displayName',
      width: 200,
      render: (_, record) => (
        <div>
          <div>{record.displayName?.en}</div>
          <div style={{ color: '#888', fontSize: '12px' }}>{record.displayName?.zh}</div>
        </div>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 250,
    },
    {
      title: 'Permissions',
      dataIndex: 'permissions',
      key: 'permissions',
      width: 100,
      render: (permissions) => permissions?.length || 0,
    },
    {
      title: 'Type',
      dataIndex: 'isSystemRole',
      key: 'isSystemRole',
      width: 100,
      render: (isSystemRole) => (
        <Tag color={isSystemRole ? 'blue' : 'green'}>
          {isSystemRole ? 'System' : 'Custom'}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'removed',
      key: 'status',
      width: 100,
      render: (removed) => (
        <Tag color={removed ? 'red' : 'green'}>
          {removed ? 'Inactive' : 'Active'}
        </Tag>
      ),
    },
  ];

  const readColumns = [
    {
      title: 'Role Name',
      dataIndex: 'name',
    },
    {
      title: 'Display Name (EN)',
      dataIndex: ['displayName', 'en'],
    },
    {
      title: 'Display Name (ZH)',
      dataIndex: ['displayName', 'zh'],
    },
    {
      title: 'Description',
      dataIndex: 'description',
    },
    {
      title: 'System Role',
      dataIndex: 'isSystemRole',
      render: (value) => (value ? 'Yes' : 'No'),
    },
    {
      title: 'Created',
      dataIndex: 'created',
      render: (date) => new Date(date).toLocaleDateString(),
    },
  ];

  const searchConfig = {
    displayLabels: ['name', 'displayName.en'],
    searchFields: 'name,displayName.en,displayName.zh',
    outputValue: '_id',
  };

  const entityDisplayLabels = ['name'];

  const finalConfig = {
    entity,
    dataTableColumns,
    readColumns,
    searchConfig,
    deleteModalLabels: entityDisplayLabels,
    ...config,
  };

  return (
    <CrudModule
      createForm={<RoleForm />}
      updateForm={<RoleForm isUpdateForm={true} />}
      config={finalConfig}
    />
  );
}


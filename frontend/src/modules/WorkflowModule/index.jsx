import CrudModule from '@/modules/CrudModule/CrudModule';
import WorkflowForm from '@/forms/WorkflowForm';
import { Tag, Badge } from 'antd';

export default function WorkflowModule({ config }) {
  const entity = 'workflows';
  
  const dataTableColumns = [
    {
      title: 'Workflow Name',
      dataIndex: 'workflowName',
      key: 'workflowName',
      fixed: 'left',
      width: 200,
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
      title: 'Document Type',
      dataIndex: 'documentType',
      key: 'documentType',
      width: 150,
      render: (type) => {
        const colorMap = {
          supplier: 'blue',
          material_quotation: 'green',
          purchase_order: 'orange',
          pre_payment: 'purple',
        };
        return <Tag color={colorMap[type] || 'default'}>{type}</Tag>;
      },
    },
    {
      title: 'Levels',
      dataIndex: 'levels',
      key: 'levels',
      width: 80,
      render: (levels) => (
        <Badge count={levels?.length || 0} showZero color="blue" />
      ),
    },
    {
      title: 'Default',
      dataIndex: 'isDefault',
      key: 'isDefault',
      width: 80,
      render: (isDefault) => (
        isDefault ? <Tag color="gold">Default</Tag> : null
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
  ];

  const readColumns = [
    {
      title: 'Workflow Name',
      dataIndex: 'workflowName',
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
      title: 'Document Type',
      dataIndex: 'documentType',
    },
    {
      title: 'Description',
      dataIndex: 'description',
    },
    {
      title: 'Approval Levels',
      dataIndex: 'levels',
      render: (levels) => levels?.length || 0,
    },
    {
      title: 'Is Default',
      dataIndex: 'isDefault',
      render: (value) => (value ? 'Yes' : 'No'),
    },
    {
      title: 'Is Active',
      dataIndex: 'isActive',
      render: (value) => (value ? 'Yes' : 'No'),
    },
    {
      title: 'Created',
      dataIndex: 'created',
      render: (date) => new Date(date).toLocaleDateString(),
    },
  ];

  const searchConfig = {
    displayLabels: ['workflowName', 'displayName.en'],
    searchFields: 'workflowName,displayName.en,displayName.zh,documentType',
    outputValue: '_id',
  };

  const entityDisplayLabels = ['workflowName'];

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
      createForm={<WorkflowForm />}
      updateForm={<WorkflowForm isUpdateForm={true} />}
      config={finalConfig}
    />
  );
}


import React from 'react';
import CrudModule from '@/modules/CrudModule/CrudModule';
import SupplierForm from '@/forms/SupplierForm';
import { Tag, Space, Button, Tooltip, Popconfirm, message } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  StopOutlined,
  DeleteOutlined,
  SendOutlined
} from '@ant-design/icons';
import { request } from '@/request';
import dayjs from 'dayjs';
import ExportButton from '@/components/ExportButton';

const SupplierModule = () => {
  const entity = 'suppliers';
  const searchConfig = {
    displayLabels: ['companyName.zh', 'companyName.en'],
    searchFields: 'companyName.zh,companyName.en,supplierNumber,abbreviation',
    outputValue: '_id'
  };

  const handleApprove = async (id) => {
    try {
      const response = await request.post({
        entity: `${entity}/${id}/approve`,
        jsonData: {
          comments: 'Approved'
        }
      });

      if (response.success) {
        message.success('Supplier approved successfully');
        window.location.reload(); // Refresh the list
      }
    } catch (error) {
      message.error(`Failed to approve supplier: ${error.message}`);
    }
  };

  const handleReject = async (id) => {
    try {
      const reason = prompt('Please enter rejection reason:');
      if (!reason) return;

      const response = await request.post({
        entity: `${entity}/${id}/reject`,
        jsonData: { reason }
      });

      if (response.success) {
        message.success('Supplier rejected');
        window.location.reload();
      }
    } catch (error) {
      message.error(`Failed to reject supplier: ${error.message}`);
    }
  };

  const handleActivate = async (id) => {
    try {
      const response = await request.post({
        entity: `${entity}/${id}/activate`
      });

      if (response.success) {
        message.success('Supplier activated');
        window.location.reload();
      }
    } catch (error) {
      message.error(`Failed to activate supplier: ${error.message}`);
    }
  };

  const handleDeactivate = async (id) => {
    try {
      const response = await request.post({
        entity: `${entity}/${id}/deactivate`
      });

      if (response.success) {
        message.success('Supplier deactivated');
        window.location.reload();
      }
    } catch (error) {
      message.error(`Failed to deactivate supplier: ${error.message}`);
    }
  };

  const dataTableColumns = [
    {
      title: 'Supplier Number',
      dataIndex: 'supplierNumber',
      key: 'supplierNumber',
      fixed: 'left',
      width: 150,
      sorter: true
    },
    {
      title: 'Company Name (ZH)',
      dataIndex: ['companyName', 'zh'],
      key: 'companyName.zh',
      width: 200,
      render: (text) => text || '-'
    },
    {
      title: 'Company Name (EN)',
      dataIndex: ['companyName', 'en'],
      key: 'companyName.en',
      width: 200,
      render: (text) => text || '-'
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      filters: [
        { text: 'Manufacturer', value: 'manufacturer' },
        { text: 'Distributor', value: 'distributor' },
        { text: 'Agent', value: 'agent' },
        { text: 'Other', value: 'other' }
      ],
      render: (type) => {
        const colors = {
          manufacturer: 'blue',
          distributor: 'green',
          agent: 'orange',
          other: 'default'
        };
        return <Tag color={colors[type]}>{type}</Tag>;
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      filters: [
        { text: 'Draft', value: 'draft' },
        { text: 'Pending Approval', value: 'pending_approval' },
        { text: 'Active', value: 'active' },
        { text: 'Inactive', value: 'inactive' },
        { text: 'Blacklisted', value: 'blacklisted' }
      ],
      render: (status) => {
        const config = {
          draft: { color: 'default', text: 'Draft' },
          pending_approval: { color: 'orange', text: 'Pending Approval' },
          active: { color: 'green', text: 'Active' },
          inactive: { color: 'default', text: 'Inactive' },
          blacklisted: { color: 'red', text: 'Blacklisted' }
        };
        const { color, text } = config[status] || { color: 'default', text: status };
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: 'Contact',
      dataIndex: ['contact', 'primaryContact'],
      key: 'contact',
      width: 150,
      render: (text) => text || '-'
    },
    {
      title: 'Email',
      dataIndex: ['contact', 'email'],
      key: 'email',
      width: 180,
      render: (text) => text || '-'
    },
    {
      title: 'Phone',
      dataIndex: ['contact', 'phone'],
      key: 'phone',
      width: 150,
      render: (text) => text || '-'
    },
    {
      title: 'Credit Rating',
      dataIndex: ['creditInfo', 'creditRating'],
      key: 'creditRating',
      width: 120,
      filters: [
        { text: 'A - Excellent', value: 'A' },
        { text: 'B - Good', value: 'B' },
        { text: 'C - Fair', value: 'C' },
        { text: 'D - Poor', value: 'D' },
        { text: 'Unrated', value: 'Unrated' }
      ],
      render: (rating) => {
        if (!rating || rating === 'Unrated') return '-';
        const colors = {
          A: 'green',
          B: 'blue',
          C: 'orange',
          D: 'red'
        };
        return <Tag color={colors[rating]}>{rating}</Tag>;
      }
    },
    {
      title: 'Created Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      sorter: true,
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
    }
  ];

  // Additional actions for each row
  const additionalActions = (record) => {
    const actions = [];

    // Approve/Reject actions for pending suppliers
    if (record.status === 'pending_approval') {
      actions.push(
        <Tooltip title="Approve" key="approve">
          <Popconfirm
            title="Approve this supplier?"
            onConfirm={() => handleApprove(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="link"
              icon={<CheckCircleOutlined />}
              style={{ color: '#52c41a' }}
            />
          </Popconfirm>
        </Tooltip>
      );

      actions.push(
        <Tooltip title="Reject" key="reject">
          <Button
            type="link"
            icon={<CloseCircleOutlined />}
            danger
            onClick={() => handleReject(record.id)}
          />
        </Tooltip>
      );
    }

    // Submit for approval (draft status)
    if (record.status === 'draft') {
      actions.push(
        <Tooltip title="Submit for Approval" key="submit">
          <Popconfirm
            title="Submit this supplier for approval?"
            onConfirm={async () => {
              try {
                const response = await request.post({
                  entity: `${entity}/${record.id}/submit`
                });
                if (response.success) {
                  message.success('Supplier submitted for approval');
                  window.location.reload();
                }
              } catch (error) {
                message.error(`Failed to submit: ${error.message}`);
              }
            }}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="link"
              icon={<SendOutlined />}
              style={{ color: '#1890ff' }}
            />
          </Popconfirm>
        </Tooltip>
      );
    }

    // Activate/Deactivate for inactive/active suppliers
    if (record.status === 'inactive') {
      actions.push(
        <Tooltip title="Activate" key="activate">
          <Popconfirm
            title="Activate this supplier?"
            onConfirm={() => handleActivate(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="link"
              icon={<CheckCircleOutlined />}
              style={{ color: '#52c41a' }}
            />
          </Popconfirm>
        </Tooltip>
      );
    }

    if (record.status === 'active') {
      actions.push(
        <Tooltip title="Deactivate" key="deactivate">
          <Popconfirm
            title="Deactivate this supplier?"
            onConfirm={() => handleDeactivate(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="link"
              icon={<StopOutlined />}
              style={{ color: '#faad14' }}
            />
          </Popconfirm>
        </Tooltip>
      );
    }

    return <Space>{actions}</Space>;
  };

  const config = {
    entity,
    DATATABLE_TITLE: 'Suppliers',
    dataTableColumns,
    searchConfig,
    entityDisplayLabels: ['companyName.zh', 'companyName.en'],
    ADD_NEW_ENTITY: 'Add new supplier',
    DATATABLE_SUBTITLE: 'Manage your suppliers',
    PANEL_TITLE: 'Supplier Panel',
    CREATE_ENTITY: 'Save supplier',
    UPDATE_ENTITY: 'Update supplier',
    readColumns: dataTableColumns,
    dataTableAdditionalActions: additionalActions,
    headerActions: [
      <ExportButton
        key="export-suppliers"
        entity="suppliers"
        exportType="supplier"
        buttonText="Export"
        buttonType="default"
      />
    ],
    updateFooterActions: (current) => {
      const supplierId = current?._id || current?.id;
      if (!supplierId || current?.status !== 'draft') {
        return null;
      }

      return (
        <Button
          type="primary"
          icon={<SendOutlined />}
          style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
          onClick={async () => {
            try {
              const response = await request.post({
                entity: `${entity}/${supplierId}/submit`
              });
              if (response.success) {
                message.success('Supplier submitted for approval');
                window.location.reload();
              }
            } catch (error) {
              message.error(`Failed to submit: ${error.message}`);
            }
          }}
        >
          Submit for Approval
        </Button>
      );
    }
  };

  return (
    <CrudModule
      config={config}
      createForm={<SupplierForm embedded />}
      updateForm={<SupplierForm embedded isUpdateForm={true} />}
    />
  );
};

export default SupplierModule;


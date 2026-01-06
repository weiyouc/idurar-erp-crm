import React, { useState } from 'react';
import {
  Card,
  Button,
  Modal,
  Space,
  Tag,
  Popconfirm,
  message,
  Dropdown,
  Menu,
  Tooltip,
  Input,
  Select,
  DatePicker,
  Row,
  Col
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SendOutlined,
  CheckOutlined,
  CloseOutlined,
  MoreOutlined,
  SearchOutlined,
  FileExcelOutlined,
  FilePdfOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { request } from '@/request';
import DataTable from '@/components/DataTable';
import PurchaseOrderForm from '@/forms/PurchaseOrderForm';

const { Option } = Select;
const { RangePicker } = DatePicker;

const PurchaseOrderModule = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState({});

  const handleCreate = () => {
    setCurrentRecord(null);
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setCurrentRecord(record);
    setModalVisible(true);
  };

  const handleView = async (record) => {
    try {
      const response = await request.read({
        entity: 'purchase-orders',
        id: record._id
      });
      if (response.success) {
        setCurrentRecord(response.result);
        setViewModalVisible(true);
      }
    } catch (error) {
      message.error('Failed to load purchase order details');
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await request.delete({
        entity: 'purchase-orders',
        id
      });
      if (response.success) {
        message.success('Purchase order deleted successfully');
        setRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      message.error(error.message || 'Failed to delete purchase order');
    }
  };

  const handleSubmitForApproval = async (record) => {
    try {
      const response = await request.post({
        entity: 'purchase-orders',
        id: record._id,
        subEntity: 'submit'
      });
      if (response.success) {
        message.success('Purchase order submitted for approval');
        setRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      message.error(error.message || 'Failed to submit purchase order');
    }
  };

  const handleApprove = async (record) => {
    try {
      const response = await request.post({
        entity: 'purchase-orders',
        id: record._id,
        subEntity: 'approve',
        jsonData: { comments: 'Approved' }
      });
      if (response.success) {
        message.success('Purchase order approved');
        setRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      message.error(error.message || 'Failed to approve purchase order');
    }
  };

  const handleReject = async (record) => {
    Modal.confirm({
      title: 'Reject Purchase Order',
      content: (
        <Input.TextArea
          id="reject-reason"
          placeholder="Enter rejection reason"
          rows={4}
        />
      ),
      onOk: async () => {
        const reason = document.getElementById('reject-reason')?.value;
        if (!reason) {
          message.error('Please provide a rejection reason');
          return;
        }
        
        try {
          const response = await request.post({
            entity: 'purchase-orders',
            id: record._id,
            subEntity: 'reject',
            jsonData: { reason }
          });
          if (response.success) {
            message.success('Purchase order rejected');
            setRefreshKey(prev => prev + 1);
          }
        } catch (error) {
          message.error(error.message || 'Failed to reject purchase order');
        }
      }
    });
  };

  const handleSendToSupplier = async (record) => {
    Modal.confirm({
      title: 'Send to Supplier',
      content: (
        <Input
          id="supplier-email"
          placeholder="Enter supplier email"
          defaultValue={record.supplier?.contact?.email}
        />
      ),
      onOk: async () => {
        const email = document.getElementById('supplier-email')?.value;
        if (!email) {
          message.error('Please provide supplier email');
          return;
        }
        
        try {
          const response = await request.post({
            entity: 'purchase-orders',
            id: record._id,
            subEntity: 'send',
            jsonData: { email }
          });
          if (response.success) {
            message.success('Purchase order sent to supplier');
            setRefreshKey(prev => prev + 1);
          }
        } catch (error) {
          message.error(error.message || 'Failed to send purchase order');
        }
      }
    });
  };

  const handleSuccess = () => {
    setModalVisible(false);
    setCurrentRecord(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleExport = async (format) => {
    try {
      message.loading(`Exporting to ${format.toUpperCase()}...`);
      // Implementation would connect to export endpoint
      message.success(`Export to ${format.toUpperCase()} completed`);
    } catch (error) {
      message.error(`Failed to export to ${format.toUpperCase()}`);
    }
  };

  const getActionMenu = (record) => {
    const items = [];

    if (record.status === 'draft') {
      items.push(
        { key: 'submit', label: 'Submit for Approval', icon: <SendOutlined />, onClick: () => handleSubmitForApproval(record) }
      );
    }

    if (record.status === 'pending_approval') {
      items.push(
        { key: 'approve', label: 'Approve', icon: <CheckOutlined />, onClick: () => handleApprove(record) },
        { key: 'reject', label: 'Reject', icon: <CloseOutlined />, onClick: () => handleReject(record) }
      );
    }

    if (record.status === 'approved') {
      items.push(
        { key: 'send', label: 'Send to Supplier', icon: <SendOutlined />, onClick: () => handleSendToSupplier(record) }
      );
    }

    items.push(
      { key: 'pdf', label: 'Export PDF', icon: <FilePdfOutlined />, onClick: () => handleExport('pdf') }
    );

    return <Menu items={items} />;
  };

  const columns = [
    {
      title: 'PO Number',
      dataIndex: 'poNumber',
      key: 'poNumber',
      fixed: 'left',
      width: 150,
      sorter: true,
      render: (text, record) => (
        <Button type="link" onClick={() => handleView(record)}>
          {text}
        </Button>
      )
    },
    {
      title: 'Supplier',
      dataIndex: ['supplier', 'companyName'],
      key: 'supplier',
      width: 200,
      render: (companyName) => companyName?.en || companyName?.zh || '-'
    },
    {
      title: 'Order Date',
      dataIndex: 'orderDate',
      key: 'orderDate',
      width: 120,
      sorter: true,
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
    },
    {
      title: 'Delivery Date',
      dataIndex: 'expectedDeliveryDate',
      key: 'expectedDeliveryDate',
      width: 120,
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      align: 'right',
      render: (amount, record) => 
        amount ? `${record.currency || 'USD'} ${amount.toFixed(2)}` : '-'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      filters: [
        { text: 'Draft', value: 'draft' },
        { text: 'Pending Approval', value: 'pending_approval' },
        { text: 'Approved', value: 'approved' },
        { text: 'Rejected', value: 'rejected' },
        { text: 'Sent', value: 'sent' },
        { text: 'Confirmed', value: 'confirmed' },
        { text: 'Cancelled', value: 'cancelled' },
        { text: 'Completed', value: 'completed' }
      ],
      render: (status) => {
        const colorMap = {
          draft: 'default',
          pending_approval: 'processing',
          approved: 'success',
          rejected: 'error',
          sent: 'blue',
          confirmed: 'cyan',
          cancelled: 'default',
          completed: 'green'
        };
        return <Tag color={colorMap[status]}>{status?.replace('_', ' ').toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 180,
      render: (_, record) => (
        <Space>
          <Tooltip title="View">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          {(record.status === 'draft' || record.status === 'rejected') && (
            <Tooltip title="Edit">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
          )}
          {record.status === 'draft' && (
            <Popconfirm
              title="Delete this purchase order?"
              onConfirm={() => handleDelete(record._id)}
            >
              <Tooltip title="Delete">
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
          <Dropdown overlay={getActionMenu(record)} trigger={['click']}>
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      )
    }
  ];

  const filterComponents = (
    <Row gutter={[16, 16]}>
      <Col span={6}>
        <Input
          placeholder="Search PO Number"
          prefix={<SearchOutlined />}
          onChange={(e) => setFilters({ ...filters, poNumber: e.target.value })}
        />
      </Col>
      <Col span={6}>
        <Select
          style={{ width: '100%' }}
          placeholder="Filter by Status"
          allowClear
          onChange={(value) => setFilters({ ...filters, status: value })}
        >
          <Option value="draft">Draft</Option>
          <Option value="pending_approval">Pending Approval</Option>
          <Option value="approved">Approved</Option>
          <Option value="rejected">Rejected</Option>
          <Option value="sent">Sent</Option>
          <Option value="confirmed">Confirmed</Option>
          <Option value="cancelled">Cancelled</Option>
          <Option value="completed">Completed</Option>
        </Select>
      </Col>
      <Col span={8}>
        <RangePicker
          style={{ width: '100%' }}
          onChange={(dates) => {
            if (dates) {
              setFilters({
                ...filters,
                orderDateFrom: dates[0]?.toISOString(),
                orderDateTo: dates[1]?.toISOString()
              });
            } else {
              const { orderDateFrom, orderDateTo, ...rest } = filters;
              setFilters(rest);
            }
          }}
        />
      </Col>
      <Col span={4}>
        <Space>
          <Button
            icon={<FileExcelOutlined />}
            onClick={() => handleExport('excel')}
          >
            Export
          </Button>
        </Space>
      </Col>
    </Row>
  );

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="Purchase Orders"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Create Purchase Order
          </Button>
        }
      >
        {filterComponents}
        <div style={{ marginTop: 16 }}>
          <DataTable
            entity="purchase-orders"
            columns={columns}
            refreshKey={refreshKey}
            filters={filters}
            scroll={{ x: 1400 }}
          />
        </div>
      </Card>

      <Modal
        title={currentRecord ? 'Edit Purchase Order' : 'Create Purchase Order'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={1200}
        destroyOnClose
      >
        <PurchaseOrderForm
          current={currentRecord}
          onSuccess={handleSuccess}
          onCancel={() => setModalVisible(false)}
        />
      </Modal>

      <Modal
        title="Purchase Order Details"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={null}
        width={1200}
        destroyOnClose
      >
        {currentRecord && (
          <PurchaseOrderForm
            current={currentRecord}
            onCancel={() => setViewModalVisible(false)}
          />
        )}
      </Modal>
    </div>
  );
};

export default PurchaseOrderModule;





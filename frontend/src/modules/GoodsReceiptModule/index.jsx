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
  Col,
  Descriptions,
  Table,
  Progress
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  MoreOutlined,
  SearchOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { request } from '@/request';
import DataTable from '@/components/DataTable/DataTable';
import GoodsReceiptForm from '@/forms/GoodsReceiptForm';

const { Option } = Select;
const { RangePicker } = DatePicker;

const GoodsReceiptModule = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [inspectionModalVisible, setInspectionModalVisible] = useState(false);
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
        entity: 'goods-receipts',
        id: record._id,
        options: {
          populate: 'purchaseOrder,supplier,items.material,createdBy'
        }
      });
      if (response.success) {
        setCurrentRecord(response.result);
        setViewModalVisible(true);
      }
    } catch (error) {
      message.error('Failed to load receipt details');
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await request.delete({
        entity: 'goods-receipts',
        id
      });
      if (response.success) {
        message.success('Receipt deleted successfully');
        setRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      message.error(error.message || 'Failed to delete receipt');
    }
  };

  const handleComplete = async (record) => {
    try {
      const response = await request.post({
        entity: 'goods-receipts',
        id: record._id,
        subEntity: 'complete'
      });
      if (response.success) {
        message.success('Receipt completed successfully');
        setRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      message.error(error.message || 'Failed to complete receipt');
    }
  };

  const handleCancel = async (record) => {
    Modal.confirm({
      title: 'Cancel Receipt',
      content: (
        <Input.TextArea
          placeholder="Please enter cancellation reason..."
          id="cancel-reason"
        />
      ),
      onOk: async () => {
        const reason = document.getElementById('cancel-reason').value;
        if (!reason) {
          message.error('Please provide a reason');
          return Promise.reject();
        }
        
        try {
          const response = await request.post({
            entity: 'goods-receipts',
            id: record._id,
            subEntity: 'cancel',
            jsonData: { reason }
          });
          if (response.success) {
            message.success('Receipt cancelled successfully');
            setRefreshKey(prev => prev + 1);
          }
        } catch (error) {
          message.error(error.message || 'Failed to cancel receipt');
        }
      }
    });
  };

  const handleQualityInspection = (record) => {
    setCurrentRecord(record);
    setInspectionModalVisible(true);
  };

  const handleExport = async () => {
    try {
      window.open(
        `${request.API_URL}/goods-receipts/export?${new URLSearchParams(filters)}`,
        '_blank'
      );
    } catch (error) {
      message.error('Failed to export data');
    }
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      draft: { color: 'default', text: 'Draft' },
      completed: { color: 'success', text: 'Completed' },
      cancelled: { color: 'error', text: 'Cancelled' }
    };
    const config = statusConfig[status] || statusConfig.draft;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getQualityTag = (result) => {
    if (!result) return <Tag color="default">Not Inspected</Tag>;
    const config = {
      pending: { color: 'default', text: 'Pending' },
      passed: { color: 'success', text: 'Passed' },
      failed: { color: 'error', text: 'Failed' },
      partial: { color: 'warning', text: 'Partial' }
    };
    const c = config[result] || config.pending;
    return <Tag color={c.color}>{c.text}</Tag>;
  };

  const columns = [
    {
      title: 'Receipt Number',
      dataIndex: 'receiptNumber',
      key: 'receiptNumber',
      width: 150,
      fixed: 'left',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'PO Number',
      dataIndex: 'poNumber',
      key: 'poNumber',
      width: 150
    },
    {
      title: 'Supplier',
      dataIndex: ['supplier', 'companyName'],
      key: 'supplier',
      width: 200,
      render: (name) => name?.en || name?.zh || 'N/A'
    },
    {
      title: 'Receipt Date',
      dataIndex: 'receiptDate',
      key: 'receiptDate',
      width: 120,
      render: (date) => dayjs(date).format('YYYY-MM-DD')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: getStatusTag
    },
    {
      title: 'Received/Accepted',
      key: 'quantities',
      width: 150,
      render: (_, record) => (
        <div>
          <div>Received: {record.totalReceived || 0}</div>
          <div style={{ color: '#52c41a' }}>Accepted: {record.totalAccepted || 0}</div>
          <div style={{ color: '#ff4d4f' }}>Rejected: {record.totalRejected || 0}</div>
        </div>
      )
    },
    {
      title: 'Acceptance Rate',
      key: 'acceptanceRate',
      width: 150,
      render: (_, record) => {
        const rate = record.acceptanceRate || 0;
        return (
          <div>
            <Progress
              percent={rate}
              size="small"
              status={rate >= 95 ? 'success' : rate >= 80 ? 'normal' : 'exception'}
            />
          </div>
        );
      }
    },
    {
      title: 'Quality Status',
      dataIndex: ['qualityInspection', 'result'],
      key: 'qualityStatus',
      width: 120,
      render: getQualityTag
    },
    {
      title: 'Created By',
      dataIndex: ['createdBy', 'name'],
      key: 'createdBy',
      width: 120
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => {
        const menu = (
          <Menu>
            <Menu.Item
              key="view"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            >
              View Details
            </Menu.Item>
            {record.status === 'draft' && (
              <>
                <Menu.Item
                  key="edit"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                >
                  Edit
                </Menu.Item>
                {record.qualityInspection?.required && (
                  <Menu.Item
                    key="inspect"
                    icon={<SafetyOutlined />}
                    onClick={() => handleQualityInspection(record)}
                  >
                    Quality Inspection
                  </Menu.Item>
                )}
                <Menu.Item
                  key="complete"
                  icon={<CheckOutlined />}
                  onClick={() => handleComplete(record)}
                >
                  Complete
                </Menu.Item>
                <Menu.Item
                  key="cancel"
                  icon={<CloseOutlined />}
                  onClick={() => handleCancel(record)}
                >
                  Cancel
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  key="delete"
                  icon={<DeleteOutlined />}
                  danger
                  onClick={() => {
                    Modal.confirm({
                      title: 'Delete Receipt',
                      content: 'Are you sure you want to delete this receipt?',
                      onOk: () => handleDelete(record._id)
                    });
                  }}
                >
                  Delete
                </Menu.Item>
              </>
            )}
            <Menu.Divider />
            <Menu.Item key="pdf" icon={<FilePdfOutlined />}>
              Generate PDF
            </Menu.Item>
          </Menu>
        );

        return (
          <Dropdown overlay={menu} trigger={['click']}>
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        );
      }
    }
  ];

  const searchFields = (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={8}>
        <Input
          placeholder="Search by receipt or PO number"
          prefix={<SearchOutlined />}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          allowClear
        />
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Select
          placeholder="Status"
          style={{ width: '100%' }}
          onChange={(value) => setFilters({ ...filters, status: value })}
          allowClear
        >
          <Option value="draft">Draft</Option>
          <Option value="completed">Completed</Option>
          <Option value="cancelled">Cancelled</Option>
        </Select>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Select
          placeholder="Quality Status"
          style={{ width: '100%' }}
          onChange={(value) => setFilters({ ...filters, qualityStatus: value })}
          allowClear
        >
          <Option value="pending">Pending</Option>
          <Option value="passed">Passed</Option>
          <Option value="failed">Failed</Option>
          <Option value="partial">Partial</Option>
        </Select>
      </Col>
      <Col xs={24} sm={12} md={4}>
        <Button
          type="primary"
          icon={<FileExcelOutlined />}
          onClick={handleExport}
          block
        >
          Export
        </Button>
      </Col>
    </Row>
  );

  return (
    <div>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h2>Goods Receipts</h2>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
              size="large"
            >
              New Receipt
            </Button>
          </div>

          {searchFields}

          <DataTable
            entity="goods-receipts"
            columns={columns}
            refreshKey={refreshKey}
            filters={filters}
            scroll={{ x: 1600 }}
          />
        </Space>
      </Card>

      <Modal
        title={currentRecord ? 'Edit Goods Receipt' : 'New Goods Receipt'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={1200}
        destroyOnClose
      >
        <GoodsReceiptForm
          current={currentRecord}
          onSuccess={() => {
            setModalVisible(false);
            setRefreshKey(prev => prev + 1);
          }}
          onCancel={() => setModalVisible(false)}
        />
      </Modal>

      <Modal
        title="Receipt Details"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>
        ]}
        width={1000}
      >
        {currentRecord && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Receipt Number">
                {currentRecord.receiptNumber}
              </Descriptions.Item>
              <Descriptions.Item label="PO Number">
                {currentRecord.poNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Supplier">
                {currentRecord.supplier?.companyName?.en || currentRecord.supplier?.companyName?.zh}
              </Descriptions.Item>
              <Descriptions.Item label="Receipt Date">
                {dayjs(currentRecord.receiptDate).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {getStatusTag(currentRecord.status)}
              </Descriptions.Item>
              <Descriptions.Item label="Quality Status">
                {getQualityTag(currentRecord.qualityInspection?.result)}
              </Descriptions.Item>
              <Descriptions.Item label="Total Received">
                {currentRecord.totalReceived || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Total Accepted">
                {currentRecord.totalAccepted || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Total Rejected">
                {currentRecord.totalRejected || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Acceptance Rate">
                <Progress percent={currentRecord.acceptanceRate || 0} size="small" />
              </Descriptions.Item>
              <Descriptions.Item label="Created By">
                {currentRecord.createdBy?.name || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Created At">
                {dayjs(currentRecord.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>

            <h3 style={{ marginTop: 24, marginBottom: 16 }}>Items</h3>
            <Table
              dataSource={currentRecord.items}
              size="small"
              pagination={false}
              columns={[
                {
                  title: 'Material',
                  render: (_, record) => (
                    <div>
                      <div>{record.materialName?.en || record.materialName?.zh}</div>
                      <div style={{ fontSize: '12px', color: '#888' }}>
                        {record.materialNumber}
                      </div>
                    </div>
                  )
                },
                { title: 'Ordered', dataIndex: 'orderedQuantity', align: 'center' },
                { title: 'Received', dataIndex: 'receivedQuantity', align: 'center' },
                { title: 'Accepted', dataIndex: 'acceptedQuantity', align: 'center' },
                { title: 'Rejected', dataIndex: 'rejectedQuantity', align: 'center' },
                { title: 'UOM', dataIndex: 'uom', align: 'center' },
                { title: 'Batch #', dataIndex: 'batchNumber' },
                {
                  title: 'Expiry',
                  dataIndex: 'expiryDate',
                  render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : 'N/A'
                },
                { title: 'Location', dataIndex: 'storageLocation' }
              ]}
            />

            {currentRecord.notes && (
              <>
                <h3 style={{ marginTop: 24, marginBottom: 16 }}>Notes</h3>
                <p>{currentRecord.notes}</p>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default GoodsReceiptModule;



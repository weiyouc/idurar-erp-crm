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
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Descriptions,
  Table,
  Progress,
  Statistic
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
  DollarOutlined,
  ShoppingCartOutlined,
  SwapOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { request } from '@/request';
import DataTable from '@/components/DataTable/DataTable';
import MaterialQuotationForm from '@/forms/MaterialQuotationForm';

const { Option } = Select;

const MaterialQuotationModule = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [compareModalVisible, setCompareModalVisible] = useState(false);
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
        entity: 'material-quotations',
        id: record._id,
        options: {
          populate: 'targetSuppliers,items.material,items.quotes.supplier,createdBy'
        }
      });
      if (response.success) {
        setCurrentRecord(response.result);
        setViewModalVisible(true);
      }
    } catch (error) {
      message.error('Failed to load quotation details');
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await request.delete({
        entity: 'material-quotations',
        id
      });
      if (response.success) {
        message.success('Quotation deleted successfully');
        setRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      message.error(error.message || 'Failed to delete quotation');
    }
  };

  const handleSend = async (record) => {
    try {
      const response = await request.post({
        entity: 'material-quotations',
        id: record._id,
        subEntity: 'send'
      });
      if (response.success) {
        message.success('Quotation sent to suppliers successfully');
        setRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      message.error(error.message || 'Failed to send quotation');
    }
  };

  const handleComplete = async (record) => {
    try {
      const response = await request.post({
        entity: 'material-quotations',
        id: record._id,
        subEntity: 'complete'
      });
      if (response.success) {
        message.success('Quotation completed successfully');
        setRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      message.error(error.message || 'Failed to complete quotation');
    }
  };

  const handleCancel = async (record) => {
    Modal.confirm({
      title: 'Cancel Quotation',
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
            entity: 'material-quotations',
            id: record._id,
            subEntity: 'cancel',
            jsonData: { reason }
          });
          if (response.success) {
            message.success('Quotation cancelled successfully');
            setRefreshKey(prev => prev + 1);
          }
        } catch (error) {
          message.error(error.message || 'Failed to cancel quotation');
        }
      }
    });
  };

  const handleConvertToPO = async (record) => {
    Modal.confirm({
      title: 'Convert to Purchase Orders',
      content: 'This will create purchase orders based on selected quotes. Continue?',
      onOk: async () => {
        try {
          const response = await request.post({
            entity: 'material-quotations',
            id: record._id,
            subEntity: 'convert-to-po'
          });
          if (response.success) {
            message.success(`Created ${response.purchaseOrders?.length || 0} purchase order(s)`);
            setRefreshKey(prev => prev + 1);
          }
        } catch (error) {
          message.error(error.message || 'Failed to convert to PO');
        }
      }
    });
  };

  const handleCompare = async (record) => {
    try {
      const response = await request.read({
        entity: 'material-quotations',
        id: record._id,
        options: {
          populate: 'items.material,items.quotes.supplier'
        }
      });
      if (response.success) {
        setCurrentRecord(response.result);
        setCompareModalVisible(true);
      }
    } catch (error) {
      message.error('Failed to load quote comparison');
    }
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      draft: { color: 'default', text: 'Draft' },
      sent: { color: 'processing', text: 'Sent' },
      in_review: { color: 'warning', text: 'In Review' },
      completed: { color: 'success', text: 'Completed' },
      cancelled: { color: 'error', text: 'Cancelled' }
    };
    const config = statusConfig[status] || statusConfig.draft;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: 'Quotation Number',
      dataIndex: 'quotationNumber',
      key: 'quotationNumber',
      width: 150,
      fixed: 'left',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Title',
      dataIndex: ['title', 'en'],
      key: 'title',
      width: 200,
      render: (en, record) => en || record.title?.zh || 'N/A'
    },
    {
      title: 'Request Date',
      dataIndex: 'requestDate',
      key: 'requestDate',
      width: 120,
      render: (date) => dayjs(date).format('YYYY-MM-DD')
    },
    {
      title: 'Deadline',
      dataIndex: 'responseDeadline',
      key: 'responseDeadline',
      width: 120,
      render: (date) => {
        const isOverdue = dayjs(date).isBefore(dayjs());
        return (
          <span style={{ color: isOverdue ? '#ff4d4f' : undefined }}>
            {dayjs(date).format('YYYY-MM-DD')}
          </span>
        );
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: getStatusTag
    },
    {
      title: 'Suppliers',
      dataIndex: 'targetSuppliers',
      key: 'targetSuppliers',
      width: 120,
      render: (suppliers) => (
        <Tag color="blue">{suppliers?.length || 0} Suppliers</Tag>
      )
    },
    {
      title: 'Responses',
      key: 'responses',
      width: 120,
      render: (_, record) => {
        const responseCount = record.responseCount || 0;
        const targetCount = record.targetSuppliers?.length || 0;
        const percentage = targetCount > 0 ? (responseCount / targetCount) * 100 : 0;
        return (
          <div>
            <div>{responseCount} / {targetCount}</div>
            <Progress percent={Math.round(percentage)} size="small" />
          </div>
        );
      }
    },
    {
      title: 'Total Value',
      dataIndex: ['selectedQuotes', 'totalValue'],
      key: 'totalValue',
      width: 120,
      align: 'right',
      render: (val) => val ? `$${val.toFixed(2)}` : 'N/A'
    },
    {
      title: 'Savings',
      dataIndex: ['selectedQuotes', 'averageSavings'],
      key: 'savings',
      width: 100,
      align: 'right',
      render: (val) => {
        if (!val) return 'N/A';
        return (
          <span style={{ color: val > 0 ? '#52c41a' : undefined }}>
            {val > 0 ? '+' : ''}{val.toFixed(1)}%
          </span>
        );
      }
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
                <Menu.Item
                  key="send"
                  icon={<SendOutlined />}
                  onClick={() => handleSend(record)}
                >
                  Send to Suppliers
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  key="delete"
                  icon={<DeleteOutlined />}
                  danger
                  onClick={() => {
                    Modal.confirm({
                      title: 'Delete Quotation',
                      content: 'Are you sure you want to delete this quotation?',
                      onOk: () => handleDelete(record._id)
                    });
                  }}
                >
                  Delete
                </Menu.Item>
              </>
            )}
            {(record.status === 'sent' || record.status === 'in_review') && (
              <>
                <Menu.Item
                  key="compare"
                  icon={<SwapOutlined />}
                  onClick={() => handleCompare(record)}
                >
                  Compare Quotes
                </Menu.Item>
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
              </>
            )}
            {record.status === 'completed' && (
              <Menu.Item
                key="convert"
                icon={<ShoppingCartOutlined />}
                onClick={() => handleConvertToPO(record)}
              >
                Convert to PO
              </Menu.Item>
            )}
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
          placeholder="Search by quotation number"
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
          <Option value="sent">Sent</Option>
          <Option value="in_review">In Review</Option>
          <Option value="completed">Completed</Option>
          <Option value="cancelled">Cancelled</Option>
        </Select>
      </Col>
    </Row>
  );

  return (
    <div>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h2>Material Quotations</h2>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
              size="large"
            >
              New Quotation
            </Button>
          </div>

          {searchFields}

          <DataTable
            entity="material-quotations"
            columns={columns}
            refreshKey={refreshKey}
            filters={filters}
            scroll={{ x: 1600 }}
          />
        </Space>
      </Card>

      <Modal
        title={currentRecord ? 'Edit Material Quotation' : 'New Material Quotation'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={1200}
        destroyOnClose
      >
        <MaterialQuotationForm
          current={currentRecord}
          onSuccess={() => {
            setModalVisible(false);
            setRefreshKey(prev => prev + 1);
          }}
          onCancel={() => setModalVisible(false)}
        />
      </Modal>

      <Modal
        title="Quotation Details"
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
              <Descriptions.Item label="Quotation Number">
                {currentRecord.quotationNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Title">
                {currentRecord.title?.en || currentRecord.title?.zh}
              </Descriptions.Item>
              <Descriptions.Item label="Request Date">
                {dayjs(currentRecord.requestDate).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="Response Deadline">
                {dayjs(currentRecord.responseDeadline).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {getStatusTag(currentRecord.status)}
              </Descriptions.Item>
              <Descriptions.Item label="Target Suppliers">
                <Tag color="blue">{currentRecord.targetSuppliers?.length || 0}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Responses">
                {currentRecord.responseCount || 0} / {currentRecord.targetSuppliers?.length || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Completion">
                <Progress percent={currentRecord.completionPercentage || 0} size="small" />
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
                { title: 'Quantity', dataIndex: 'quantity', align: 'center' },
                { title: 'UOM', dataIndex: 'uom', align: 'center' },
                {
                  title: 'Target Price',
                  dataIndex: 'targetPrice',
                  align: 'right',
                  render: (val) => val ? `$${val.toFixed(2)}` : 'N/A'
                },
                {
                  title: 'Quotes',
                  dataIndex: 'quotes',
                  align: 'center',
                  render: (quotes) => <Tag color={quotes?.length > 0 ? 'success' : 'default'}>{quotes?.length || 0}</Tag>
                }
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

      <Modal
        title="Quote Comparison"
        open={compareModalVisible}
        onCancel={() => setCompareModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setCompareModalVisible(false)}>
            Close
          </Button>
        ]}
        width={1200}
      >
        {currentRecord?.items?.map((item, index) => (
          <Card key={index} title={`${item.materialName?.en || item.materialName?.zh}`} style={{ marginBottom: 16 }}>
            <Table
              dataSource={item.quotes || []}
              size="small"
              pagination={false}
              columns={[
                {
                  title: 'Rank',
                  dataIndex: 'rank',
                  key: 'rank',
                  width: 60,
                  align: 'center',
                  render: (rank) => <Tag color={rank === 1 ? 'gold' : rank === 2 ? 'silver' : 'default'}>{rank}</Tag>
                },
                {
                  title: 'Supplier',
                  render: (_, record) => record.supplierName?.en || record.supplierName?.zh
                },
                {
                  title: 'Unit Price',
                  dataIndex: 'unitPrice',
                  align: 'right',
                  render: (val) => `$${val.toFixed(2)}`
                },
                {
                  title: 'Total Price',
                  dataIndex: 'totalPrice',
                  align: 'right',
                  render: (val) => `$${val.toFixed(2)}`
                },
                {
                  title: 'Lead Time',
                  dataIndex: 'leadTime',
                  align: 'center',
                  render: (val) => val ? `${val} days` : 'N/A'
                },
                {
                  title: 'MOQ',
                  dataIndex: 'moq',
                  align: 'center'
                },
                {
                  title: 'Valid Until',
                  dataIndex: 'validUntil',
                  render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : 'N/A'
                },
                {
                  title: 'Selected',
                  dataIndex: 'isSelected',
                  align: 'center',
                  render: (selected) => selected ? <CheckOutlined style={{ color: '#52c41a' }} /> : null
                }
              ]}
            />
          </Card>
        ))}
      </Modal>
    </div>
  );
};

export default MaterialQuotationModule;



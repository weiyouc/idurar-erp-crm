import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Button,
  Row,
  Col,
  Card,
  Table,
  Space,
  message,
  Divider,
  Tag,
  Tabs,
  Upload,
  Switch
} from 'antd';
import {
  SaveOutlined,
  CloseOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { request } from '@/request';

const { TextArea } = Input;
const { Option } = Select;

const GoodsReceiptForm = ({ current, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [items, setItems] = useState([]);
  const [qualityInspectionRequired, setQualityInspectionRequired] = useState(false);

  useEffect(() => {
    fetchPurchaseOrders();
    
    if (current) {
      initializeForm(current);
    } else {
      // Set default receipt date to today
      form.setFieldsValue({
        receiptDate: dayjs()
      });
    }
  }, [current]);

  const fetchPurchaseOrders = async () => {
    try {
      const response = await request.list({ 
        entity: 'purchase-orders',
        options: {
          filter: { status: 'approved' }
        }
      });
      if (response.success) {
        setPurchaseOrders(response.result);
      }
    } catch (error) {
      message.error('Failed to load purchase orders');
    }
  };

  const handlePOSelect = async (poId) => {
    try {
      const response = await request.read({
        entity: 'purchase-orders',
        id: poId
      });
      
      if (response.success) {
        const po = response.result;
        setSelectedPO(po);
        
        // Initialize items from PO
        const receiptItems = po.items.map(item => ({
          material: item.material._id || item.material,
          materialNumber: item.material.materialNumber || item.materialNumber,
          materialName: item.material.materialName || item.materialName,
          orderedQuantity: item.quantity,
          receivedQuantity: 0,
          acceptedQuantity: 0,
          rejectedQuantity: 0,
          uom: item.uom,
          batchNumber: '',
          expiryDate: null,
          qualityStatus: 'pending',
          inspectionNotes: '',
          storageLocation: ''
        }));
        
        setItems(receiptItems);
      }
    } catch (error) {
      message.error('Failed to load purchase order details');
    }
  };

  const initializeForm = (data) => {
    form.setFieldsValue({
      ...data,
      receiptDate: data.receiptDate ? dayjs(data.receiptDate) : dayjs(),
      purchaseOrder: data.purchaseOrder?._id || data.purchaseOrder
    });
    
    if (data.items) {
      setItems(data.items.map(item => ({
        ...item,
        expiryDate: item.expiryDate ? dayjs(item.expiryDate) : null
      })));
    }
    
    if (data.qualityInspection) {
      setQualityInspectionRequired(data.qualityInspection.required);
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    // Auto-calculate accepted/rejected based on received
    if (field === 'receivedQuantity') {
      if (!qualityInspectionRequired) {
        newItems[index].acceptedQuantity = value;
        newItems[index].rejectedQuantity = 0;
        newItems[index].qualityStatus = 'passed';
      }
    }
    
    // Update quality status based on accepted/rejected
    if (field === 'acceptedQuantity' || field === 'rejectedQuantity') {
      const received = newItems[index].receivedQuantity || 0;
      const accepted = newItems[index].acceptedQuantity || 0;
      const rejected = newItems[index].rejectedQuantity || 0;
      
      if (accepted + rejected > received) {
        message.warning('Accepted + Rejected cannot exceed Received quantity');
        return;
      }
      
      if (received > 0) {
        if (rejected === 0) {
          newItems[index].qualityStatus = 'passed';
        } else if (accepted === 0) {
          newItems[index].qualityStatus = 'failed';
        } else {
          newItems[index].qualityStatus = 'partial';
        }
      }
    }
    
    setItems(newItems);
  };

  const handleSubmit = async (values) => {
    // Validate items
    if (items.length === 0) {
      message.error('Please add at least one item');
      return;
    }
    
    const hasReceivedItems = items.some(item => (item.receivedQuantity || 0) > 0);
    if (!hasReceivedItems) {
      message.error('Please enter received quantity for at least one item');
      return;
    }
    
    setLoading(true);
    
    try {
      const submitData = {
        ...values,
        receiptDate: values.receiptDate.toISOString(),
        items: items.map(item => ({
          ...item,
          expiryDate: item.expiryDate ? item.expiryDate.toISOString() : null
        })),
        qualityInspection: {
          required: qualityInspectionRequired
        }
      };
      
      let response;
      if (current) {
        response = await request.update({
          entity: 'goods-receipts',
          id: current._id,
          jsonData: submitData
        });
      } else {
        response = await request.create({
          entity: 'goods-receipts',
          jsonData: submitData
        });
      }
      
      if (response.success) {
        message.success(`Goods receipt ${current ? 'updated' : 'created'} successfully`);
        onSuccess && onSuccess();
      } else {
        message.error(response.message || 'Operation failed');
      }
    } catch (error) {
      message.error(error.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const itemColumns = [
    {
      title: 'Material',
      dataIndex: 'materialName',
      key: 'materialName',
      width: 200,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {text?.en || text?.zh || 'N/A'}
          </div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            {record.materialNumber}
          </div>
        </div>
      )
    },
    {
      title: 'Ordered',
      dataIndex: 'orderedQuantity',
      key: 'orderedQuantity',
      width: 80,
      align: 'center',
      render: (val, record) => `${val} ${record.uom}`
    },
    {
      title: 'Received',
      dataIndex: 'receivedQuantity',
      key: 'receivedQuantity',
      width: 120,
      render: (val, record, index) => (
        <InputNumber
          min={0}
          max={record.orderedQuantity * 1.1} // Allow 10% over-delivery
          value={val}
          onChange={(value) => handleItemChange(index, 'receivedQuantity', value)}
          style={{ width: '100%' }}
          disabled={current?.status !== 'draft'}
        />
      )
    },
    {
      title: 'Accepted',
      dataIndex: 'acceptedQuantity',
      key: 'acceptedQuantity',
      width: 120,
      render: (val, record, index) => (
        <InputNumber
          min={0}
          max={record.receivedQuantity || 0}
          value={val}
          onChange={(value) => handleItemChange(index, 'acceptedQuantity', value)}
          style={{ width: '100%' }}
          disabled={!qualityInspectionRequired || current?.status !== 'draft'}
        />
      )
    },
    {
      title: 'Rejected',
      dataIndex: 'rejectedQuantity',
      key: 'rejectedQuantity',
      width: 120,
      render: (val, record, index) => (
        <InputNumber
          min={0}
          max={record.receivedQuantity || 0}
          value={val}
          onChange={(value) => handleItemChange(index, 'rejectedQuantity', value)}
          style={{ width: '100%' }}
          disabled={!qualityInspectionRequired || current?.status !== 'draft'}
        />
      )
    },
    {
      title: 'Quality',
      dataIndex: 'qualityStatus',
      key: 'qualityStatus',
      width: 100,
      align: 'center',
      render: (status) => {
        const statusConfig = {
          pending: { color: 'default', text: 'Pending' },
          passed: { color: 'success', text: 'Passed', icon: <CheckCircleOutlined /> },
          failed: { color: 'error', text: 'Failed', icon: <CloseCircleOutlined /> },
          partial: { color: 'warning', text: 'Partial' }
        };
        const config = statusConfig[status] || statusConfig.pending;
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      }
    },
    {
      title: 'Batch Number',
      dataIndex: 'batchNumber',
      key: 'batchNumber',
      width: 150,
      render: (val, record, index) => (
        <Input
          value={val}
          onChange={(e) => handleItemChange(index, 'batchNumber', e.target.value)}
          placeholder="Batch #"
          disabled={current?.status !== 'draft'}
        />
      )
    },
    {
      title: 'Expiry Date',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      width: 150,
      render: (val, record, index) => (
        <DatePicker
          value={val}
          onChange={(date) => handleItemChange(index, 'expiryDate', date)}
          format="YYYY-MM-DD"
          style={{ width: '100%' }}
          disabled={current?.status !== 'draft'}
        />
      )
    },
    {
      title: 'Storage Location',
      dataIndex: 'storageLocation',
      key: 'storageLocation',
      width: 150,
      render: (val, record, index) => (
        <Input
          value={val}
          onChange={(e) => handleItemChange(index, 'storageLocation', e.target.value)}
          placeholder="Location"
          disabled={current?.status !== 'draft'}
        />
      )
    }
  ];

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        receiptDate: dayjs(),
        status: 'draft'
      }}
    >
      <Tabs defaultActiveKey="1">
        <Tabs.TabPane tab="Basic Information" key="1">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="purchaseOrder"
                label="Purchase Order"
                rules={[{ required: true, message: 'Please select a purchase order' }]}
              >
                <Select
                  showSearch
                  placeholder="Select PO"
                  optionFilterProp="children"
                  onChange={handlePOSelect}
                  disabled={current}
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {purchaseOrders.map(po => (
                    <Option key={po._id} value={po._id}>
                      {po.poNumber} - {po.supplier?.companyName?.en || po.supplier?.companyName?.zh}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="receiptDate"
                label="Receipt Date"
                rules={[{ required: true, message: 'Please select receipt date' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD"
                  disabled={current?.status !== 'draft'}
                />
              </Form.Item>
            </Col>
          </Row>

          {selectedPO && (
            <Card size="small" style={{ marginBottom: 16, background: '#f5f5f5' }}>
              <Row gutter={16}>
                <Col span={8}>
                  <strong>Supplier:</strong> {selectedPO.supplier?.companyName?.en || selectedPO.supplier?.companyName?.zh}
                </Col>
                <Col span={8}>
                  <strong>PO Number:</strong> {selectedPO.poNumber}
                </Col>
                <Col span={8}>
                  <strong>Total Amount:</strong> ${selectedPO.totalAmount?.toFixed(2)}
                </Col>
              </Row>
            </Card>
          )}

          <Form.Item label="Quality Inspection Required">
            <Switch
              checked={qualityInspectionRequired}
              onChange={setQualityInspectionRequired}
              checkedChildren="Yes"
              unCheckedChildren="No"
              disabled={current?.status !== 'draft'}
            />
          </Form.Item>
        </Tabs.TabPane>

        <Tabs.TabPane tab="Items" key="2">
          <Table
            dataSource={items}
            columns={itemColumns}
            rowKey={(record, index) => index}
            pagination={false}
            scroll={{ x: 1400 }}
            size="small"
          />
        </Tabs.TabPane>

        <Tabs.TabPane tab="Additional Information" key="3">
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="notes"
                label="Notes"
              >
                <TextArea
                  rows={4}
                  placeholder="Enter any additional notes..."
                  disabled={current?.status !== 'draft'}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Delivery Note">
                <Input
                  placeholder="Delivery note number"
                  disabled={current?.status !== 'draft'}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Warehouse Location">
                <Input
                  placeholder="Default storage location"
                  disabled={current?.status !== 'draft'}
                />
              </Form.Item>
            </Col>
          </Row>
        </Tabs.TabPane>
      </Tabs>

      <Divider />

      <Space style={{ float: 'right' }}>
        <Button onClick={onCancel} icon={<CloseOutlined />}>
          Cancel
        </Button>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          icon={<SaveOutlined />}
          disabled={current?.status !== 'draft' && current}
        >
          {current ? 'Update' : 'Create'} Receipt
        </Button>
      </Space>
    </Form>
  );
};

export default GoodsReceiptForm;



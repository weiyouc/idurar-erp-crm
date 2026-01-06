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
  Popconfirm
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { request } from '@/request';

const { TextArea } = Input;
const { Option } = Select;

const PurchaseOrderForm = ({ current, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  useEffect(() => {
    fetchSuppliers();
    fetchMaterials();
    
    if (current) {
      initializeForm(current);
    }
  }, [current]);

  const fetchSuppliers = async () => {
    try {
      const response = await request.list({ entity: 'suppliers' });
      if (response.success) {
        setSuppliers(response.result);
      }
    } catch (error) {
      message.error('Failed to load suppliers');
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await request.list({ entity: 'materials' });
      if (response.success) {
        setMaterials(response.result);
      }
    } catch (error) {
      message.error('Failed to load materials');
    }
  };

  const initializeForm = (data) => {
    form.setFieldsValue({
      ...data,
      orderDate: data.orderDate ? moment(data.orderDate) : null,
      expectedDeliveryDate: data.expectedDeliveryDate ? moment(data.expectedDeliveryDate) : null,
      supplier: data.supplier?._id || data.supplier
    });
    
    if (data.items) {
      setItems(data.items.map((item, index) => ({
        ...item,
        key: index,
        material: item.material?._id || item.material
      })));
    }
    
    if (data.supplier) {
      const supplier = typeof data.supplier === 'object' ? data.supplier : 
        suppliers.find(s => s._id === data.supplier);
      setSelectedSupplier(supplier);
    }
  };

  const handleSupplierChange = (supplierId) => {
    const supplier = suppliers.find(s => s._id === supplierId);
    setSelectedSupplier(supplier);
    
    // Auto-fill payment terms from supplier if available
    if (supplier?.paymentTerms) {
      form.setFieldsValue({ paymentTerms: supplier.paymentTerms });
    }
  };

  const handleAddItem = () => {
    const newItem = {
      key: items.length,
      material: null,
      quantity: 1,
      unitPrice: 0,
      uom: 'pcs',
      totalPrice: 0
    };
    setItems([...items, newItem]);
  };

  const handleItemChange = (key, field, value) => {
    const newItems = items.map(item => {
      if (item.key === key) {
        const updated = { ...item, [field]: value };
        
        // Auto-calculate total price
        if (field === 'quantity' || field === 'unitPrice') {
          updated.totalPrice = (updated.quantity || 0) * (updated.unitPrice || 0);
        }
        
        // Auto-fill UOM from material if available
        if (field === 'material' && value) {
          const material = materials.find(m => m._id === value);
          if (material) {
            updated.uom = material.baseUOM || 'pcs';
            updated.unitPrice = material.lastPurchasePrice || 0;
            updated.totalPrice = updated.quantity * updated.unitPrice;
          }
        }
        
        return updated;
      }
      return item;
    });
    
    setItems(newItems);
    updateTotalAmount(newItems);
  };

  const handleDeleteItem = (key) => {
    const newItems = items.filter(item => item.key !== key);
    setItems(newItems);
    updateTotalAmount(newItems);
  };

  const updateTotalAmount = (itemsList) => {
    const total = itemsList.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    form.setFieldsValue({ totalAmount: total });
  };

  const handleSubmit = async (values) => {
    if (items.length === 0) {
      message.error('Please add at least one item');
      return;
    }

    setLoading(true);
    try {
      const poData = {
        ...values,
        orderDate: values.orderDate?.toISOString(),
        expectedDeliveryDate: values.expectedDeliveryDate?.toISOString(),
        items: items.map(item => ({
          material: item.material,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          uom: item.uom
        }))
      };

      let response;
      if (current?._id) {
        response = await request.update({
          entity: 'purchase-orders',
          id: current._id,
          jsonData: poData
        });
      } else {
        response = await request.create({
          entity: 'purchase-orders',
          jsonData: poData
        });
      }

      if (response.success) {
        message.success(`Purchase order ${current?._id ? 'updated' : 'created'} successfully`);
        onSuccess && onSuccess(response.result);
      }
    } catch (error) {
      message.error(error.message || 'Failed to save purchase order');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Material',
      dataIndex: 'material',
      key: 'material',
      width: '30%',
      render: (value, record) => (
        <Select
          showSearch
          style={{ width: '100%' }}
          placeholder="Select material"
          value={value}
          onChange={(val) => handleItemChange(record.key, 'material', val)}
          filterOption={(input, option) =>
            option.children.toLowerCase().includes(input.toLowerCase())
          }
        >
          {materials.map(material => (
            <Option key={material._id} value={material._id}>
              {material.materialNumber} - {material.materialName?.en || material.materialName?.zh}
            </Option>
          ))}
        </Select>
      )
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: '15%',
      render: (value, record) => (
        <InputNumber
          min={0.01}
          value={value}
          onChange={(val) => handleItemChange(record.key, 'quantity', val)}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: 'UOM',
      dataIndex: 'uom',
      key: 'uom',
      width: '10%',
      render: (value, record) => (
        <Input
          value={value}
          onChange={(e) => handleItemChange(record.key, 'uom', e.target.value)}
        />
      )
    },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: '15%',
      render: (value, record) => (
        <InputNumber
          min={0}
          precision={2}
          value={value}
          onChange={(val) => handleItemChange(record.key, 'unitPrice', val)}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: 'Total Price',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: '15%',
      render: (value) => value?.toFixed(2) || '0.00'
    },
    {
      title: 'Action',
      key: 'action',
      width: '10%',
      render: (_, record) => (
        <Popconfirm
          title="Delete this item?"
          onConfirm={() => handleDeleteItem(record.key)}
        >
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      )
    }
  ];

  const isReadOnly = current && ['approved', 'sent', 'confirmed', 'completed', 'cancelled'].includes(current.status);

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        currency: 'USD',
        status: 'draft',
        orderDate: moment(),
        expectedDeliveryDate: moment().add(7, 'days')
      }}
    >
      {current?.poNumber && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <strong>PO Number:</strong> {current.poNumber}
            </Col>
            <Col span={8}>
              <strong>Status:</strong>{' '}
              <Tag color={
                current.status === 'approved' ? 'green' :
                current.status === 'rejected' ? 'red' :
                current.status === 'cancelled' ? 'default' :
                'blue'
              }>
                {current.status?.toUpperCase()}
              </Tag>
            </Col>
            {current.totalAmount && (
              <Col span={8}>
                <strong>Total Amount:</strong> {current.currency} {current.totalAmount?.toFixed(2)}
              </Col>
            )}
          </Row>
        </Card>
      )}

      <Card title="Basic Information" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="supplier"
              label="Supplier"
              rules={[{ required: true, message: 'Please select a supplier' }]}
            >
              <Select
                showSearch
                placeholder="Select supplier"
                onChange={handleSupplierChange}
                disabled={isReadOnly}
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
              >
                {suppliers.map(supplier => (
                  <Option key={supplier._id} value={supplier._id}>
                    {supplier.supplierNumber} - {supplier.companyName?.en || supplier.companyName?.zh}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="orderDate"
              label="Order Date"
              rules={[{ required: true, message: 'Please select order date' }]}
            >
              <DatePicker style={{ width: '100%' }} disabled={isReadOnly} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="expectedDeliveryDate"
              label="Expected Delivery Date"
              rules={[{ required: true, message: 'Please select delivery date' }]}
            >
              <DatePicker style={{ width: '100%' }} disabled={isReadOnly} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="currency"
              label="Currency"
              rules={[{ required: true }]}
            >
              <Select disabled={isReadOnly}>
                <Option value="USD">USD</Option>
                <Option value="CNY">CNY</Option>
                <Option value="EUR">EUR</Option>
                <Option value="JPY">JPY</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="paymentTerms" label="Payment Terms">
              <Input placeholder="e.g. Net 30" disabled={isReadOnly} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="totalAmount" label="Total Amount">
              <InputNumber style={{ width: '100%' }} disabled precision={2} />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card 
        title="Items"
        extra={
          !isReadOnly && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleAddItem}
            >
              Add Item
            </Button>
          )
        }
        style={{ marginBottom: 16 }}
      >
        <Table
          columns={columns}
          dataSource={items}
          pagination={false}
          size="small"
        />
      </Card>

      <Card title="Additional Information">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="shippingAddress" label="Shipping Address">
              <TextArea rows={3} disabled={isReadOnly} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="notes" label="Notes">
              <TextArea rows={3} disabled={isReadOnly} />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {!isReadOnly && (
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Space>
            <Button onClick={onCancel} icon={<CloseOutlined />}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<SaveOutlined />}
            >
              {current?._id ? 'Update' : 'Create'} Purchase Order
            </Button>
          </Space>
        </div>
      )}
    </Form>
  );
};

export default PurchaseOrderForm;





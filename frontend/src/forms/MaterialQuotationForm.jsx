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
  Tabs
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined,
  MinusCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { request } from '@/request';

const { TextArea } = Input;
const { Option } = Select;

const MaterialQuotationForm = ({ current, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);

  useEffect(() => {
    fetchSuppliers();
    fetchMaterials();
    
    if (current) {
      initializeForm(current);
    } else {
      // Set default dates
      form.setFieldsValue({
        requestDate: dayjs(),
        responseDeadline: dayjs().add(7, 'days')
      });
    }
  }, [current]);

  const fetchSuppliers = async () => {
    try {
      const response = await request.list({ 
        entity: 'suppliers',
        options: {
          filter: { status: 'active' }
        }
      });
      if (response.success) {
        setSuppliers(response.result);
      }
    } catch (error) {
      message.error('Failed to load suppliers');
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await request.list({ 
        entity: 'materials',
        options: {
          filter: { status: 'active' }
        }
      });
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
      requestDate: data.requestDate ? dayjs(data.requestDate) : dayjs(),
      responseDeadline: data.responseDeadline ? dayjs(data.responseDeadline) : dayjs().add(7, 'days'),
      validUntil: data.validUntil ? dayjs(data.validUntil) : null,
      targetSuppliers: data.targetSuppliers?.map(s => s._id || s) || []
    });
    
    if (data.items) {
      setItems(data.items.map(item => ({
        ...item,
        material: item.material._id || item.material,
        materialNumber: item.material?.materialNumber || item.materialNumber,
        materialName: item.material?.materialName || item.materialName
      })));
    }
    
    if (data.targetSuppliers) {
      setSelectedSuppliers(data.targetSuppliers.map(s => s._id || s));
    }
  };

  const handleAddItem = () => {
    setItems([...items, {
      material: null,
      quantity: 1,
      uom: 'kg',
      specifications: '',
      targetPrice: null,
      quotes: []
    }]);
  };

  const handleRemoveItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    // If material changed, update material info
    if (field === 'material' && value) {
      const material = materials.find(m => m._id === value);
      if (material) {
        newItems[index].materialNumber = material.materialNumber;
        newItems[index].materialName = material.materialName;
        newItems[index].uom = material.baseUOM;
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
    
    const invalidItems = items.filter(item => !item.material || !item.quantity);
    if (invalidItems.length > 0) {
      message.error('Please fill in all required item fields');
      return;
    }
    
    setLoading(true);
    
    try {
      const submitData = {
        ...values,
        requestDate: values.requestDate.toISOString(),
        responseDeadline: values.responseDeadline.toISOString(),
        validUntil: values.validUntil ? values.validUntil.toISOString() : null,
        items: items.map(item => ({
          material: item.material,
          quantity: item.quantity,
          uom: item.uom,
          specifications: item.specifications,
          targetPrice: item.targetPrice,
          quotes: item.quotes || []
        }))
      };
      
      let response;
      if (current) {
        response = await request.update({
          entity: 'material-quotations',
          id: current._id,
          jsonData: submitData
        });
      } else {
        response = await request.create({
          entity: 'material-quotations',
          jsonData: submitData
        });
      }
      
      if (response.success) {
        message.success(`Quotation ${current ? 'updated' : 'created'} successfully`);
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
      title: 'Material *',
      dataIndex: 'material',
      key: 'material',
      width: 250,
      render: (val, record, index) => (
        <Select
          showSearch
          value={val}
          onChange={(value) => handleItemChange(index, 'material', value)}
          placeholder="Select material"
          style={{ width: '100%' }}
          optionFilterProp="children"
          filterOption={(input, option) =>
            option.children.toLowerCase().includes(input.toLowerCase())
          }
          disabled={current?.status !== 'draft'}
        >
          {materials.map(mat => (
            <Option key={mat._id} value={mat._id}>
              {mat.materialName?.en || mat.materialName?.zh} ({mat.materialNumber})
            </Option>
          ))}
        </Select>
      )
    },
    {
      title: 'Quantity *',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      render: (val, record, index) => (
        <InputNumber
          min={1}
          value={val}
          onChange={(value) => handleItemChange(index, 'quantity', value)}
          style={{ width: '100%' }}
          disabled={current?.status !== 'draft'}
        />
      )
    },
    {
      title: 'UOM',
      dataIndex: 'uom',
      key: 'uom',
      width: 100,
      render: (val, record, index) => (
        <Input
          value={val}
          onChange={(e) => handleItemChange(index, 'uom', e.target.value)}
          disabled={current?.status !== 'draft'}
        />
      )
    },
    {
      title: 'Target Price',
      dataIndex: 'targetPrice',
      key: 'targetPrice',
      width: 120,
      render: (val, record, index) => (
        <InputNumber
          min={0}
          precision={2}
          value={val}
          onChange={(value) => handleItemChange(index, 'targetPrice', value)}
          style={{ width: '100%' }}
          prefix="$"
          disabled={current?.status !== 'draft'}
        />
      )
    },
    {
      title: 'Specifications',
      dataIndex: 'specifications',
      key: 'specifications',
      width: 200,
      render: (val, record, index) => (
        <Input.TextArea
          value={val}
          onChange={(e) => handleItemChange(index, 'specifications', e.target.value)}
          rows={2}
          placeholder="Enter specs..."
          disabled={current?.status !== 'draft'}
        />
      )
    },
    {
      title: 'Quotes',
      dataIndex: 'quotes',
      key: 'quotes',
      width: 80,
      align: 'center',
      render: (quotes) => (
        <Tag color={quotes?.length > 0 ? 'success' : 'default'}>
          {quotes?.length || 0}
        </Tag>
      )
    },
    {
      title: 'Action',
      key: 'action',
      width: 80,
      align: 'center',
      render: (_, record, index) => (
        <Button
          type="text"
          danger
          icon={<MinusCircleOutlined />}
          onClick={() => handleRemoveItem(index)}
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
        requestDate: dayjs(),
        responseDeadline: dayjs().add(7, 'days'),
        status: 'draft'
      }}
    >
      <Tabs defaultActiveKey="1">
        <Tabs.TabPane tab="Basic Information" key="1">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={['title', 'en']}
                label="Title (English)"
                rules={[{ required: true, message: 'Please enter title' }]}
              >
                <Input
                  placeholder="Enter quotation title"
                  disabled={current?.status !== 'draft'}
                />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name={['title', 'zh']}
                label="Title (Chinese)"
              >
                <Input
                  placeholder="输入询价标题"
                  disabled={current?.status !== 'draft'}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="description"
                label="Description"
              >
                <TextArea
                  rows={3}
                  placeholder="Enter description..."
                  disabled={current?.status !== 'draft'}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="requestDate"
                label="Request Date"
                rules={[{ required: true, message: 'Please select date' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD"
                  disabled={current?.status !== 'draft'}
                />
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="responseDeadline"
                label="Response Deadline"
                rules={[{ required: true, message: 'Please select deadline' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD"
                  disabled={current?.status !== 'draft'}
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="validUntil"
                label="Valid Until"
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD"
                  disabled={current?.status !== 'draft'}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="targetSuppliers"
                label="Target Suppliers"
                rules={[{ required: true, message: 'Please select at least one supplier' }]}
              >
                <Select
                  mode="multiple"
                  placeholder="Select suppliers"
                  optionFilterProp="children"
                  onChange={setSelectedSuppliers}
                  disabled={current?.status !== 'draft'}
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {suppliers.map(sup => (
                    <Option key={sup._id} value={sup._id}>
                      {sup.companyName?.en || sup.companyName?.zh} ({sup.supplierNumber})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Tabs.TabPane>

        <Tabs.TabPane tab="Items" key="2">
          <Table
            dataSource={items}
            columns={itemColumns}
            rowKey={(record, index) => index}
            pagination={false}
            scroll={{ x: 1000 }}
            size="small"
            footer={() => (
              <Button
                type="dashed"
                onClick={handleAddItem}
                block
                icon={<PlusOutlined />}
                disabled={current?.status !== 'draft'}
              >
                Add Item
              </Button>
            )}
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
          {current ? 'Update' : 'Create'} Quotation
        </Button>
      </Space>
    </Form>
  );
};

export default MaterialQuotationForm;



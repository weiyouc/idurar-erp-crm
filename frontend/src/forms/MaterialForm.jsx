import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Select,
  Tabs,
  InputNumber,
  Switch,
  Space,
  message,
  TreeSelect,
} from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { request } from '@/request';
import { useMoney } from '@/settings';
import FileUpload from '@/components/FileUpload';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

const MaterialForm = ({ isUpdateForm = false, current = null, onSuccess }) => {
  const [form] = Form.useForm();
  const money = useMoney();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    fetchCategories();
    fetchSuppliers();
  }, []);

  useEffect(() => {
    if (isUpdateForm && current) {
      form.setFieldsValue({
        ...current,
        materialName_zh: current.materialName?.zh,
        materialName_en: current.materialName?.en,
        category: current.category?._id || current.category,
        alternativeUOMs: current.alternativeUOMs || [],
        preferredSuppliers: current.preferredSuppliers?.map(s => ({
          supplier: s.supplier?._id || s.supplier,
          leadTime: s.leadTime,
          minOrderQuantity: s.minOrderQuantity,
          price: s.price,
          currency: s.currency
        })) || [],
      });
      if (current.images) {
        setFileList(current.images.map(img => ({
          uid: img.id,
          name: img.filename,
          status: 'done',
          url: img.url,
          response: { result: img },
        })));
      }
    }
  }, [isUpdateForm, current]);

  const fetchCategories = async () => {
    try {
      const res = await request.get('/api/material-categories/tree?activeOnly=true');
      if (res.success) {
        setCategories(buildTreeData(res.result));
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await request.list('supplier', { items: 100, status: 'active' });
      if (res.success) {
        setSuppliers(res.result);
      }
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    }
  };

  const buildTreeData = (nodes) => {
    return nodes.map(node => ({
      title: `${node.code} - ${node.name?.zh || node.name?.en}`,
      value: node.id,
      children: node.children ? buildTreeData(node.children) : [],
    }));
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const formattedValues = {
        ...values,
        materialName: {
          zh: values.materialName_zh,
          en: values.materialName_en,
        },
        images: fileList.map(file => file.response?.result?.id || file.uid),
      };
      
      // Remove temporary fields
      delete formattedValues.materialName_zh;
      delete formattedValues.materialName_en;

      let res;
      if (isUpdateForm) {
        res = await request.patch(`/api/materials/${current.id}`, formattedValues);
      } else {
        res = await request.post('/api/materials', formattedValues);
      }

      if (res.success) {
        message.success(res.message);
        if (onSuccess) onSuccess();
      } else {
        message.error(res.message);
      }
    } catch (error) {
      message.error('提交失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{
        type: 'raw',
        status: 'draft',
        baseUOM: 'PC',
        currency: 'CNY',
        minimumOrderQty: 1,
        defaultLeadTime: 0,
        safetyStock: 0,
        reorderPoint: 0,
        standardCost: 0,
      }}
    >
      <Tabs defaultActiveKey="1">
        <TabPane tab="基本信息" key="1">
          <Form.Item
            label="物料编号"
            name="materialNumber"
            rules={[{ required: false, message: '系统自动生成' }]}
          >
            <Input disabled={isUpdateForm} placeholder="系统自动生成" />
          </Form.Item>

          <Form.Item
            label="物料名称(中文)"
            name="materialName_zh"
            rules={[{ required: true, message: '请输入中文名称' }]}
          >
            <Input placeholder="请输入物料中文名称" />
          </Form.Item>

          <Form.Item
            label="物料名称(英文)"
            name="materialName_en"
          >
            <Input placeholder="请输入物料英文名称(可选)" />
          </Form.Item>

          <Form.Item
            label="物料分类"
            name="category"
            rules={[{ required: true, message: '请选择物料分类' }]}
          >
            <TreeSelect
              showSearch
              style={{ width: '100%' }}
              dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
              placeholder="请选择物料分类"
              allowClear
              treeDefaultExpandAll
              treeData={categories}
            />
          </Form.Item>

          <Form.Item
            label="物料类型"
            name="type"
            rules={[{ required: true, message: '请选择物料类型' }]}
          >
            <Select>
              <Option value="raw">原材料</Option>
              <Option value="semi-finished">半成品</Option>
              <Option value="finished">成品</Option>
              <Option value="packaging">包装材料</Option>
              <Option value="consumable">耗材</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="状态"
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select>
              <Option value="draft">草稿</Option>
              <Option value="active">启用</Option>
              <Option value="obsolete">停用</Option>
              <Option value="discontinued">已停产</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
          >
            <TextArea rows={3} placeholder="物料描述" />
          </Form.Item>
        </TabPane>

        <TabPane tab="规格信息" key="2">
          <Form.Item label="品牌" name="brand">
            <Input placeholder="品牌名称" />
          </Form.Item>

          <Form.Item label="型号" name="model">
            <Input placeholder="规格型号" />
          </Form.Item>

          <Form.Item label="制造商" name="manufacturer">
            <Input placeholder="制造商名称" />
          </Form.Item>

          <Form.Item label="HS代码" name="hsCode">
            <Input placeholder="海关编码" />
          </Form.Item>

          <Form.Item label="颜色" name="color">
            <Input placeholder="颜色" />
          </Form.Item>

          <Form.Item label="尺寸(长)" name="length">
            <InputNumber style={{ width: '100%' }} placeholder="长度(mm)" />
          </Form.Item>

          <Form.Item label="尺寸(宽)" name="width">
            <InputNumber style={{ width: '100%' }} placeholder="宽度(mm)" />
          </Form.Item>

          <Form.Item label="尺寸(高)" name="height">
            <InputNumber style={{ width: '100%' }} placeholder="高度(mm)" />
          </Form.Item>

          <Form.Item label="重量(kg)" name="weight">
            <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
          </Form.Item>
        </TabPane>

        <TabPane tab="单位管理" key="3">
          <Form.Item
            label="基本单位"
            name="baseUOM"
            rules={[{ required: true, message: '请输入基本单位' }]}
          >
            <Input placeholder="如: PC, KG, M" style={{ width: 200 }} />
          </Form.Item>

          <Form.Item label="备用单位">
            <Form.List name="alternativeUOMs">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item
                        {...restField}
                        name={[name, 'uom']}
                        rules={[{ required: true, message: '请输入单位' }]}
                      >
                        <Input placeholder="单位" style={{ width: 100 }} />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'conversionFactor']}
                        rules={[{ required: true, message: '请输入转换系数' }]}
                      >
                        <InputNumber
                          placeholder="转换系数"
                          style={{ width: 150 }}
                          min={0.001}
                          step={0.001}
                        />
                      </Form.Item>
                      <span>= 1 基本单位</span>
                      <MinusCircleOutlined onClick={() => remove(name)} />
                    </Space>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      添加备用单位
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form.Item>
        </TabPane>

        <TabPane tab="供应商" key="4">
          <Form.List name="preferredSuppliers">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <div
                    key={key}
                    style={{
                      marginBottom: 16,
                      padding: 16,
                      border: '1px solid #d9d9d9',
                      borderRadius: 4,
                    }}
                  >
                    <Form.Item
                      {...restField}
                      label="供应商"
                      name={[name, 'supplier']}
                      rules={[{ required: true, message: '请选择供应商' }]}
                    >
                      <Select placeholder="选择供应商" showSearch>
                        {suppliers.map(s => (
                          <Option key={s._id} value={s._id}>
                            {s.companyName?.zh || s.companyName?.en}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      label="交期(天)"
                      name={[name, 'leadTime']}
                    >
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      label="最小订货量"
                      name={[name, 'minOrderQuantity']}
                    >
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      label="价格"
                      name={[name, 'price']}
                    >
                      <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      label="币种"
                      name={[name, 'currency']}
                    >
                      <Select style={{ width: 100 }}>
                        <Option value="CNY">CNY</Option>
                        <Option value="USD">USD</Option>
                        <Option value="EUR">EUR</Option>
                      </Select>
                    </Form.Item>
                    <Button danger onClick={() => remove(name)}>
                      删除供应商
                    </Button>
                  </div>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    添加首选供应商
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </TabPane>

        <TabPane tab="成本库存" key="5">
          <Form.Item
            label="标准成本"
            name="standardCost"
          >
            <InputNumber
              min={0}
              step={0.01}
              style={{ width: '100%' }}
              formatter={value => `${money.prefix} ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Form.Item>

          <Form.Item
            label="币种"
            name="currency"
          >
            <Select style={{ width: 100 }}>
              <Option value="CNY">CNY</Option>
              <Option value="USD">USD</Option>
              <Option value="EUR">EUR</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="最小订货量"
            name="minimumOrderQty"
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="默认交期(天)"
            name="defaultLeadTime"
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="安全库存"
            name="safetyStock"
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="再订购点"
            name="reorderPoint"
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="再订购量"
            name="reorderQuantity"
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="最大库存"
            name="maxStockLevel"
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </TabPane>

        <TabPane tab="附件" key="6">
          <FileUpload
            entityType="Material"
            entityId={current?.id}
            fileList={fileList}
            setFileList={setFileList}
          />
        </TabPane>
      </Tabs>

      <Form.Item style={{ marginTop: '20px' }}>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            {isUpdateForm ? '更新物料' : '创建物料'}
          </Button>
          <Button onClick={() => form.resetFields()}>重置</Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default MaterialForm;


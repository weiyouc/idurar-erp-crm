import React, { useState, useEffect } from 'react';
import {
  Tree,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  message,
  Card,
  Popconfirm,
  Tag,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOutlined,
  FolderOpenOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { request } from '@/request';

const { Option } = Select;
const { TextArea } = Input;

const MaterialCategoryManager = () => {
  const [treeData, setTreeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [form] = Form.useForm();
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [autoExpandParent, setAutoExpandParent] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await request.get('/api/material-categories/tree');
      if (response.success) {
        const formattedTree = formatTreeData(response.result);
        setTreeData(formattedTree);
        // Auto-expand all root nodes
        const rootKeys = response.result.map(node => node.id);
        setExpandedKeys(rootKeys);
      }
    } catch (error) {
      message.error('获取分类失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatTreeData = (nodes) => {
    return nodes.map(node => ({
      title: renderTitle(node),
      key: node.id,
      icon: node.isActive ? <FolderOutlined /> : <FolderOpenOutlined />,
      children: node.children ? formatTreeData(node.children) : [],
      ...node,
    }));
  };

  const renderTitle = (node) => {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <Space>
          <span>{node.code}</span>
          <span>{node.name?.zh || node.name?.en}</span>
          <Tag color={node.isActive ? 'green' : 'default'}>
            {node.isActive ? '启用' : '停用'}
          </Tag>
          <Tag color="blue">L{node.level}</Tag>
        </Space>
        <Space size="small">
          <Tooltip title="添加子分类">
            <Button
              size="small"
              type="link"
              icon={<PlusOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                showAddChildModal(node);
              }}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              size="small"
              type="link"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                showEditModal(node);
              }}
            />
          </Tooltip>
          {node.isActive ? (
            <Tooltip title="停用">
              <Popconfirm
                title="确定停用该分类吗？"
                onConfirm={(e) => {
                  e.stopPropagation();
                  handleDeactivate(node);
                }}
                onCancel={(e) => e.stopPropagation()}
              >
                <Button
                  size="small"
                  type="link"
                  icon={<StopOutlined />}
                  danger
                  onClick={(e) => e.stopPropagation()}
                />
              </Popconfirm>
            </Tooltip>
          ) : (
            <Tooltip title="启用">
              <Popconfirm
                title="确定启用该分类吗？"
                onConfirm={(e) => {
                  e.stopPropagation();
                  handleActivate(node);
                }}
                onCancel={(e) => e.stopPropagation()}
              >
                <Button
                  size="small"
                  type="link"
                  icon={<CheckCircleOutlined />}
                  onClick={(e) => e.stopPropagation()}
                />
              </Popconfirm>
            </Tooltip>
          )}
          <Tooltip title="删除">
            <Popconfirm
              title="确定删除该分类吗？"
              description="注意：只能删除没有子分类的分类"
              onConfirm={(e) => {
                e.stopPropagation();
                handleDelete(node);
              }}
              onCancel={(e) => e.stopPropagation()}
            >
              <Button
                size="small"
                type="link"
                icon={<DeleteOutlined />}
                danger
                onClick={(e) => e.stopPropagation()}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      </div>
    );
  };

  const showAddModal = () => {
    setIsModalVisible(true);
    setIsUpdateMode(false);
    setCurrentCategory(null);
    form.resetFields();
  };

  const showAddChildModal = (parent) => {
    setIsModalVisible(true);
    setIsUpdateMode(false);
    setCurrentCategory(null);
    form.resetFields();
    form.setFieldsValue({ parent: parent.id });
  };

  const showEditModal = (category) => {
    setIsModalVisible(true);
    setIsUpdateMode(true);
    setCurrentCategory(category);
    form.setFieldsValue({
      code: category.code,
      name_zh: category.name?.zh,
      name_en: category.name?.en,
      description: category.description,
      displayOrder: category.displayOrder,
      parent: category.parent?.id || category.parent,
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const formattedValues = {
        ...values,
        name: {
          zh: values.name_zh,
          en: values.name_en,
        },
      };
      delete formattedValues.name_zh;
      delete formattedValues.name_en;

      let response;
      if (isUpdateMode) {
        response = await request.patch(
          `/api/material-categories/${currentCategory.id}`,
          formattedValues
        );
      } else {
        response = await request.post('/api/material-categories', formattedValues);
      }

      if (response.success) {
        message.success(response.message);
        setIsModalVisible(false);
        fetchCategories();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (category) => {
    setLoading(true);
    try {
      const response = await request.delete(`/api/material-categories/${category.id}`);
      if (response.success) {
        message.success('分类已停用');
        fetchCategories();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error('删除失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (category) => {
    setLoading(true);
    try {
      const response = await request.patch(`/api/material-categories/${category.id}/activate`);
      if (response.success) {
        message.success('分类已启用');
        fetchCategories();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error('操作失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (category) => {
    setLoading(true);
    try {
      const response = await request.patch(`/api/material-categories/${category.id}/deactivate`);
      if (response.success) {
        message.success('分类已停用');
        fetchCategories();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error('操作失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onExpand = (expandedKeysValue) => {
    setExpandedKeys(expandedKeysValue);
    setAutoExpandParent(false);
  };

  const onSelect = (selectedKeysValue) => {
    setSelectedKeys(selectedKeysValue);
  };

  return (
    <Card
      title="物料分类管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
          新增根分类
        </Button>
      }
    >
      <Tree
        showIcon
        showLine
        expandedKeys={expandedKeys}
        selectedKeys={selectedKeys}
        onExpand={onExpand}
        onSelect={onSelect}
        autoExpandParent={autoExpandParent}
        treeData={treeData}
        style={{ minHeight: '400px' }}
      />

      <Modal
        title={isUpdateMode ? '编辑分类' : '新增分类'}
        visible={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={loading}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="分类代码"
            name="code"
            rules={[
              { required: true, message: '请输入分类代码' },
              { pattern: /^[A-Z0-9_-]+$/, message: '只能包含大写字母、数字、下划线和横线' },
            ]}
          >
            <Input placeholder="如: RAW_MAT" disabled={isUpdateMode} />
          </Form.Item>

          <Form.Item
            label="分类名称(中文)"
            name="name_zh"
            rules={[{ required: true, message: '请输入中文名称' }]}
          >
            <Input placeholder="如: 原材料" />
          </Form.Item>

          <Form.Item label="分类名称(英文)" name="name_en">
            <Input placeholder="如: Raw Material" />
          </Form.Item>

          <Form.Item label="父分类" name="parent">
            <Select placeholder="选择父分类(留空表示根分类)" allowClear>
              {flattenTree(treeData).map(cat => (
                <Option
                  key={cat.id}
                  value={cat.id}
                  disabled={isUpdateMode && cat.id === currentCategory?.id}
                >
                  {'  '.repeat(cat.level)}{cat.code} - {cat.name?.zh}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="描述" name="description">
            <TextArea rows={3} placeholder="分类描述" />
          </Form.Item>

          <Form.Item label="排序序号" name="displayOrder">
            <Input type="number" placeholder="数字越小越靠前" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

// Helper function to flatten tree for dropdown
const flattenTree = (nodes, result = []) => {
  nodes.forEach(node => {
    result.push(node);
    if (node.children && node.children.length > 0) {
      flattenTree(node.children, result);
    }
  });
  return result;
};

export default MaterialCategoryManager;


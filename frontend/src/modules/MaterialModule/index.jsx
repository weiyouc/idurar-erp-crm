import React, { useState, useEffect } from 'react';
import {
  Button,
  Table,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tag,
  Tooltip,
  Popconfirm,
  TreeSelect,
  Checkbox,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  StopOutlined,
  ExportOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { request } from '@/request';
import { useMoney } from '@/settings';
import MaterialForm from '@/forms/MaterialForm';
import ExportButton from '@/components/ExportButton';

const { Option } = Select;
const { confirm } = Modal;

const MaterialModule = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState(null);
  const [searchForm] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const money = useMoney();

  const entity = 'material';

  useEffect(() => {
    fetchMaterials({ current: 1 });
    fetchCategories();
    fetchSuppliers();
  }, []);

  const fetchMaterials = async (params = {}) => {
    setLoading(true);
    try {
      const { current, pageSize, ...filters } = params;
      const response = await request.get('/api/materials', {
        params: {
          page: current || pagination.current,
          items: pageSize || pagination.pageSize,
          ...filters,
        },
      });
      
      if (response.success) {
        setData(response.result);
        setPagination({
          ...pagination,
          current: response.pagination.page,
          pageSize: response.pagination.items || 10,
          total: response.pagination.count,
        });
      }
    } catch (error) {
      message.error('获取物料列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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
      const res = await request.get('/api/suppliers', {
        params: { items: 100, status: 'active' },
      });
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

  const handleTableChange = (newPagination, filters, sorter) => {
    const searchValues = searchForm.getFieldsValue();
    fetchMaterials({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
      sortBy: sorter.field,
      sortOrder: sorter.order === 'ascend' ? 'asc' : 'desc',
      ...searchValues,
    });
  };

  const handleSearch = (values) => {
    fetchMaterials({ current: 1, ...values });
  };

  const handleReset = () => {
    searchForm.resetFields();
    fetchMaterials({ current: 1 });
  };

  const showAddModal = () => {
    setIsModalVisible(true);
    setIsUpdateMode(false);
    setCurrentMaterial(null);
  };

  const showEditModal = (record) => {
    setIsModalVisible(true);
    setIsUpdateMode(true);
    setCurrentMaterial(record);
  };

  const showViewModal = (record) => {
    Modal.info({
      title: '物料详情',
      width: 800,
      content: (
        <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
          <p><strong>物料编号:</strong> {record.materialNumber}</p>
          <p><strong>物料名称(中文):</strong> {record.materialName?.zh}</p>
          <p><strong>物料名称(英文):</strong> {record.materialName?.en}</p>
          <p><strong>分类:</strong> {record.category?.name?.zh || record.category?.code}</p>
          <p><strong>类型:</strong> <Tag>{getMaterialTypeText(record.type)}</Tag></p>
          <p><strong>状态:</strong> <Tag color={getStatusColor(record.status)}>{getMaterialStatusText(record.status)}</Tag></p>
          <p><strong>基本单位:</strong> {record.baseUOM}</p>
          {record.brand && <p><strong>品牌:</strong> {record.brand}</p>}
          {record.model && <p><strong>型号:</strong> {record.model}</p>}
          {record.manufacturer && <p><strong>制造商:</strong> {record.manufacturer}</p>}
          <p><strong>标准成本:</strong> {money.format(record.standardCost)} {record.currency}</p>
          <p><strong>安全库存:</strong> {record.safetyStock}</p>
          <p><strong>再订购点:</strong> {record.reorderPoint}</p>
          {record.preferredSuppliers && record.preferredSuppliers.length > 0 && (
            <div>
              <strong>首选供应商:</strong>
              <ul>
                {record.preferredSuppliers.map((ps, idx) => (
                  <li key={idx}>
                    {ps.supplier?.companyName?.zh || ps.supplier?.companyName?.en} - 
                    交期: {ps.leadTime}天, 价格: {money.format(ps.price)} {ps.currency}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {record.description && <p><strong>描述:</strong> {record.description}</p>}
          <p><strong>创建时间:</strong> {new Date(record.createdAt).toLocaleString()}</p>
        </div>
      ),
      onOk() {},
    });
  };

  const handleDelete = (record) => {
    confirm({
      title: '确认删除',
      content: `确定要删除物料 "${record.materialName?.zh}" 吗？`,
      okText: '确认',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        setLoading(true);
        try {
          const response = await request.delete(`/api/materials/${record._id}`);
          if (response.success) {
            message.success(response.message);
            fetchMaterials({ current: pagination.current });
          } else {
            message.error(response.message);
          }
        } catch (error) {
          message.error('删除失败');
          console.error(error);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleActivate = async (record) => {
    setLoading(true);
    try {
      const response = await request.patch(`/api/materials/${record._id}/activate`);
      if (response.success) {
        message.success('物料已启用');
        fetchMaterials({ current: pagination.current });
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

  const handleDeactivate = async (record) => {
    setLoading(true);
    try {
      const response = await request.patch(`/api/materials/${record._id}/deactivate`);
      if (response.success) {
        message.success('物料已停用');
        fetchMaterials({ current: pagination.current });
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

  const getMaterialTypeText = (type) => {
    const map = {
      raw: '原材料',
      'semi-finished': '半成品',
      finished: '成品',
      packaging: '包装材料',
      consumable: '耗材',
      other: '其他',
    };
    return map[type] || type;
  };

  const getMaterialStatusText = (status) => {
    const map = {
      draft: '草稿',
      active: '启用',
      obsolete: '停用',
      discontinued: '已停产',
    };
    return map[status] || status;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'active':
        return 'green';
      case 'obsolete':
        return 'orange';
      case 'discontinued':
        return 'red';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: '物料编号',
      dataIndex: 'materialNumber',
      key: 'materialNumber',
      width: 150,
      fixed: 'left',
      sorter: true,
    },
    {
      title: '物料名称',
      dataIndex: 'materialName',
      key: 'materialName',
      width: 200,
      render: (name) => name?.zh || name?.en || '-',
      sorter: true,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 150,
      render: (category) => category?.name?.zh || category?.code || '-',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => <Tag>{getMaterialTypeText(type)}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)}>{getMaterialStatusText(status)}</Tag>
      ),
    },
    {
      title: '基本单位',
      dataIndex: 'baseUOM',
      key: 'baseUOM',
      width: 100,
    },
    {
      title: '标准成本',
      dataIndex: 'standardCost',
      key: 'standardCost',
      width: 120,
      render: (cost, record) => `${money.format(cost)} ${record.currency}`,
      sorter: true,
    },
    {
      title: '安全库存',
      dataIndex: 'safetyStock',
      key: 'safetyStock',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 250,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => showViewModal(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => showEditModal(record)}
            />
          </Tooltip>
          {record.status === 'active' ? (
            <Tooltip title="停用">
              <Popconfirm
                title="确定停用该物料吗？"
                onConfirm={() => handleDeactivate(record)}
              >
                <Button type="link" icon={<StopOutlined />} danger />
              </Popconfirm>
            </Tooltip>
          ) : (
            <Tooltip title="启用">
              <Popconfirm
                title="确定启用该物料吗？"
                onConfirm={() => handleActivate(record)}
              >
                <Button type="link" icon={<CheckCircleOutlined />} />
              </Popconfirm>
            </Tooltip>
          )}
          <Tooltip title="删除">
            <Button
              type="link"
              icon={<DeleteOutlined />}
              danger
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ marginBottom: '20px' }}>物料管理</h2>

      {/* Search Form */}
      <Form
        form={searchForm}
        layout="inline"
        onFinish={handleSearch}
        style={{ marginBottom: '20px', background: '#fafafa', padding: '20px', borderRadius: '4px' }}
      >
        <Form.Item name="search">
          <Input
            placeholder="搜索物料编号、名称"
            prefix={<SearchOutlined />}
            style={{ width: 250 }}
          />
        </Form.Item>

        <Form.Item name="category">
          <TreeSelect
            showSearch
            style={{ width: 200 }}
            placeholder="选择分类"
            allowClear
            treeData={categories}
          />
        </Form.Item>

        <Form.Item name="type">
          <Select placeholder="物料类型" style={{ width: 150 }} allowClear>
            <Option value="raw">原材料</Option>
            <Option value="semi-finished">半成品</Option>
            <Option value="finished">成品</Option>
            <Option value="packaging">包装材料</Option>
            <Option value="consumable">耗材</Option>
            <Option value="other">其他</Option>
          </Select>
        </Form.Item>

        <Form.Item name="status">
          <Select placeholder="状态" style={{ width: 120 }} allowClear>
            <Option value="draft">草稿</Option>
            <Option value="active">启用</Option>
            <Option value="obsolete">停用</Option>
            <Option value="discontinued">已停产</Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              搜索
            </Button>
            <Button onClick={handleReset} icon={<ReloadOutlined />}>
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>

      {/* Action Bar */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
          新增物料
        </Button>
        <Space>
          <ExportButton
            entity="materials"
            filters={searchForm.getFieldsValue()}
            icon={<ExportOutlined />}
          >
            导出Excel
          </ExportButton>
          <Button icon={<ReloadOutlined />} onClick={() => fetchMaterials({ current: 1 })}>
            刷新
          </Button>
        </Space>
      </div>

      {/* Data Table */}
      <Table
        columns={columns}
        dataSource={data}
        rowKey="_id"
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        scroll={{ x: 'max-content' }}
      />

      {/* Material Form Modal */}
      <Modal
        title={isUpdateMode ? '编辑物料' : '新增物料'}
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={1000}
        destroyOnClose
      >
        <MaterialForm
          isUpdateForm={isUpdateMode}
          current={currentMaterial}
          onSuccess={() => {
            setIsModalVisible(false);
            fetchMaterials({ current: pagination.current });
          }}
        />
      </Modal>
    </div>
  );
};

export default MaterialModule;


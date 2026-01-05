import { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Modal, Input, message, Tabs, Statistic, Row, Col } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined 
} from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';
import request from '@/request';
import { DashboardLayout } from '@/layout';

const { TextArea } = Input;
const { TabPane } = Tabs;

export default function ApprovalDashboard() {
  const translate = useLanguage();
  const [loading, setLoading] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [statistics, setStatistics] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [comments, setComments] = useState('');
  const [actionType, setActionType] = useState('approve');

  useEffect(() => {
    fetchPendingApprovals();
    fetchStatistics();
  }, []);

  const fetchPendingApprovals = async () => {
    setLoading(true);
    try {
      const response = await request.get({
        entity: 'workflow-instances/pending/me',
      });
      
      if (response.success) {
        setPendingApprovals(response.data || []);
      }
    } catch (error) {
      message.error(translate('failed_to_fetch_pending_approvals'));
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      // Fetch statistics for dashboard cards
      const response = await request.list({
        entity: 'workflow-instances',
        options: { limit: 1000 },
      });
      
      if (response.success) {
        const instances = response.result || [];
        setStatistics({
          pending: instances.filter(i => i.status === 'pending').length,
          approved: instances.filter(i => i.status === 'approved').length,
          rejected: instances.filter(i => i.status === 'rejected').length,
        });
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const showApprovalModal = (record, type) => {
    setSelectedInstance(record);
    setActionType(type);
    setComments('');
    setIsModalVisible(true);
  };

  const handleApproval = async () => {
    if (!selectedInstance) return;

    setLoading(true);
    try {
      const response = await request.post({
        entity: `workflow-instances/${selectedInstance._id}/${actionType}`,
        jsonData: { comments },
      });

      if (response.success) {
        message.success(
          translate(actionType === 'approve' ? 'approval_successful' : 'rejection_successful')
        );
        setIsModalVisible(false);
        fetchPendingApprovals();
        fetchStatistics();
      }
    } catch (error) {
      message.error(translate('action_failed'));
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: translate('document_type'),
      dataIndex: 'documentType',
      key: 'documentType',
      width: 150,
      render: (type) => {
        const colorMap = {
          supplier: 'blue',
          material_quotation: 'green',
          purchase_order: 'orange',
          pre_payment: 'purple',
        };
        return <Tag color={colorMap[type] || 'default'}>{type}</Tag>;
      },
    },
    {
      title: translate('workflow'),
      dataIndex: ['workflow', 'workflowName'],
      key: 'workflow',
      width: 200,
    },
    {
      title: translate('submitted_by'),
      dataIndex: ['submittedBy', 'name'],
      key: 'submittedBy',
      width: 150,
    },
    {
      title: translate('submitted_date'),
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: 150,
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: translate('current_level'),
      dataIndex: 'currentLevel',
      key: 'currentLevel',
      width: 100,
      render: (level) => <Tag color="blue">Level {level}</Tag>,
    },
    {
      title: translate('status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const colorMap = {
          pending: 'orange',
          approved: 'green',
          rejected: 'red',
          cancelled: 'default',
        };
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: translate('actions'),
      key: 'actions',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <div>
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => showApprovalModal(record, 'approve')}
            style={{ marginRight: 8 }}
          >
            {translate('approve')}
          </Button>
          <Button
            danger
            size="small"
            icon={<CloseCircleOutlined />}
            onClick={() => showApprovalModal(record, 'reject')}
          >
            {translate('reject')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div style={{ padding: '24px' }}>
        <h2>{translate('approval_dashboard')}</h2>
        
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Card>
              <Statistic
                title={translate('pending_approvals')}
                value={statistics.pending}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title={translate('approved_today')}
                value={statistics.approved}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title={translate('rejected_today')}
                value={statistics.rejected}
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
        </Row>

        <Card
          title={translate('my_pending_approvals')}
          extra={
            <Button 
              type="primary" 
              icon={<FileTextOutlined />}
              onClick={fetchPendingApprovals}
            >
              {translate('refresh')}
            </Button>
          }
        >
          <Table
            columns={columns}
            dataSource={pendingApprovals}
            loading={loading}
            rowKey="_id"
            scroll={{ x: 1200 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `${translate('total')} ${total} ${translate('items')}`,
            }}
          />
        </Card>

        <Modal
          title={
            actionType === 'approve'
              ? translate('approve_workflow')
              : translate('reject_workflow')
          }
          visible={isModalVisible}
          onOk={handleApproval}
          onCancel={() => setIsModalVisible(false)}
          confirmLoading={loading}
          okText={translate(actionType)}
          okButtonProps={{
            danger: actionType === 'reject',
            type: actionType === 'approve' ? 'primary' : 'default',
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <strong>{translate('document_type')}:</strong>{' '}
            {selectedInstance?.documentType}
          </div>
          <div style={{ marginBottom: 16 }}>
            <strong>{translate('workflow')}:</strong>{' '}
            {selectedInstance?.workflow?.workflowName}
          </div>
          <div style={{ marginBottom: 16 }}>
            <strong>{translate('submitted_by')}:</strong>{' '}
            {selectedInstance?.submittedBy?.name}
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>{translate('comments')}:</label>
            <TextArea
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={translate('enter_your_comments')}
            />
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}


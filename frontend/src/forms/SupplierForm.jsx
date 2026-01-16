import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Button,
  Tabs,
  Row,
  Col,
  Space,
  Divider,
  message,
  Card,
  Tag,
  Rate
} from 'antd';
import { SaveOutlined, SendOutlined } from '@ant-design/icons';
import FileUpload from '@/components/FileUpload';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const SupplierFormFields = ({ current, isUpdateForm = false }) => {
  const form = Form.useFormInstance();

  return (
    <Tabs defaultActiveKey="1">
      {/* Basic Information Tab */}
      <TabPane tab="Basic Information" key="1">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="companyName.zh"
              label="Company Name (Chinese)"
              rules={[
                {
                  validator: (_, value) => {
                    const enValue = form.getFieldValue('companyName.en');
                    if (!value && !enValue) {
                      return Promise.reject(
                        'At least one company name (Chinese or English) is required'
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input placeholder="供应商名称" maxLength={200} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="companyName.en"
              label="Company Name (English)"
              rules={[
                {
                  validator: (_, value) => {
                    const zhValue = form.getFieldValue('companyName.zh');
                    if (!value && !zhValue) {
                      return Promise.reject(
                        'At least one company name (Chinese or English) is required'
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input placeholder="Supplier Name" maxLength={200} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="abbreviation" label="Abbreviation">
              <Input placeholder="Short name" maxLength={50} />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="type"
              label="Supplier Type"
              rules={[{ required: true, message: 'Please select supplier type' }]}
            >
              <Select placeholder="Select type">
                <Option value="manufacturer">Manufacturer</Option>
                <Option value="distributor">Distributor</Option>
                <Option value="agent">Agent</Option>
                <Option value="other">Other</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item name="category" label="Category">
              <Select mode="tags" placeholder="Select or add categories">
                <Option value="Electronics">Electronics</Option>
                <Option value="Components">Components</Option>
                <Option value="Materials">Materials</Option>
                <Option value="Services">Services</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="tags" label="Tags">
              <Select mode="tags" placeholder="Add tags for easy filtering" />
            </Form.Item>
          </Col>
        </Row>
      </TabPane>

      {/* Contact Information Tab */}
      <TabPane tab="Contact Information" key="2">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="contact.primaryContact" label="Primary Contact">
              <Input placeholder="Contact person name" maxLength={100} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="contact.email"
              label="Email"
              rules={[{ type: 'email', message: 'Please enter a valid email' }]}
            >
              <Input placeholder="email@example.com" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="contact.phone" label="Phone">
              <Input placeholder="+1-234-567-8900" />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item name="contact.mobile" label="Mobile">
              <Input placeholder="+1-234-567-8900" />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item name="contact.fax" label="Fax">
              <Input placeholder="+1-234-567-8900" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="contact.website" label="Website">
              <Input placeholder="https://www.example.com" />
            </Form.Item>
          </Col>
        </Row>

        <Divider>Address</Divider>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="address.country" label="Country">
              <Input placeholder="Country" maxLength={100} />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item name="address.province" label="Province / State">
              <Input placeholder="Province or State" maxLength={100} />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item name="address.city" label="City">
              <Input placeholder="City" maxLength={100} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="address.district" label="District">
              <Input placeholder="District" maxLength={100} />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item name="address.street" label="Street Address">
              <Input placeholder="Street address" maxLength={200} />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item name="address.postalCode" label="Postal Code">
              <Input placeholder="Postal code" maxLength={20} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="address.fullAddress" label="Full Address">
              <TextArea placeholder="Complete address" rows={3} maxLength={500} />
            </Form.Item>
          </Col>
        </Row>
      </TabPane>

      {/* Business Information Tab */}
      <TabPane tab="Business Information" key="3">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="businessInfo.registrationNumber"
              label="Business Registration Number"
            >
              <Input placeholder="Registration number" maxLength={100} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="businessInfo.taxNumber" label="Tax Number">
              <Input placeholder="Tax ID" maxLength={100} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="businessInfo.legalRepresentative"
              label="Legal Representative"
            >
              <Input placeholder="Legal representative name" maxLength={100} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="businessInfo.establishedDate" label="Established Date">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="businessInfo.registeredCapital" label="Registered Capital">
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="businessInfo.businessScope" label="Business Scope">
              <TextArea
                placeholder="Description of business scope"
                rows={4}
                maxLength={1000}
              />
            </Form.Item>
          </Col>
        </Row>
      </TabPane>

      {/* Banking Information Tab */}
      <TabPane tab="Banking & Credit" key="4">
        <Divider>Banking Information</Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="banking.bankName" label="Bank Name">
              <Input placeholder="Bank name" maxLength={200} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="banking.branchName" label="Branch Name">
              <Input placeholder="Branch name" maxLength={200} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="banking.accountName" label="Account Name">
              <Input placeholder="Account holder name" maxLength={200} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="banking.accountNumber"
              label="Account Number"
              rules={[{ min: 8, message: 'Account number must be at least 8 characters' }]}
            >
              <Input placeholder="Bank account number" maxLength={50} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="banking.swiftCode" label="SWIFT Code">
              <Input placeholder="SWIFT/BIC code" maxLength={20} />
            </Form.Item>
          </Col>
        </Row>

        <Divider>Credit Information</Divider>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="creditInfo.creditRating" label="Credit Rating">
              <Select placeholder="Select rating">
                <Option value="A">A - Excellent</Option>
                <Option value="B">B - Good</Option>
                <Option value="C">C - Fair</Option>
                <Option value="D">D - Poor</Option>
                <Option value="Unrated">Unrated</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item name="creditInfo.creditLimit" label="Credit Limit">
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item name="creditInfo.currency" label="Currency">
              <Select placeholder="Select currency">
                <Option value="CNY">CNY - Chinese Yuan</Option>
                <Option value="USD">USD - US Dollar</Option>
                <Option value="EUR">EUR - Euro</Option>
                <Option value="JPY">JPY - Japanese Yen</Option>
                <Option value="HKD">HKD - Hong Kong Dollar</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="creditInfo.paymentTerms" label="Payment Terms">
              <Select placeholder="Select payment terms">
                <Option value="Immediate">Immediate</Option>
                <Option value="15 days">Net 15</Option>
                <Option value="30 days">Net 30</Option>
                <Option value="60 days">Net 60</Option>
                <Option value="90 days">Net 90</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </TabPane>

      {/* Documents Tab */}
      {current && current.id && (
        <TabPane tab="Documents" key="5">
          <Card title="Business License" style={{ marginBottom: 16 }}>
            <FileUpload
              entityType="Supplier"
              entityId={current.id}
              fieldName="businessLicense"
              accept=".pdf,.jpg,.jpeg,.png"
              multiple={false}
            />
          </Card>

          <Card title="Tax Certificate" style={{ marginBottom: 16 }}>
            <FileUpload
              entityType="Supplier"
              entityId={current.id}
              fieldName="taxCertificate"
              accept=".pdf,.jpg,.jpeg,.png"
              multiple={false}
            />
          </Card>

          <Card title="Quality Certificates" style={{ marginBottom: 16 }}>
            <FileUpload
              entityType="Supplier"
              entityId={current.id}
              fieldName="qualityCertificates"
              accept=".pdf,.jpg,.jpeg,.png"
              multiple={true}
            />
          </Card>

          <Card title="Other Documents">
            <FileUpload
              entityType="Supplier"
              entityId={current.id}
              fieldName="otherDocuments"
              multiple={true}
            />
          </Card>
        </TabPane>
      )}

      {/* Notes Tab */}
      <TabPane tab="Notes" key="6">
        <Form.Item name="notes" label="Internal Notes">
          <TextArea
            placeholder="Add any internal notes about this supplier..."
            rows={8}
            maxLength={2000}
          />
        </Form.Item>

        {current && current.status && (
          <>
            <Divider>Status Information</Divider>
            <Space direction="vertical" size="small">
              <div>
                <strong>Status:</strong>{' '}
                <Tag
                  color={
                    current.status === 'active'
                      ? 'green'
                      : current.status === 'pending_approval'
                      ? 'orange'
                      : current.status === 'inactive'
                      ? 'default'
                      : current.status === 'blacklisted'
                      ? 'red'
                      : 'blue'
                  }
                >
                  {current.status}
                </Tag>
              </div>
              {current.workflow?.rejectionReason && (
                <div>
                  <strong>Rejection Reason:</strong> {current.workflow.rejectionReason}
                </div>
              )}
            </Space>
          </>
        )}
      </TabPane>
    </Tabs>
  );
};

/**
 * SupplierForm Component
 * 
 * Comprehensive form for creating and editing suppliers.
 * Features tabbed interface, bilingual support, file uploads, and workflow integration.
 */
const SupplierForm = ({ 
  current = null, 
  onSubmit, 
  isUpdateForm = false,
  embedded = false
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitType, setSubmitType] = useState('save'); // 'save' or 'submit'

  useEffect(() => {
    if (current && !embedded) {
      // Populate form with current data
      const formData = {
        ...current,
        'companyName.zh': current.companyName?.zh,
        'companyName.en': current.companyName?.en,
        'contact.primaryContact': current.contact?.primaryContact,
        'contact.phone': current.contact?.phone,
        'contact.mobile': current.contact?.mobile,
        'contact.email': current.contact?.email,
        'contact.fax': current.contact?.fax,
        'contact.website': current.contact?.website,
        'address.country': current.address?.country,
        'address.province': current.address?.province,
        'address.city': current.address?.city,
        'address.district': current.address?.district,
        'address.street': current.address?.street,
        'address.postalCode': current.address?.postalCode,
        'address.fullAddress': current.address?.fullAddress,
        'businessInfo.registrationNumber': current.businessInfo?.registrationNumber,
        'businessInfo.taxNumber': current.businessInfo?.taxNumber,
        'businessInfo.legalRepresentative': current.businessInfo?.legalRepresentative,
        'businessInfo.registeredCapital': current.businessInfo?.registeredCapital,
        'businessInfo.establishedDate': current.businessInfo?.establishedDate ? dayjs(current.businessInfo.establishedDate) : null,
        'businessInfo.businessScope': current.businessInfo?.businessScope,
        'banking.bankName': current.banking?.bankName,
        'banking.accountName': current.banking?.accountName,
        'banking.accountNumber': current.banking?.accountNumber,
        'banking.swiftCode': current.banking?.swiftCode,
        'banking.branchName': current.banking?.branchName,
        'creditInfo.creditRating': current.creditInfo?.creditRating,
        'creditInfo.creditLimit': current.creditInfo?.creditLimit,
        'creditInfo.paymentTerms': current.creditInfo?.paymentTerms,
        'creditInfo.currency': current.creditInfo?.currency
      };
      
      form.setFieldsValue(formData);
    }
  }, [current, form]);

  const handleSubmit = async (submitForApproval = false) => {
    try {
      if (typeof onSubmit !== 'function') {
        throw new Error('onSubmit handler is required');
      }
      setSubmitType(submitForApproval ? 'submit' : 'save');
      setLoading(true);

      const values = await form.validateFields();
      
      // Transform flat structure to nested
      const supplierData = {
        companyName: {
          zh: values['companyName.zh'],
          en: values['companyName.en']
        },
        abbreviation: values.abbreviation,
        type: values.type,
        category: values.category || [],
        status: submitForApproval ? 'pending_approval' : 'draft',
        contact: {
          primaryContact: values['contact.primaryContact'],
          phone: values['contact.phone'],
          mobile: values['contact.mobile'],
          email: values['contact.email'],
          fax: values['contact.fax'],
          website: values['contact.website']
        },
        address: {
          country: values['address.country'],
          province: values['address.province'],
          city: values['address.city'],
          district: values['address.district'],
          street: values['address.street'],
          postalCode: values['address.postalCode'],
          fullAddress: values['address.fullAddress']
        },
        businessInfo: {
          registrationNumber: values['businessInfo.registrationNumber'],
          taxNumber: values['businessInfo.taxNumber'],
          legalRepresentative: values['businessInfo.legalRepresentative'],
          registeredCapital: values['businessInfo.registeredCapital'],
          establishedDate: values['businessInfo.establishedDate']?.toISOString(),
          businessScope: values['businessInfo.businessScope']
        },
        banking: {
          bankName: values['banking.bankName'],
          accountName: values['banking.accountName'],
          accountNumber: values['banking.accountNumber'],
          swiftCode: values['banking.swiftCode'],
          branchName: values['banking.branchName']
        },
        creditInfo: {
          creditRating: values['creditInfo.creditRating'],
          creditLimit: values['creditInfo.creditLimit'],
          paymentTerms: values['creditInfo.paymentTerms'],
          currency: values['creditInfo.currency']
        },
        notes: values.notes,
        tags: values.tags || []
      };

      await onSubmit(supplierData, submitForApproval);
      
      message.success(
        submitForApproval 
          ? 'Supplier submitted for approval successfully' 
          : isUpdateForm 
            ? 'Supplier updated successfully' 
            : 'Supplier saved as draft'
      );
    } catch (error) {
      console.error('Form submission error:', error);
      message.error(`Failed to ${submitForApproval ? 'submit' : 'save'} supplier: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (embedded) {
    return <SupplierFormFields current={current} isUpdateForm={isUpdateForm} />;
  }

  return (
    <Form form={form} layout="vertical" scrollToFirstError>
      <SupplierFormFields current={current} isUpdateForm={isUpdateForm} />
      <Divider />
      <Row justify="end">
        <Space>
          <Button type="default" onClick={() => form.resetFields()}>
            Reset
          </Button>

          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={loading && submitType === 'save'}
            onClick={() => handleSubmit(false)}
          >
            {isUpdateForm ? 'Update' : 'Save Draft'}
          </Button>

          {(!current || current.status === 'draft') && (
            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={loading && submitType === 'submit'}
              onClick={() => handleSubmit(true)}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            >
              Submit for Approval
            </Button>
          )}
        </Space>
      </Row>
    </Form>
  );
};

export default SupplierForm;


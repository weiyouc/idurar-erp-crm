import { Form, Input, Select, InputNumber, Switch, Button, Space, Card, Divider } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import useLanguage from '@/locale/useLanguage';
import { request } from '@/request';

const { TextArea } = Input;

export default function WorkflowForm({ isUpdateForm = false }) {
  const translate = useLanguage();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const form = Form.useFormInstance();
  const levels = Form.useWatch('levels', form) || [];

  useEffect(() => {
    // Fetch available roles
    const fetchRoles = async () => {
      setLoading(true);
      try {
        const response = await request.list({ entity: 'roles' });
        if (response.success) {
          setRoles(response.result || []);
        }
      } catch (error) {
        console.error('Error fetching roles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, []);

  const documentTypes = [
    { value: 'supplier', label: 'Supplier Onboarding' },
    { value: 'material_quotation', label: 'Material Quotation' },
    { value: 'purchase_order', label: 'Purchase Order' },
    { value: 'pre_payment', label: 'Pre-payment Application' },
  ];

  const conditionTypeOptions = [
    { value: 'amount', label: 'Amount' },
    { value: 'supplier_level', label: 'Supplier Level' },
    { value: 'material_category', label: 'Material Category' },
    { value: 'custom', label: 'Custom' },
  ];

  const operatorOptions = [
    { value: 'gt', label: '>' },
    { value: 'gte', label: '>=' },
    { value: 'lt', label: '<' },
    { value: 'lte', label: '<=' },
    { value: 'eq', label: '=' },
    { value: 'ne', label: '≠' },
    { value: 'in', label: 'in' },
    { value: 'not_in', label: 'not in' },
  ];

  return (
    <>
      <Form.Item
        label={translate('workflow_name')}
        name="workflowName"
        rules={[
          {
            required: true,
            message: translate('please_input_workflow_name'),
          },
        ]}
      >
        <Input 
          placeholder="e.g., Material Quotation Approval" 
          autoComplete="off" 
        />
      </Form.Item>

      <Form.Item
        label={translate('display_name_chinese')}
        name={['displayName', 'zh']}
        rules={[
          {
            required: true,
            message: translate('please_input_display_name_chinese'),
          },
        ]}
      >
        <Input 
          placeholder="例如：物料报价审批" 
          autoComplete="off" 
        />
      </Form.Item>

      <Form.Item
        label={translate('display_name_english')}
        name={['displayName', 'en']}
        rules={[
          {
            required: true,
            message: translate('please_input_display_name_english'),
          },
        ]}
      >
        <Input 
          placeholder="e.g., Material Quotation Approval" 
          autoComplete="off" 
        />
      </Form.Item>

      <Form.Item
        label={translate('document_type')}
        name="documentType"
        rules={[
          {
            required: true,
            message: translate('please_select_document_type'),
          },
        ]}
        tooltip={translate('workflow_applies_to_this_document_type')}
      >
        <Select
          placeholder={translate('select_document_type')}
          options={documentTypes}
        />
      </Form.Item>

      <Form.Item
        label={translate('description')}
        name="description"
      >
        <TextArea 
          rows={3}
          placeholder={translate('workflow_description_placeholder')}
          autoComplete="off" 
        />
      </Form.Item>

      <Form.Item
        label={translate('is_default')}
        name="isDefault"
        valuePropName="checked"
        tooltip={translate('default_workflow_for_document_type')}
      >
        <Switch />
      </Form.Item>

      <Form.Item
        label={translate('is_active')}
        name="isActive"
        valuePropName="checked"
        initialValue={true}
      >
        <Switch />
      </Form.Item>

      <Card 
        title={translate('approval_levels')} 
        size="small" 
        style={{ marginBottom: 16 }}
      >
        <Form.List name="levels">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Card 
                  key={key} 
                  type="inner" 
                  size="small"
                  style={{ marginBottom: 16 }}
                  title={`${translate('level')} ${name + 1}`}
                  extra={
                    fields.length > 1 ? (
                      <MinusCircleOutlined
                        onClick={() => remove(name)}
                        style={{ color: 'red' }}
                      />
                    ) : null
                  }
                >
                  <Form.Item
                    {...restField}
                    label={translate('level_number')}
                    name={[name, 'levelNumber']}
                    rules={[{ required: true, message: translate('level_number_required') }]}
                  >
                    <InputNumber min={1} max={10} style={{ width: '100%' }} />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    label={translate('level_name')}
                    name={[name, 'levelName']}
                    rules={[{ required: true, message: translate('level_name_required') }]}
                  >
                    <Input placeholder={translate('e.g._department_manager')} />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    label={translate('approver_roles')}
                    name={[name, 'approverRoles']}
                    rules={[{ required: true, message: translate('approver_roles_required') }]}
                  >
                    <Select
                      mode="multiple"
                      placeholder={translate('select_roles')}
                      loading={loading}
                      options={roles.map(role => ({
                        label: role.displayName?.en || role.name,
                        value: role._id,
                      }))}
                    />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    label={translate('approval_mode')}
                    name={[name, 'approvalMode']}
                    initialValue="any"
                    tooltip={translate('any_one_approver_or_all_approvers')}
                  >
                    <Select>
                      <Select.Option value="any">{translate('any_one_approver')}</Select.Option>
                      <Select.Option value="all">{translate('all_approvers')}</Select.Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    label={translate('is_mandatory')}
                    name={[name, 'isMandatory']}
                    valuePropName="checked"
                    initialValue={true}
                  >
                    <Switch />
                  </Form.Item>
                </Card>
              ))}
              <Form.Item>
                <Button 
                  type="dashed" 
                  onClick={() => add()} 
                  block 
                  icon={<PlusOutlined />}
                >
                  {translate('add_approval_level')}
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Card>

      <Card
        title={translate('routing_rules')}
        size="small"
        style={{ marginBottom: 16 }}
      >
        <Form.List name="routingRules">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Card
                  key={key}
                  type="inner"
                  size="small"
                  style={{ marginBottom: 16 }}
                  title={`${translate('rule')} ${name + 1}`}
                  extra={
                    <MinusCircleOutlined
                      onClick={() => remove(name)}
                      style={{ color: 'red' }}
                    />
                  }
                >
                  <Form.Item
                    {...restField}
                    label={translate('condition_type')}
                    name={[name, 'conditionType']}
                    rules={[{ required: true, message: translate('condition_type_required') }]}
                  >
                    <Select
                      placeholder={translate('select_condition_type')}
                      options={conditionTypeOptions}
                    />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    label={translate('operator')}
                    name={[name, 'operator']}
                    rules={[{ required: true, message: translate('operator_required') }]}
                  >
                    <Select
                      placeholder={translate('select_operator')}
                      options={operatorOptions}
                    />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    label={translate('condition_value')}
                    name={[name, 'value']}
                    rules={[{ required: true, message: translate('condition_value_required') }]}
                  >
                    <Input placeholder={translate('enter_value')} />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    label={translate('target_levels')}
                    name={[name, 'targetLevels']}
                    rules={[{ required: true, message: translate('target_levels_required') }]}
                    extra={translate('routing_rules_target_levels_help')}
                  >
                    <Select
                      mode="multiple"
                      placeholder={translate('select_target_levels')}
                      options={levels
                        .map(level => level?.levelNumber)
                        .filter(Boolean)
                        .map(levelNumber => ({
                          label: `Level ${levelNumber}`,
                          value: levelNumber,
                        }))}
                    />
                  </Form.Item>
                </Card>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                >
                  {translate('add_routing_rule')}
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
        <Divider />
        <div style={{ color: '#888', fontSize: 12 }}>
          {translate('routing_rules_help_text')}
        </div>
      </Card>
    </>
  );
}


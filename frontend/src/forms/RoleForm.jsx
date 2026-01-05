import { Form, Input, Select, Transfer } from 'antd';
import { useState, useEffect } from 'react';
import useLanguage from '@/locale/useLanguage';
import { request } from '@/request';

const { TextArea } = Input;

export default function RoleForm({ isUpdateForm = false, current = null }) {
  const translate = useLanguage();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch available permissions
    const fetchPermissions = async () => {
      setLoading(true);
      try {
        const response = await request.list({ entity: 'permission' });
        if (response.success) {
          const permissionData = response.result.map(p => ({
            key: p._id,
            title: `${p.resource}.${p.action} (${p.scope})`,
            description: p.description || `${p.action} on ${p.resource}`,
          }));
          setPermissions(permissionData);
        }
      } catch (error) {
        console.error('Error fetching permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  return (
    <>
      <Form.Item
        label={translate('role_name')}
        name="name"
        rules={[
          {
            required: true,
            message: translate('please_input_role_name'),
          },
          {
            pattern: /^[a-z_]+$/,
            message: translate('role_name_format'),
          },
        ]}
        tooltip={translate('use_lowercase_and_underscores')}
      >
        <Input 
          placeholder="e.g., procurement_manager" 
          autoComplete="off"
          disabled={isUpdateForm} 
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
          placeholder="例如：采购经理" 
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
          placeholder="e.g., Procurement Manager" 
          autoComplete="off" 
        />
      </Form.Item>

      <Form.Item
        label={translate('description')}
        name="description"
      >
        <TextArea 
          rows={3}
          placeholder={translate('role_description_placeholder')}
          autoComplete="off" 
        />
      </Form.Item>

      <Form.Item
        label={translate('permissions')}
        name="permissions"
        tooltip={translate('select_permissions_for_role')}
      >
        <Select
          mode="multiple"
          placeholder={translate('select_permissions')}
          loading={loading}
          showSearch
          optionFilterProp="children"
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={permissions.map(p => ({
            label: p.title,
            value: p.key,
          }))}
        />
      </Form.Item>

      {!isUpdateForm && (
        <Form.Item
          label={translate('inherits_from')}
          name="inheritsFrom"
          tooltip={translate('inherit_permissions_from_other_roles')}
        >
          <Select
            mode="multiple"
            placeholder={translate('select_parent_roles')}
            allowClear
          >
            {/* This will be populated with existing roles */}
          </Select>
        </Form.Item>
      )}
    </>
  );
}


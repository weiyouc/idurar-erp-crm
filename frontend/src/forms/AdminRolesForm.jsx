import { Form, Input, Select, Switch } from 'antd';
import { useEffect, useState } from 'react';
import useLanguage from '@/locale/useLanguage';
import { request } from '@/request';

export default function AdminRolesForm({ isUpdateForm = false, current = null }) {
  const translate = useLanguage();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const form = Form.useFormInstance();

  useEffect(() => {
    const fetchRoles = async () => {
      setLoading(true);
      try {
        const response = await request.get({ entity: 'roles' });
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

  useEffect(() => {
    if (current?.roles && Array.isArray(current.roles)) {
      const roleIds = current.roles.map(role => role?._id).filter(Boolean);
      form.setFieldsValue({ roles: roleIds });
    }
  }, [current, form]);

  return (
    <>
      <Form.Item label={translate('first Name')} name="name">
        <Input autoComplete="off" disabled={isUpdateForm} />
      </Form.Item>
      <Form.Item label={translate('last Name')} name="surname">
        <Input autoComplete="off" disabled={isUpdateForm} />
      </Form.Item>
      <Form.Item label={translate('email')} name="email">
        <Input autoComplete="off" disabled={isUpdateForm} />
      </Form.Item>

      <Form.Item
        label={translate('roles')}
        name="roles"
        rules={[{ required: true, message: translate('required_field') }]}
      >
        <Select
          mode="multiple"
          placeholder={translate('select_roles')}
          loading={loading}
          options={roles.map(role => ({
            label: role.displayName?.en || role.name,
            value: role._id
          }))}
        />
      </Form.Item>

      <Form.Item
        label={translate('enabled')}
        name="enabled"
        valuePropName="checked"
        initialValue={true}
      >
        <Switch />
      </Form.Item>
    </>
  );
}

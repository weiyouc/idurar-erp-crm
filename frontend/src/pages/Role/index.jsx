import useLanguage from '@/locale/useLanguage';
import RoleModule from '@/modules/RoleModule';

export default function RolePage() {
  const translate = useLanguage();

  const entity = 'roles';

  const Labels = {
    PANEL_TITLE: translate('roles'),
    DATATABLE_TITLE: translate('roles_list'),
    ADD_NEW_ENTITY: translate('add_new_role'),
    ENTITY_NAME: translate('role'),
  };

  const configPage = {
    entity,
    ...Labels,
  };

  return <RoleModule config={configPage} />;
}


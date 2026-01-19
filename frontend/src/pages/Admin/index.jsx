import useLanguage from '@/locale/useLanguage';
import AdminModule from '@/modules/AdminModule';

export default function AdminPage() {
  const translate = useLanguage();

  const entity = 'admin';

  const Labels = {
    PANEL_TITLE: translate('users'),
    DATATABLE_TITLE: translate('users_list'),
    ADD_NEW_ENTITY: translate('add_new_user'),
    ENTITY_NAME: translate('user'),
  };

  const configPage = {
    entity,
    ...Labels,
  };

  return <AdminModule config={configPage} />;
}

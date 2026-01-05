import useLanguage from '@/locale/useLanguage';
import WorkflowModule from '@/modules/WorkflowModule';

export default function WorkflowPage() {
  const translate = useLanguage();

  const entity = 'workflows';

  const Labels = {
    PANEL_TITLE: translate('workflows'),
    DATATABLE_TITLE: translate('workflows_list'),
    ADD_NEW_ENTITY: translate('add_new_workflow'),
    ENTITY_NAME: translate('workflow'),
  };

  const configPage = {
    entity,
    ...Labels,
  };

  return <WorkflowModule config={configPage} />;
}


import React from 'react';
import { PageHeader } from '@ant-design/pro-layout';
import MaterialQuotationModule from '@/modules/MaterialQuotationModule';

const MaterialQuotationPage = () => {
  return (
    <div>
      <PageHeader
        ghost={false}
        title="Material Quotation Management"
        subTitle="Request and compare supplier quotes for materials"
        style={{ marginBottom: 24 }}
      />
      <MaterialQuotationModule />
    </div>
  );
};

export default MaterialQuotationPage;



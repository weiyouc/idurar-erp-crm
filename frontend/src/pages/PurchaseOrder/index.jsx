import React from 'react';
import PurchaseOrderModule from '@/modules/PurchaseOrderModule';
import { PageHeader } from '@ant-design/pro-layout';

const PurchaseOrderPage = () => {
  return (
    <div>
      <PageHeader
        title="Purchase Order Management"
        subTitle="Manage purchase orders, submit for approval, and track order status"
      />
      <PurchaseOrderModule />
    </div>
  );
};

export default PurchaseOrderPage;





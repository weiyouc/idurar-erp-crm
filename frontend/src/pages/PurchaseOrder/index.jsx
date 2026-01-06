import React from 'react';
import PageWrapper from '@/components/PageWrapper';
import PurchaseOrderModule from '@/modules/PurchaseOrderModule';

const PurchaseOrderPage = () => {
  return (
    <PageWrapper
      title="Purchase Orders"
      description="Manage purchase orders, submit for approval, and track order status"
    >
      <PurchaseOrderModule />
    </PageWrapper>
  );
};

export default PurchaseOrderPage;





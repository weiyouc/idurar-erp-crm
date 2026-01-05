import React from 'react';
import SupplierModule from '@/modules/SupplierModule';
import { PageHeader } from '@ant-design/pro-layout';

const SupplierPage = () => {
  return (
    <div>
      <PageHeader
        title="Supplier Management"
        desc="Manage suppliers, onboard new suppliers, and track performance"
      />
      <SupplierModule />
    </div>
  );
};

export default SupplierPage;


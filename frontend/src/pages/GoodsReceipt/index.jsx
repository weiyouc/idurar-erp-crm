import React from 'react';
import { PageHeader } from '@ant-design/pro-layout';
import GoodsReceiptModule from '@/modules/GoodsReceiptModule';

const GoodsReceiptPage = () => {
  return (
    <div>
      <PageHeader
        ghost={false}
        title="Goods Receipt Management"
        subTitle="Manage material receiving and quality inspection"
        style={{ marginBottom: 24 }}
      />
      <GoodsReceiptModule />
    </div>
  );
};

export default GoodsReceiptPage;



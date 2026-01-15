import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Input } from 'antd';
import { RedoOutlined } from '@ant-design/icons';
import { request } from '@/request';
import useLanguage from '@/locale/useLanguage';

/**
 * SimpleDataTable - A simplified DataTable component that accepts direct props
 * and uses the request API instead of Redux
 * 
 * @param {string} entity - The entity name for API calls
 * @param {Array} columns - Table columns configuration
 * @param {number} refreshKey - Key to trigger refresh when changed
 * @param {Object} filters - Filter options to apply
 * @param {Object} scroll - Scroll configuration for the table
 */
export default function SimpleDataTable({ 
  entity, 
  columns, 
  refreshKey = 0, 
  filters = {}, 
  scroll = { x: true } 
}) {
  const translate = useLanguage();
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showTotal: (total) => `Total ${total} items`,
  });

  const fetchData = useCallback(async (page = 1, pageSize = 10) => {
    if (!entity) {
      console.error('Entity is required for SimpleDataTable');
      return;
    }

    setLoading(true);
    try {
      const options = {
        page,
        items: pageSize,
        ...filters,
      };

      const response = await request.list({
        entity,
        options,
      });

      if (response && response.success) {
        const { result, pagination: paginationData } = response;
        
        // Handle different response formats
        let items = [];
        if (Array.isArray(result)) {
          items = result;
        } else if (result && Array.isArray(result.items)) {
          items = result.items;
        } else if (result && Array.isArray(result.data)) {
          items = result.data;
        }
        
        setDataSource(items);
        setPagination(prev => ({
          ...prev,
          current: paginationData?.current || paginationData?.page || page,
          pageSize: paginationData?.pageSize || paginationData?.items || pageSize,
          total: paginationData?.total || paginationData?.count || items.length,
        }));
      } else {
        setDataSource([]);
        setPagination(prev => ({
          ...prev,
          current: page,
          pageSize,
          total: 0,
        }));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setDataSource([]);
      setPagination(prev => ({
        ...prev,
        current: page,
        pageSize,
        total: 0,
      }));
    } finally {
      setLoading(false);
    }
  }, [entity, filters]);

  useEffect(() => {
    fetchData(pagination.current, pagination.pageSize);
  }, [refreshKey, entity, fetchData]);

  const handleTableChange = (newPagination) => {
    fetchData(newPagination.current, newPagination.pageSize);
  };

  const handleRefresh = () => {
    fetchData(pagination.current, pagination.pageSize);
  };

  if (!entity) {
    return null;
  }

  return (
    <div>
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button 
          icon={<RedoOutlined />} 
          onClick={handleRefresh}
          loading={loading}
        >
          {translate('Refresh') || 'Refresh'}
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey={(record) => record._id || record.id || Math.random()}
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
        scroll={scroll}
      />
    </div>
  );
}

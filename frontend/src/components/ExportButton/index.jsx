import React, { useState } from 'react';
import { Button, Dropdown, message, Tooltip } from 'antd';
import { DownloadOutlined, FileExcelOutlined, LoadingOutlined } from '@ant-design/icons';
import { request } from '@/request';

/**
 * ExportButton Component
 * 
 * A reusable button for exporting data to Excel format.
 * Supports multiple export types and handles loading states.
 * 
 * @param {Object} props
 * @param {string} props.entity - Entity type to export (e.g., 'suppliers', 'materials')
 * @param {string} [props.exportType] - Specific export type (e.g., 'supplier', 'material', 'mrp', 'purchaseOrder', 'inventory')
 * @param {Object} [props.filters={}] - Filters to apply to export
 * @param {string} [props.filename] - Custom filename (without extension)
 * @param {string} [props.buttonText='Export to Excel'] - Button text
 * @param {string} [props.buttonType='default'] - Button type
 * @param {string} [props.size='middle'] - Button size
 * @param {boolean} [props.icon=true] - Show icon
 * @param {boolean} [props.disabled=false] - Disable button
 * @param {Function} [props.onSuccess] - Callback on successful export
 * @param {Function} [props.onError] - Callback on export error
 * @param {Array} [props.exportOptions] - Multiple export options for dropdown
 */
const ExportButton = ({
  entity,
  exportType,
  filters = {},
  filename,
  buttonText = 'Export to Excel',
  buttonType = 'default',
  size = 'middle',
  icon = true,
  disabled = false,
  onSuccess,
  onError,
  exportOptions = null
}) => {
  const [loading, setLoading] = useState(false);

  const performExport = async (type, customFilename) => {
    setLoading(true);
    
    try {
      // Build query parameters
      const params = {
        ...filters,
        exportType: type
      };

      // Make export request
      const response = await request.get({
        entity: `${entity}/export`,
        options: {
          params,
          responseType: 'blob' // Important for file download
        }
      });

      // Create blob and download
      const blob = new Blob([response], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const finalFilename = customFilename || filename || `${type}-export-${timestamp}.xlsx`;
      link.download = finalFilename.endsWith('.xlsx') ? finalFilename : `${finalFilename}.xlsx`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      window.URL.revokeObjectURL(url);

      message.success('Export completed successfully');
      onSuccess && onSuccess(finalFilename);
    } catch (error) {
      console.error('Export error:', error);
      message.error(`Export failed: ${error.message || 'Unknown error'}`);
      onError && onError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    performExport(exportType, filename);
  };

  const handleMenuClick = ({ key }) => {
    const option = exportOptions.find(opt => opt.key === key);
    if (option) {
      performExport(option.exportType, option.filename);
    }
  };

  // If multiple export options provided, render dropdown
  if (exportOptions && exportOptions.length > 0) {
    const menuItems = exportOptions.map(option => ({
      key: option.key,
      label: option.label,
      icon: <FileExcelOutlined />,
      disabled: option.disabled
    }));

    return (
      <Dropdown
        menu={{
          items: menuItems,
          onClick: handleMenuClick
        }}
        disabled={disabled || loading}
      >
        <Button
          type={buttonType}
          size={size}
          loading={loading}
          icon={icon && <DownloadOutlined />}
          disabled={disabled}
        >
          {loading ? 'Exporting...' : buttonText}
        </Button>
      </Dropdown>
    );
  }

  // Single export button
  return (
    <Tooltip title={disabled ? 'Please select items to export' : ''}>
      <Button
        type={buttonType}
        size={size}
        onClick={handleExport}
        loading={loading}
        icon={icon && (loading ? <LoadingOutlined /> : <DownloadOutlined />)}
        disabled={disabled}
      >
        {loading ? 'Exporting...' : buttonText}
      </Button>
    </Tooltip>
  );
};

export default ExportButton;


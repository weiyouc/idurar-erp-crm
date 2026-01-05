/**
 * Excel Export Service
 * 
 * Generates Excel files for various reports including:
 * - Supplier lists
 * - Material/Item lists
 * - MRP (Material Requirements Planning) lists
 * - Purchase Order lists
 * - Inventory lists
 * 
 * Uses ExcelJS library for Excel file generation.
 * 
 * Usage:
 *   const ExcelExportService = require('./services/ExcelExportService');
 *   
 *   // Export supplier list
 *   const buffer = await ExcelExportService.exportSuppliers(suppliers);
 *   res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
 *   res.setHeader('Content-Disposition', 'attachment; filename=suppliers.xlsx');
 *   res.send(buffer);
 */

const ExcelJS = require('exceljs');

class ExcelExportService {
  
  /**
   * Export suppliers to Excel
   * 
   * @param {Array} suppliers - Array of supplier documents
   * @param {Object} [options={}] - Export options
   * @returns {Promise<Buffer>} Excel file buffer
   */
  static async exportSuppliers(suppliers, options = {}) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('供应商清单');
    
    // Define columns based on specification
    worksheet.columns = [
      { header: '序号', key: 'index', width: 8 },
      { header: '供应商代码', key: 'code', width: 15 },
      { header: '供应商名称', key: 'name', width: 25 },
      { header: '联系人', key: 'contactPerson', width: 15 },
      { header: '联系电话', key: 'phone', width: 15 },
      { header: '地址', key: 'address', width: 30 },
      { header: '邮箱', key: 'email', width: 20 },
      { header: '供应类别', key: 'category', width: 15 },
      { header: '合作状态', key: 'status', width: 12 },
      { header: '创建日期', key: 'createdAt', width: 15 },
      { header: '备注', key: 'notes', width: 25 }
    ];
    
    // Style header row
    this._styleHeaderRow(worksheet);
    
    // Add data rows
    suppliers.forEach((supplier, index) => {
      worksheet.addRow({
        index: index + 1,
        code: supplier.code || '',
        name: supplier.name || '',
        contactPerson: supplier.contactPerson || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        email: supplier.email || '',
        category: supplier.category || '',
        status: supplier.enabled ? '正常' : '停用',
        createdAt: supplier.created ? this._formatDate(supplier.created) : '',
        notes: supplier.notes || ''
      });
    });
    
    // Auto-filter
    worksheet.autoFilter = {
      from: 'A1',
      to: `K${suppliers.length + 1}`
    };
    
    return await workbook.xlsx.writeBuffer();
  }
  
  /**
   * Export materials/items to Excel
   * 
   * @param {Array} materials - Array of material documents
   * @param {Object} [options={}] - Export options
   * @returns {Promise<Buffer>} Excel file buffer
   */
  static async exportMaterials(materials, options = {}) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('物料清单');
    
    // Define columns
    worksheet.columns = [
      { header: '序号', key: 'index', width: 8 },
      { header: '物料编码', key: 'code', width: 15 },
      { header: '物料名称', key: 'name', width: 25 },
      { header: '规格型号', key: 'specification', width: 20 },
      { header: '单位', key: 'unit', width: 10 },
      { header: '类别', key: 'category', width: 15 },
      { header: '当前库存', key: 'currentStock', width: 12 },
      { header: '安全库存', key: 'safetyStock', width: 12 },
      { header: '最新采购价', key: 'lastPrice', width: 15 },
      { header: '主供应商', key: 'mainSupplier', width: 20 },
      { header: '状态', key: 'status', width: 12 },
      { header: '备注', key: 'notes', width: 25 }
    ];
    
    this._styleHeaderRow(worksheet);
    
    // Add data rows
    materials.forEach((material, index) => {
      worksheet.addRow({
        index: index + 1,
        code: material.code || '',
        name: material.name || '',
        specification: material.specification || '',
        unit: material.unit || '',
        category: material.category || '',
        currentStock: material.currentStock || 0,
        safetyStock: material.safetyStock || 0,
        lastPrice: material.lastPrice || 0,
        mainSupplier: material.mainSupplier?.name || '',
        status: material.enabled ? '正常' : '停用',
        notes: material.notes || ''
      });
    });
    
    // Format number columns
    worksheet.getColumn('currentStock').numFmt = '#,##0';
    worksheet.getColumn('safetyStock').numFmt = '#,##0';
    worksheet.getColumn('lastPrice').numFmt = '¥#,##0.00';
    
    worksheet.autoFilter = {
      from: 'A1',
      to: `L${materials.length + 1}`
    };
    
    return await workbook.xlsx.writeBuffer();
  }
  
  /**
   * Export MRP (Material Requirements Planning) to Excel
   * 
   * @param {Array} mrpData - Array of MRP calculation results
   * @param {Object} [options={}] - Export options
   * @returns {Promise<Buffer>} Excel file buffer
   */
  static async exportMRP(mrpData, options = {}) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('MRP清单');
    
    // Define columns
    worksheet.columns = [
      { header: '序号', key: 'index', width: 8 },
      { header: '物料编码', key: 'materialCode', width: 15 },
      { header: '物料名称', key: 'materialName', width: 25 },
      { header: '规格型号', key: 'specification', width: 20 },
      { header: '单位', key: 'unit', width: 10 },
      { header: '需求数量', key: 'demandQuantity', width: 12 },
      { header: '当前库存', key: 'currentStock', width: 12 },
      { header: '在途数量', key: 'inTransit', width: 12 },
      { header: '安全库存', key: 'safetyStock', width: 12 },
      { header: '建议采购量', key: 'suggestedOrder', width: 15 },
      { header: '需求日期', key: 'requireDate', width: 15 },
      { header: '优先级', key: 'priority', width: 10 },
      { header: '备注', key: 'notes', width: 25 }
    ];
    
    this._styleHeaderRow(worksheet);
    
    // Add data rows
    mrpData.forEach((item, index) => {
      const row = worksheet.addRow({
        index: index + 1,
        materialCode: item.materialCode || '',
        materialName: item.materialName || '',
        specification: item.specification || '',
        unit: item.unit || '',
        demandQuantity: item.demandQuantity || 0,
        currentStock: item.currentStock || 0,
        inTransit: item.inTransit || 0,
        safetyStock: item.safetyStock || 0,
        suggestedOrder: item.suggestedOrder || 0,
        requireDate: item.requireDate ? this._formatDate(item.requireDate) : '',
        priority: this._getPriorityText(item.priority),
        notes: item.notes || ''
      });
      
      // Highlight urgent items
      if (item.priority === 'high' || item.priority === 'urgent') {
        row.getCell('priority').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFF0000' }
        };
        row.getCell('priority').font = { color: { argb: 'FFFFFFFF' }, bold: true };
      }
    });
    
    // Format number columns
    ['demandQuantity', 'currentStock', 'inTransit', 'safetyStock', 'suggestedOrder'].forEach(col => {
      worksheet.getColumn(col).numFmt = '#,##0';
    });
    
    worksheet.autoFilter = {
      from: 'A1',
      to: `M${mrpData.length + 1}`
    };
    
    return await workbook.xlsx.writeBuffer();
  }
  
  /**
   * Export purchase orders to Excel
   * 
   * @param {Array} purchaseOrders - Array of purchase order documents
   * @param {Object} [options={}] - Export options
   * @returns {Promise<Buffer>} Excel file buffer
   */
  static async exportPurchaseOrders(purchaseOrders, options = {}) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('采购订单清单');
    
    // Define columns
    worksheet.columns = [
      { header: '序号', key: 'index', width: 8 },
      { header: '订单编号', key: 'orderNumber', width: 18 },
      { header: '供应商', key: 'supplier', width: 25 },
      { header: '订单日期', key: 'orderDate', width: 15 },
      { header: '交货日期', key: 'deliveryDate', width: 15 },
      { header: '总金额', key: 'totalAmount', width: 15 },
      { header: '币种', key: 'currency', width: 10 },
      { header: '状态', key: 'status', width: 12 },
      { header: '采购员', key: 'purchaser', width: 15 },
      { header: '审批状态', key: 'approvalStatus', width: 12 },
      { header: '创建日期', key: 'createdAt', width: 15 },
      { header: '备注', key: 'notes', width: 25 }
    ];
    
    this._styleHeaderRow(worksheet);
    
    // Add data rows
    purchaseOrders.forEach((order, index) => {
      worksheet.addRow({
        index: index + 1,
        orderNumber: order.orderNumber || '',
        supplier: order.supplier?.name || '',
        orderDate: order.orderDate ? this._formatDate(order.orderDate) : '',
        deliveryDate: order.deliveryDate ? this._formatDate(order.deliveryDate) : '',
        totalAmount: order.totalAmount || 0,
        currency: order.currency || 'CNY',
        status: this._getOrderStatusText(order.status),
        purchaser: order.purchaser?.name || '',
        approvalStatus: this._getApprovalStatusText(order.approvalStatus),
        createdAt: order.created ? this._formatDate(order.created) : '',
        notes: order.notes || ''
      });
    });
    
    // Format currency column
    worksheet.getColumn('totalAmount').numFmt = '¥#,##0.00';
    
    worksheet.autoFilter = {
      from: 'A1',
      to: `L${purchaseOrders.length + 1}`
    };
    
    return await workbook.xlsx.writeBuffer();
  }
  
  /**
   * Export inventory to Excel
   * 
   * @param {Array} inventory - Array of inventory records
   * @param {Object} [options={}] - Export options
   * @returns {Promise<Buffer>} Excel file buffer
   */
  static async exportInventory(inventory, options = {}) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('库存清单');
    
    // Define columns
    worksheet.columns = [
      { header: '序号', key: 'index', width: 8 },
      { header: '物料编码', key: 'materialCode', width: 15 },
      { header: '物料名称', key: 'materialName', width: 25 },
      { header: '规格型号', key: 'specification', width: 20 },
      { header: '单位', key: 'unit', width: 10 },
      { header: '仓库', key: 'warehouse', width: 15 },
      { header: '库位', key: 'location', width: 12 },
      { header: '当前数量', key: 'quantity', width: 12 },
      { header: '可用数量', key: 'availableQuantity', width: 12 },
      { header: '锁定数量', key: 'lockedQuantity', width: 12 },
      { header: '单价', key: 'unitPrice', width: 12 },
      { header: '总价值', key: 'totalValue', width: 15 },
      { header: '最后入库日期', key: 'lastInboundDate', width: 15 },
      { header: '批次号', key: 'batchNumber', width: 15 },
      { header: '备注', key: 'notes', width: 25 }
    ];
    
    this._styleHeaderRow(worksheet);
    
    // Add data rows
    inventory.forEach((item, index) => {
      worksheet.addRow({
        index: index + 1,
        materialCode: item.materialCode || '',
        materialName: item.materialName || '',
        specification: item.specification || '',
        unit: item.unit || '',
        warehouse: item.warehouse || '',
        location: item.location || '',
        quantity: item.quantity || 0,
        availableQuantity: item.availableQuantity || 0,
        lockedQuantity: item.lockedQuantity || 0,
        unitPrice: item.unitPrice || 0,
        totalValue: (item.quantity || 0) * (item.unitPrice || 0),
        lastInboundDate: item.lastInboundDate ? this._formatDate(item.lastInboundDate) : '',
        batchNumber: item.batchNumber || '',
        notes: item.notes || ''
      });
    });
    
    // Format number columns
    ['quantity', 'availableQuantity', 'lockedQuantity'].forEach(col => {
      worksheet.getColumn(col).numFmt = '#,##0';
    });
    worksheet.getColumn('unitPrice').numFmt = '¥#,##0.00';
    worksheet.getColumn('totalValue').numFmt = '¥#,##0.00';
    
    worksheet.autoFilter = {
      from: 'A1',
      to: `O${inventory.length + 1}`
    };
    
    return await workbook.xlsx.writeBuffer();
  }
  
  /**
   * Export custom data with specified columns
   * 
   * @param {Array} data - Array of data objects
   * @param {Array} columns - Column definitions
   * @param {string} sheetName - Worksheet name
   * @param {Object} [options={}] - Export options
   * @returns {Promise<Buffer>} Excel file buffer
   */
  static async exportCustom(data, columns, sheetName, options = {}) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);
    
    worksheet.columns = columns;
    this._styleHeaderRow(worksheet);
    
    data.forEach(item => {
      worksheet.addRow(item);
    });
    
    if (options.autoFilter !== false) {
      const lastCol = String.fromCharCode(65 + columns.length - 1);
      worksheet.autoFilter = {
        from: 'A1',
        to: `${lastCol}${data.length + 1}`
      };
    }
    
    return await workbook.xlsx.writeBuffer();
  }
  
  /**
   * Style header row
   * @private
   */
  static _styleHeaderRow(worksheet) {
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 20;
  }
  
  /**
   * Format date to YYYY-MM-DD
   * @private
   */
  static _formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  /**
   * Get priority text in Chinese
   * @private
   */
  static _getPriorityText(priority) {
    const map = {
      urgent: '紧急',
      high: '高',
      medium: '中',
      low: '低'
    };
    return map[priority] || '中';
  }
  
  /**
   * Get order status text in Chinese
   * @private
   */
  static _getOrderStatusText(status) {
    const map = {
      draft: '草稿',
      submitted: '已提交',
      confirmed: '已确认',
      in_production: '生产中',
      shipped: '已发货',
      received: '已收货',
      completed: '已完成',
      cancelled: '已取消'
    };
    return map[status] || status;
  }
  
  /**
   * Get approval status text in Chinese
   * @private
   */
  static _getApprovalStatusText(status) {
    const map = {
      pending: '待审批',
      approved: '已批准',
      rejected: '已拒绝'
    };
    return map[status] || status;
  }
  
}

module.exports = ExcelExportService;


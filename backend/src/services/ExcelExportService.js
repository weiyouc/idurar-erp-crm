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
  
  /**
   * Export materials to Excel
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
      { header: '物料编号', key: 'materialNumber', width: 15 },
      { header: '物料名称(中文)', key: 'nameZh', width: 25 },
      { header: '物料名称(英文)', key: 'nameEn', width: 25 },
      { header: '物料分类', key: 'category', width: 15 },
      { header: '物料类型', key: 'type', width: 12 },
      { header: '状态', key: 'status', width: 10 },
      { header: '基本单位', key: 'baseUOM', width: 10 },
      { header: '规格型号', key: 'model', width: 15 },
      { header: '品牌', key: 'brand', width: 12 },
      { header: '制造商', key: 'manufacturer', width: 20 },
      { header: '标准成本', key: 'cost', width: 12 },
      { header: '币种', key: 'currency', width: 8 },
      { header: '安全库存', key: 'safetyStock', width: 12 },
      { header: '再订购点', key: 'reorderPoint', width: 12 },
      { header: '最小订货量', key: 'minOrderQty', width: 12 },
      { header: '默认交期(天)', key: 'leadTime', width: 12 },
      { header: 'HS代码', key: 'hsCode', width: 15 },
      { header: '备注', key: 'description', width: 30 }
    ];
    
    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;
    
    // Add data rows
    materials.forEach((material, index) => {
      const category = material.category?.name?.zh || material.category?.code || '-';
      const nameZh = material.materialName?.zh || '-';
      const nameEn = material.materialName?.en || '-';
      
      worksheet.addRow({
        index: index + 1,
        materialNumber: material.materialNumber || '-',
        nameZh,
        nameEn,
        category,
        type: this._getMaterialTypeText(material.type),
        status: this._getMaterialStatusText(material.status),
        baseUOM: material.baseUOM || '-',
        model: material.model || '-',
        brand: material.brand || '-',
        manufacturer: material.manufacturer || '-',
        cost: material.standardCost || 0,
        currency: material.currency || 'CNY',
        safetyStock: material.safetyStock || 0,
        reorderPoint: material.reorderPoint || 0,
        minOrderQty: material.minimumOrderQty || 1,
        leadTime: material.defaultLeadTime || 0,
        hsCode: material.hsCode || '-',
        description: material.description || '-'
      });
    });
    
    // Apply number formatting
    worksheet.getColumn('cost').numFmt = '¥#,##0.00';
    worksheet.getColumn('safetyStock').numFmt = '#,##0';
    worksheet.getColumn('reorderPoint').numFmt = '#,##0';
    worksheet.getColumn('minOrderQty').numFmt = '#,##0';
    
    // Apply borders to all cells
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });
    
    // Add auto-filter
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 19 }
    };
    
    // Generate buffer
    return await workbook.xlsx.writeBuffer();
  }
  
  /**
   * Export material categories to Excel
   * 
   * @param {Array} categories - Array of category documents
   * @param {Object} [options={}] - Export options
   * @returns {Promise<Buffer>} Excel file buffer
   */
  static async exportMaterialCategories(categories, options = {}) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('物料分类清单');
    
    // Define columns
    worksheet.columns = [
      { header: '序号', key: 'index', width: 8 },
      { header: '分类代码', key: 'code', width: 15 },
      { header: '分类名称(中文)', key: 'nameZh', width: 25 },
      { header: '分类名称(英文)', key: 'nameEn', width: 25 },
      { header: '父分类', key: 'parentCategory', width: 20 },
      { header: '层级', key: 'level', width: 8 },
      { header: '路径', key: 'path', width: 30 },
      { header: '状态', key: 'status', width: 10 },
      { header: '排序序号', key: 'displayOrder', width: 10 },
      { header: '描述', key: 'description', width: 30 },
      { header: '创建日期', key: 'createdAt', width: 15 }
    ];
    
    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;
    
    // Add data rows
    categories.forEach((category, index) => {
      const nameZh = category.name?.zh || '-';
      const nameEn = category.name?.en || '-';
      const parentName = category.parent?.name?.zh || category.parent?.code || '-';
      
      worksheet.addRow({
        index: index + 1,
        code: category.code || '-',
        nameZh,
        nameEn,
        parentCategory: parentName,
        level: category.level || 0,
        path: category.path || '/',
        status: category.isActive ? '启用' : '停用',
        displayOrder: category.displayOrder || 0,
        description: category.description || '-',
        createdAt: category.createdAt ? category.createdAt.toISOString().split('T')[0] : '-'
      });
    });
    
    // Apply borders to all cells
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });
    
    // Add auto-filter
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 11 }
    };
    
    // Generate buffer
    return await workbook.xlsx.writeBuffer();
  }
  
  /**
   * Get material type text in Chinese
   * @private
   */
  static _getMaterialTypeText(type) {
    const map = {
      raw: '原材料',
      'semi-finished': '半成品',
      finished: '成品',
      packaging: '包装材料',
      consumable: '耗材',
      other: '其他'
    };
    return map[type] || type;
  }
  
  /**
   * Get material status text in Chinese
   * @private
   */
  static _getMaterialStatusText(status) {
    const map = {
      draft: '草稿',
      active: '启用',
      obsolete: '停用',
      discontinued: '已停产'
    };
    return map[status] || status;
  }
  
  /**
   * Export goods receipts to Excel
   */
  static async exportGoodsReceipts(receipts, options = {}) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('收货单清单');
    
    // Define columns
    worksheet.columns = [
      { header: '收货单号', key: 'receiptNumber', width: 20 },
      { header: '采购订单号', key: 'poNumber', width: 20 },
      { header: '供应商', key: 'supplierName', width: 25 },
      { header: '收货日期', key: 'receiptDate', width: 15 },
      { header: '状态', key: 'status', width: 12 },
      { header: '已收数量', key: 'totalReceived', width: 12 },
      { header: '合格数量', key: 'totalAccepted', width: 12 },
      { header: '不合格数量', key: 'totalRejected', width: 12 },
      { header: '完成率', key: 'completionPercentage', width: 12 },
      { header: '合格率', key: 'acceptanceRate', width: 12 },
      { header: '质检结果', key: 'qualityResult', width: 15 },
      { header: '创建人', key: 'createdBy', width: 15 },
      { header: '创建时间', key: 'createdAt', width: 18 },
      { header: '备注', key: 'notes', width: 30 }
    ];
    
    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    
    // Add data
    receipts.forEach(receipt => {
      const row = worksheet.addRow({
        receiptNumber: receipt.receiptNumber,
        poNumber: receipt.poNumber,
        supplierName: receipt.supplier?.companyName?.zh || receipt.supplier?.companyName?.en || '',
        receiptDate: receipt.receiptDate ? this._formatDate(receipt.receiptDate) : '',
        status: this._getReceiptStatusText(receipt.status),
        totalReceived: receipt.totalReceived || 0,
        totalAccepted: receipt.totalAccepted || 0,
        totalRejected: receipt.totalRejected || 0,
        completionPercentage: `${receipt.completionPercentage || 0}%`,
        acceptanceRate: `${receipt.acceptanceRate || 0}%`,
        qualityResult: this._getQualityResultText(receipt.qualityInspection?.result),
        createdBy: receipt.createdBy?.name || '',
        createdAt: receipt.createdAt ? this._formatDateTime(receipt.createdAt) : '',
        notes: receipt.notes || ''
      });
      
      // Color code by status
      if (receipt.status === 'completed') {
        row.getCell('status').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD4EDDA' }
        };
      } else if (receipt.status === 'cancelled') {
        row.getCell('status').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8D7DA' }
        };
      }
      
      // Center align numeric columns
      row.getCell('totalReceived').alignment = { horizontal: 'center' };
      row.getCell('totalAccepted').alignment = { horizontal: 'center' };
      row.getCell('totalRejected').alignment = { horizontal: 'center' };
      row.getCell('completionPercentage').alignment = { horizontal: 'center' };
      row.getCell('acceptanceRate').alignment = { horizontal: 'center' };
    });
    
    // Add borders to all cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });
    
    return workbook;
  }
  
  /**
   * Get receipt status text in Chinese
   * @private
   */
  static _getReceiptStatusText(status) {
    const map = {
      draft: '草稿',
      completed: '已完成',
      cancelled: '已取消'
    };
    return map[status] || status;
  }
  
  /**
   * Get quality result text in Chinese
   * @private
   */
  static _getQualityResultText(result) {
    if (!result) return '未检验';
    const map = {
      pending: '待检验',
      passed: '合格',
      failed: '不合格',
      partial: '部分合格'
    };
    return map[result] || result;
  }
  
}

module.exports = ExcelExportService;


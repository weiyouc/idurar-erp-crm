/**
 * ExcelExportService Tests
 * 
 * Tests for Excel export functionality.
 */

const ExcelExportService = require('../../src/services/ExcelExportService');
const ExcelJS = require('exceljs');

describe('ExcelExportService', () => {
  
  describe('exportSuppliers()', () => {
    
    test('should export supplier list to Excel buffer', async () => {
      const suppliers = [
        {
          code: 'SUP001',
          name: 'Supplier A',
          contactPerson: 'John Doe',
          phone: '123-456-7890',
          address: '123 Main St',
          email: 'john@supplier-a.com',
          category: 'Electronics',
          enabled: true,
          created: new Date('2026-01-01'),
          notes: 'Good supplier'
        },
        {
          code: 'SUP002',
          name: 'Supplier B',
          contactPerson: 'Jane Smith',
          phone: '098-765-4321',
          address: '456 Oak Ave',
          email: 'jane@supplier-b.com',
          category: 'Materials',
          enabled: false,
          created: new Date('2026-01-02'),
          notes: ''
        }
      ];
      
      const buffer = await ExcelExportService.exportSuppliers(suppliers);
      
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      
      // Verify Excel structure
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      
      const worksheet = workbook.getWorksheet('供应商清单');
      expect(worksheet).toBeDefined();
      expect(worksheet.rowCount).toBe(3); // Header + 2 data rows
    });
    
    test('should handle empty supplier list', async () => {
      const buffer = await ExcelExportService.exportSuppliers([]);
      
      expect(buffer).toBeInstanceOf(Buffer);
      
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      
      const worksheet = workbook.getWorksheet('供应商清单');
      expect(worksheet.rowCount).toBe(1); // Header only
    });
    
    test('should handle suppliers with missing fields', async () => {
      const suppliers = [
        {
          name: 'Minimal Supplier'
        }
      ];
      
      const buffer = await ExcelExportService.exportSuppliers(suppliers);
      
      expect(buffer).toBeInstanceOf(Buffer);
    });
    
  });
  
  describe('exportMaterials()', () => {
    
    test('should export material list to Excel buffer', async () => {
      const materials = [
        {
          code: 'MAT001',
          name: 'Material A',
          specification: 'Type 1',
          unit: 'kg',
          category: 'Raw Materials',
          currentStock: 100,
          safetyStock: 20,
          lastPrice: 50.00,
          mainSupplier: { name: 'Supplier A' },
          enabled: true,
          notes: 'Important material'
        },
        {
          code: 'MAT002',
          name: 'Material B',
          specification: 'Type 2',
          unit: 'pcs',
          category: 'Components',
          currentStock: 500,
          safetyStock: 100,
          lastPrice: 10.50,
          mainSupplier: null,
          enabled: false,
          notes: ''
        }
      ];
      
      const buffer = await ExcelExportService.exportMaterials(materials);
      
      expect(buffer).toBeInstanceOf(Buffer);
      
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      
      const worksheet = workbook.getWorksheet('物料清单');
      expect(worksheet).toBeDefined();
      expect(worksheet.rowCount).toBe(3);
    });
    
    test('should format currency columns correctly', async () => {
      const materials = [
        {
          code: 'MAT001',
          name: 'Material A',
          lastPrice: 1234.56
        }
      ];
      
      const buffer = await ExcelExportService.exportMaterials(materials);
      
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      
      const worksheet = workbook.getWorksheet('物料清单');
      const priceColumn = worksheet.getColumn(9); // lastPrice is column 9
      
      expect(priceColumn.numFmt).toBe('¥#,##0.00');
    });
    
    test('should handle empty material list', async () => {
      const buffer = await ExcelExportService.exportMaterials([]);
      
      expect(buffer).toBeInstanceOf(Buffer);
      
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      
      const worksheet = workbook.getWorksheet('物料清单');
      expect(worksheet.rowCount).toBe(1);
    });
    
  });
  
  describe('exportMRP()', () => {
    
    test('should export MRP list to Excel buffer', async () => {
      const mrpData = [
        {
          materialCode: 'MAT001',
          materialName: 'Material A',
          specification: 'Type 1',
          unit: 'kg',
          demandQuantity: 200,
          currentStock: 100,
          inTransit: 50,
          safetyStock: 20,
          suggestedOrder: 70,
          requireDate: new Date('2026-02-01'),
          priority: 'high',
          notes: 'Urgent order'
        },
        {
          materialCode: 'MAT002',
          materialName: 'Material B',
          specification: 'Type 2',
          unit: 'pcs',
          demandQuantity: 1000,
          currentStock: 800,
          inTransit: 0,
          safetyStock: 100,
          suggestedOrder: 300,
          requireDate: new Date('2026-02-15'),
          priority: 'medium',
          notes: ''
        }
      ];
      
      const buffer = await ExcelExportService.exportMRP(mrpData);
      
      expect(buffer).toBeInstanceOf(Buffer);
      
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      
      const worksheet = workbook.getWorksheet('MRP清单');
      expect(worksheet).toBeDefined();
      expect(worksheet.rowCount).toBe(3);
    });
    
    test('should highlight high priority items', async () => {
      const mrpData = [
        {
          materialCode: 'MAT001',
          materialName: 'Material A',
          priority: 'urgent',
          requireDate: new Date('2026-02-01')
        }
      ];
      
      const buffer = await ExcelExportService.exportMRP(mrpData);
      
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      
      const worksheet = workbook.getWorksheet('MRP清单');
      const priorityCell = worksheet.getRow(2).getCell(12); // priority is column 12
      
      expect(priorityCell.fill).toBeDefined();
      expect(priorityCell.fill.fgColor.argb).toBe('FFFF0000');
    });
    
    test('should format number columns correctly', async () => {
      const mrpData = [
        {
          materialCode: 'MAT001',
          demandQuantity: 1000,
          suggestedOrder: 500
        }
      ];
      
      const buffer = await ExcelExportService.exportMRP(mrpData);
      
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      
      const worksheet = workbook.getWorksheet('MRP清单');
      const demandColumn = worksheet.getColumn(6); // demandQuantity is column 6
      
      expect(demandColumn.numFmt).toBe('#,##0');
    });
    
    test('should handle empty MRP data', async () => {
      const buffer = await ExcelExportService.exportMRP([]);
      
      expect(buffer).toBeInstanceOf(Buffer);
      
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      
      const worksheet = workbook.getWorksheet('MRP清单');
      expect(worksheet.rowCount).toBe(1);
    });
    
  });
  
  describe('exportPurchaseOrders()', () => {
    
    test('should export purchase order list to Excel buffer', async () => {
      const purchaseOrders = [
        {
          orderNumber: 'PO-2026-001',
          supplier: { name: 'Supplier A' },
          orderDate: new Date('2026-01-10'),
          deliveryDate: new Date('2026-02-10'),
          totalAmount: 10000.00,
          currency: 'CNY',
          status: 'confirmed',
          purchaser: { name: 'John Doe' },
          approvalStatus: 'approved',
          created: new Date('2026-01-09'),
          notes: 'Standard order'
        },
        {
          orderNumber: 'PO-2026-002',
          supplier: { name: 'Supplier B' },
          orderDate: new Date('2026-01-11'),
          deliveryDate: new Date('2026-02-11'),
          totalAmount: 5000.00,
          currency: 'USD',
          status: 'draft',
          purchaser: { name: 'Jane Smith' },
          approvalStatus: 'pending',
          created: new Date('2026-01-11'),
          notes: ''
        }
      ];
      
      const buffer = await ExcelExportService.exportPurchaseOrders(purchaseOrders);
      
      expect(buffer).toBeInstanceOf(Buffer);
      
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      
      const worksheet = workbook.getWorksheet('采购订单清单');
      expect(worksheet).toBeDefined();
      expect(worksheet.rowCount).toBe(3);
    });
    
    test('should format currency column', async () => {
      const purchaseOrders = [
        {
          orderNumber: 'PO-2026-001',
          totalAmount: 12345.67
        }
      ];
      
      const buffer = await ExcelExportService.exportPurchaseOrders(purchaseOrders);
      
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      
      const worksheet = workbook.getWorksheet('采购订单清单');
      const amountColumn = worksheet.getColumn(6); // totalAmount is column 6
      
      expect(amountColumn.numFmt).toBe('¥#,##0.00');
    });
    
    test('should handle empty purchase order list', async () => {
      const buffer = await ExcelExportService.exportPurchaseOrders([]);
      
      expect(buffer).toBeInstanceOf(Buffer);
      
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      
      const worksheet = workbook.getWorksheet('采购订单清单');
      expect(worksheet.rowCount).toBe(1);
    });
    
  });
  
  describe('exportInventory()', () => {
    
    test('should export inventory list to Excel buffer', async () => {
      const inventory = [
        {
          materialCode: 'MAT001',
          materialName: 'Material A',
          specification: 'Type 1',
          unit: 'kg',
          warehouse: 'Warehouse A',
          location: 'A-01-01',
          quantity: 100,
          availableQuantity: 80,
          lockedQuantity: 20,
          unitPrice: 50.00,
          lastInboundDate: new Date('2026-01-15'),
          batchNumber: 'BATCH-001',
          notes: 'Good condition'
        },
        {
          materialCode: 'MAT002',
          materialName: 'Material B',
          specification: 'Type 2',
          unit: 'pcs',
          warehouse: 'Warehouse B',
          location: 'B-02-03',
          quantity: 500,
          availableQuantity: 450,
          lockedQuantity: 50,
          unitPrice: 10.00,
          lastInboundDate: new Date('2026-01-10'),
          batchNumber: 'BATCH-002',
          notes: ''
        }
      ];
      
      const buffer = await ExcelExportService.exportInventory(inventory);
      
      expect(buffer).toBeInstanceOf(Buffer);
      
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      
      const worksheet = workbook.getWorksheet('库存清单');
      expect(worksheet).toBeDefined();
      expect(worksheet.rowCount).toBe(3);
    });
    
    test('should calculate total value correctly', async () => {
      const inventory = [
        {
          materialCode: 'MAT001',
          quantity: 100,
          unitPrice: 50.00
        }
      ];
      
      const buffer = await ExcelExportService.exportInventory(inventory);
      
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      
      const worksheet = workbook.getWorksheet('库存清单');
      const totalValueCell = worksheet.getRow(2).getCell(12); // totalValue is column 12
      
      expect(totalValueCell.value).toBe(5000.00);
    });
    
    test('should format currency columns', async () => {
      const inventory = [
        {
          materialCode: 'MAT001',
          quantity: 100,
          unitPrice: 50.00
        }
      ];
      
      const buffer = await ExcelExportService.exportInventory(inventory);
      
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      
      const worksheet = workbook.getWorksheet('库存清单');
      const unitPriceColumn = worksheet.getColumn(11); // unitPrice is column 11
      const totalValueColumn = worksheet.getColumn(12); // totalValue is column 12
      
      expect(unitPriceColumn.numFmt).toBe('¥#,##0.00');
      expect(totalValueColumn.numFmt).toBe('¥#,##0.00');
    });
    
    test('should handle empty inventory list', async () => {
      const buffer = await ExcelExportService.exportInventory([]);
      
      expect(buffer).toBeInstanceOf(Buffer);
      
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      
      const worksheet = workbook.getWorksheet('库存清单');
      expect(worksheet.rowCount).toBe(1);
    });
    
  });
  
  describe('exportCustom()', () => {
    
    test('should export custom data with specified columns', async () => {
      const data = [
        { id: 1, name: 'Item 1', value: 100 },
        { id: 2, name: 'Item 2', value: 200 }
      ];
      
      const columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Name', key: 'name', width: 20 },
        { header: 'Value', key: 'value', width: 15 }
      ];
      
      const buffer = await ExcelExportService.exportCustom(data, columns, 'Custom Data');
      
      expect(buffer).toBeInstanceOf(Buffer);
      
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      
      const worksheet = workbook.getWorksheet('Custom Data');
      expect(worksheet).toBeDefined();
      expect(worksheet.rowCount).toBe(3);
    });
    
    test('should apply auto-filter by default', async () => {
      const data = [{ id: 1, name: 'Item 1' }];
      const columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Name', key: 'name', width: 20 }
      ];
      
      const buffer = await ExcelExportService.exportCustom(data, columns, 'Test');
      
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      
      const worksheet = workbook.getWorksheet('Test');
      expect(worksheet.autoFilter).toBeDefined();
    });
    
    test('should disable auto-filter when specified', async () => {
      const data = [{ id: 1, name: 'Item 1' }];
      const columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Name', key: 'name', width: 20 }
      ];
      
      const buffer = await ExcelExportService.exportCustom(
        data,
        columns,
        'Test',
        { autoFilter: false }
      );
      
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      
      const worksheet = workbook.getWorksheet('Test');
      expect(worksheet.autoFilter).toBeUndefined();
    });
    
  });
  
  describe('Helper Methods', () => {
    
    test('_formatDate should format date correctly', () => {
      const formatted = ExcelExportService._formatDate(new Date('2026-01-15'));
      expect(formatted).toBe('2026-01-15');
    });
    
    test('_formatDate should handle null date', () => {
      const formatted = ExcelExportService._formatDate(null);
      expect(formatted).toBe('');
    });
    
    test('_getPriorityText should return correct Chinese text', () => {
      expect(ExcelExportService._getPriorityText('urgent')).toBe('紧急');
      expect(ExcelExportService._getPriorityText('high')).toBe('高');
      expect(ExcelExportService._getPriorityText('medium')).toBe('中');
      expect(ExcelExportService._getPriorityText('low')).toBe('低');
      expect(ExcelExportService._getPriorityText('unknown')).toBe('中');
    });
    
    test('_getOrderStatusText should return correct Chinese text', () => {
      expect(ExcelExportService._getOrderStatusText('draft')).toBe('草稿');
      expect(ExcelExportService._getOrderStatusText('confirmed')).toBe('已确认');
      expect(ExcelExportService._getOrderStatusText('completed')).toBe('已完成');
      expect(ExcelExportService._getOrderStatusText('cancelled')).toBe('已取消');
    });
    
    test('_getApprovalStatusText should return correct Chinese text', () => {
      expect(ExcelExportService._getApprovalStatusText('pending')).toBe('待审批');
      expect(ExcelExportService._getApprovalStatusText('approved')).toBe('已批准');
      expect(ExcelExportService._getApprovalStatusText('rejected')).toBe('已拒绝');
    });
    
  });
  
});


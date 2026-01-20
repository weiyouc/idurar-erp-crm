/**
 * Workflow Role Interaction Tests
 *
 * Validates that different roles see and act on workflow approvals as expected.
 * Uses the legacy owner account and temporarily assigns roles to simulate role-based visibility.
 */

import { test, expect } from '@playwright/test';
import { login, navigateTo, waitForLoading } from '../helpers/testHelpers';

test.describe.serial('Workflow Role Interactions', () => {
  test('roles gate approval visibility and action', async ({ page, request }) => {
    await login(page);

    const token = await page.evaluate(() => {
      try {
        return JSON.parse(localStorage.getItem('auth') || '{}')?.current?.token;
      } catch (e) {
        return null;
      }
    });
    expect(token).toBeTruthy();

    const apiBase = process.env.PLAYWRIGHT_API_URL || 'http://localhost:8888/api';
    const headers = { Authorization: `Bearer ${token}` };

    // Resolve roles we will use
    const rolesResponse = await request.get(`${apiBase}/roles`, { headers });
    const rolesData = await rolesResponse.json();
    const roles = rolesData?.result || [];

    const roleByName = (name) => roles.find((role) => role.name === name);
    const procurementRole = roleByName('procurement_manager');
    const costCenterRole = roleByName('cost_center');
    const gmRole = roleByName('general_manager');

    expect(procurementRole && costCenterRole && gmRole).toBeTruthy();

    // Fetch admin and store original roles
    const adminListResponse = await request.get(`${apiBase}/admin/list`, { headers });
    const adminList = await adminListResponse.json();
    const admin = adminList?.result?.find((item) => item.email === 'admin@admin.com') || adminList?.result?.[0];
    expect(admin?.id || admin?._id).toBeTruthy();
    const adminId = admin.id || admin._id;
    const originalRoleIds = Array.isArray(admin.roles)
      ? admin.roles.map((role) => role?._id || role).filter(Boolean)
      : [];

    // Create supplier and submit for approval
    const supplierPayload = {
      companyName: { en: 'Role Interaction Supplier', zh: '角色交互供应商' },
      type: 'manufacturer',
    };
    const createSupplierResponse = await request.post(`${apiBase}/suppliers`, {
      headers,
      data: supplierPayload,
    });
    const supplierResult = await createSupplierResponse.json();
    const supplierId = supplierResult?.result?._id || supplierResult?.result?.id;
    expect(supplierId).toBeTruthy();

    await request.post(`${apiBase}/suppliers/${supplierId}/submit`, { headers });

    try {
      // Role 1: Procurement Manager sees pending approvals
      await request.patch(`${apiBase}/admin/update/${adminId}`, {
        headers,
        data: { roles: [procurementRole._id] },
      });
      await navigateTo(page, '/approvals');
      await waitForLoading(page);
      let rows = page.locator('table tbody tr');
      let rowCount = await rows.count();
      expect(rowCount).toBeGreaterThan(0);

      // Role 2: Cost Center does NOT see pending approvals at level 1
      await request.patch(`${apiBase}/admin/update/${adminId}`, {
        headers,
        data: { roles: [costCenterRole._id] },
      });
      await navigateTo(page, '/approvals');
      await waitForLoading(page);
      rows = page.locator('table tbody tr');
      rowCount = await rows.count();
      expect(rowCount).toBe(0);

      // Role 3: General Manager does NOT see pending approvals at level 1
      await request.patch(`${apiBase}/admin/update/${adminId}`, {
        headers,
        data: { roles: [gmRole._id] },
      });
      await navigateTo(page, '/approvals');
      await waitForLoading(page);
      rows = page.locator('table tbody tr');
      rowCount = await rows.count();
      expect(rowCount).toBe(0);
    } finally {
      // Restore roles to avoid impacting other tests
      await request.patch(`${apiBase}/admin/update/${adminId}`, {
        headers,
        data: { roles: originalRoleIds },
      });
    }
  });
});

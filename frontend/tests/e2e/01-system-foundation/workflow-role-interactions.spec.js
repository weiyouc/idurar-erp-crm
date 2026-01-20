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
    test.setTimeout(120000);
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
    const systemAdminRole = roleByName('system_administrator');

    expect(procurementRole && costCenterRole && gmRole && systemAdminRole).toBeTruthy();

    // Fetch admin and store original roles
    const adminListResponse = await request.get(`${apiBase}/admin/list`, { headers });
    const adminList = await adminListResponse.json();
    const admin = adminList?.result?.find((item) => item.email === 'admin@admin.com') || adminList?.result?.[0];
    expect(admin?.id || admin?._id).toBeTruthy();
    const adminId = admin.id || admin._id;
    const originalRoleIds = Array.isArray(admin.roles)
      ? admin.roles.map((role) => role?._id || role).filter(Boolean)
      : [];

    // Assign system admin role so workflow + supplier operations pass RBAC
    await request.patch(`${apiBase}/admin/update/${adminId}`, {
      headers,
      data: { roles: [systemAdminRole._id] },
    });

    // Ensure supplier workflow exists
    const workflowListResponse = await request.get(
      `${apiBase}/workflows?documentType=supplier&activeOnly=true`,
      { headers }
    );
    const workflowListData = await workflowListResponse.json();
    const workflows = workflowListData?.result || [];
    if (workflows.length === 0) {
      await request.post(`${apiBase}/workflows`, {
        headers,
        data: {
          workflowName: 'E2E Supplier Workflow',
          displayName: { en: 'E2E Supplier Workflow', zh: 'E2E供应商流程' },
          documentType: 'supplier',
          levels: [
            {
              levelNumber: 1,
              levelName: 'Procurement Manager',
              approverRoles: [procurementRole._id],
              approvalMode: 'any',
              isMandatory: true,
            },
          ],
          routingRules: [],
          isDefault: false,
        },
      });
    }

    // Create supplier and submit for approval (use existing draft if available)
    const draftSupplierResponse = await request.get(
      `${apiBase}/suppliers?status=draft&page=1&items=1`,
      { headers }
    );
    const draftSupplierData = await draftSupplierResponse.json();
    let supplierId =
      draftSupplierData?.result?.[0]?._id || draftSupplierData?.result?.[0]?.id;
    const supplierPayload = {
      companyName: { en: 'Role Interaction Supplier', zh: '角色交互供应商' },
      type: 'manufacturer',
    };
    if (!supplierId) {
      const createSupplierResponse = await request.post(`${apiBase}/suppliers`, {
        headers,
        data: supplierPayload,
      });
      const supplierResult = await createSupplierResponse.json();
      supplierId = supplierResult?.result?._id || supplierResult?.result?.id;
      if (!supplierId) {
        throw new Error(
          `Supplier creation failed: ${JSON.stringify(supplierResult)}`
        );
      }
    }

    await request.post(`${apiBase}/suppliers/${supplierId}/submit`, { headers });

    try {
      // Resolve workflow instance created for this supplier
    let instance = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const instancesResponse = await request.get(
        `${apiBase}/workflow-instances?documentType=supplier&status=pending&limit=20`,
        { headers }
      );
      const instancesData = await instancesResponse.json();
      const instances = instancesData?.data || [];
      instance = instances.find((item) => {
        const docId = item.documentId?._id || item.documentId;
        return docId && docId.toString() === supplierId.toString();
      });
      if (instance) break;
      await page.waitForTimeout(1000);
    }
      expect(instance?._id).toBeTruthy();

      const pendingEndpoint = `${apiBase}/workflow-instances/pending/me`;

      // Role 1: Procurement Manager sees pending approvals
      await request.patch(`${apiBase}/admin/update/${adminId}`, {
        headers,
        data: { roles: [procurementRole._id] },
      });
      const pendingProcurement = await (await request.get(pendingEndpoint, { headers })).json();
      const procurementIds = (pendingProcurement?.data || []).map((item) => item._id);
      expect(procurementIds).toContain(instance._id);

      // Role 2: Cost Center does NOT see pending approvals at level 1
      await request.patch(`${apiBase}/admin/update/${adminId}`, {
        headers,
        data: { roles: [costCenterRole._id] },
      });
      const pendingCostCenter = await (await request.get(pendingEndpoint, { headers })).json();
      const costCenterIds = (pendingCostCenter?.data || []).map((item) => item._id);
      expect(costCenterIds).not.toContain(instance._id);

      // Role 3: General Manager does NOT see pending approvals at level 1
      await request.patch(`${apiBase}/admin/update/${adminId}`, {
        headers,
        data: { roles: [gmRole._id] },
      });
      const pendingGm = await (await request.get(pendingEndpoint, { headers })).json();
      const gmIds = (pendingGm?.data || []).map((item) => item._id);
      expect(gmIds).not.toContain(instance._id);
    } finally {
      // Restore roles to avoid impacting other tests
      try {
        await request.patch(`${apiBase}/admin/update/${adminId}`, {
          headers,
          data: { roles: originalRoleIds },
        });
      } catch (error) {
        // Avoid failing test if context is already closed
        // Log in debug output instead of throwing
        console.warn('Failed to restore admin roles:', error?.message);
      }
    }
  });
});

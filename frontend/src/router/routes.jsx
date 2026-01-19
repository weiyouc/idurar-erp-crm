import { lazy } from 'react';

import { Navigate } from 'react-router-dom';

const Logout = lazy(() => import('@/pages/Logout.jsx'));
const NotFound = lazy(() => import('@/pages/NotFound.jsx'));

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Customer = lazy(() => import('@/pages/Customer'));
const Invoice = lazy(() => import('@/pages/Invoice'));
const InvoiceCreate = lazy(() => import('@/pages/Invoice/InvoiceCreate'));

const InvoiceRead = lazy(() => import('@/pages/Invoice/InvoiceRead'));
const InvoiceUpdate = lazy(() => import('@/pages/Invoice/InvoiceUpdate'));
const InvoiceRecordPayment = lazy(() => import('@/pages/Invoice/InvoiceRecordPayment'));
const Quote = lazy(() => import('@/pages/Quote/index'));
const QuoteCreate = lazy(() => import('@/pages/Quote/QuoteCreate'));
const QuoteRead = lazy(() => import('@/pages/Quote/QuoteRead'));
const QuoteUpdate = lazy(() => import('@/pages/Quote/QuoteUpdate'));
const Payment = lazy(() => import('@/pages/Payment/index'));
const PaymentRead = lazy(() => import('@/pages/Payment/PaymentRead'));
const PaymentUpdate = lazy(() => import('@/pages/Payment/PaymentUpdate'));

const Settings = lazy(() => import('@/pages/Settings/Settings'));
const PaymentMode = lazy(() => import('@/pages/PaymentMode'));
const Taxes = lazy(() => import('@/pages/Taxes'));

const Profile = lazy(() => import('@/pages/Profile'));

const About = lazy(() => import('@/pages/About'));

// Sprint 1: RBAC & Workflow
const RolePage = lazy(() => import('@/pages/Role'));
const WorkflowPage = lazy(() => import('@/pages/Workflow'));
const ApprovalDashboard = lazy(() => import('@/pages/ApprovalDashboard'));
const AdminPage = lazy(() => import('@/pages/Admin'));

// Sprint 3: Supplier Management
const SupplierPage = lazy(() => import('@/pages/Supplier'));

// Sprint 4: Material Management
const MaterialPage = lazy(() => import('@/pages/Material'));
const MaterialCategoryPage = lazy(() => import('@/pages/MaterialCategory'));

// Sprint 5: Purchase Order Management
const PurchaseOrderPage = lazy(() => import('@/pages/PurchaseOrder'));

// Sprint 6: Goods Receipt & Material Quotation
const GoodsReceiptPage = lazy(() => import('@/pages/GoodsReceipt'));
const MaterialQuotationPage = lazy(() => import('@/pages/MaterialQuotation'));

let routes = {
  expense: [],
  default: [
    {
      path: '/login',
      element: <Navigate to="/" />,
    },
    {
      path: '/logout',
      element: <Logout />,
    },
    {
      path: '/about',
      element: <About />,
    },
    {
      path: '/',
      element: <Dashboard />,
    },
    {
      path: '/customer',
      element: <Customer />,
    },

    {
      path: '/invoice',
      element: <Invoice />,
    },
    {
      path: '/invoice/create',
      element: <InvoiceCreate />,
    },
    {
      path: '/invoice/read/:id',
      element: <InvoiceRead />,
    },
    {
      path: '/invoice/update/:id',
      element: <InvoiceUpdate />,
    },
    {
      path: '/invoice/pay/:id',
      element: <InvoiceRecordPayment />,
    },
    {
      path: '/quote',
      element: <Quote />,
    },
    {
      path: '/quote/create',
      element: <QuoteCreate />,
    },
    {
      path: '/quote/read/:id',
      element: <QuoteRead />,
    },
    {
      path: '/quote/update/:id',
      element: <QuoteUpdate />,
    },
    {
      path: '/payment',
      element: <Payment />,
    },
    {
      path: '/payment/read/:id',
      element: <PaymentRead />,
    },
    {
      path: '/payment/update/:id',
      element: <PaymentUpdate />,
    },

    {
      path: '/settings',
      element: <Settings />,
    },
    {
      path: '/settings/edit/:settingsKey',
      element: <Settings />,
    },
    {
      path: '/payment/mode',
      element: <PaymentMode />,
    },
    {
      path: '/taxes',
      element: <Taxes />,
    },

    {
      path: '/profile',
      element: <Profile />,
    },
    
    // Sprint 1 Routes
    {
      path: '/roles',
      element: <RolePage />,
    },
    {
      path: '/workflows',
      element: <WorkflowPage />,
    },
    {
      path: '/approvals',
      element: <ApprovalDashboard />,
    },
    {
      path: '/admins',
      element: <AdminPage />,
    },
    
    // Sprint 3 Routes
    {
      path: '/suppliers',
      element: <SupplierPage />,
    },
    
    // Sprint 4 Routes
    {
      path: '/materials',
      element: <MaterialPage />,
    },
    {
      path: '/material-categories',
      element: <MaterialCategoryPage />,
    },
    
    // Sprint 5 Routes
    {
      path: '/purchase-orders',
      element: <PurchaseOrderPage />,
    },
    
    // Sprint 6 Routes
    {
      path: '/goods-receipts',
      element: <GoodsReceiptPage />,
    },
    {
      path: '/material-quotations',
      element: <MaterialQuotationPage />,
    },
    
    {
      path: '*',
      element: <NotFound />,
    },
  ],
};

export default routes;

const express = require('express');

const cors = require('cors');
const compression = require('compression');

const cookieParser = require('cookie-parser');

const coreAuthRouter = require('./routes/coreRoutes/coreAuth');
const coreApiRouter = require('./routes/coreRoutes/coreApi');
const coreDownloadRouter = require('./routes/coreRoutes/coreDownloadRouter');
const corePublicRouter = require('./routes/coreRoutes/corePublicRouter');
const adminAuth = require('./controllers/coreControllers/adminAuth');

const errorHandlers = require('./handlers/errorHandlers');
const erpApiRouter = require('./routes/appRoutes/appApi');

// Sprint 1: RBAC and Workflow routes
const roleRoutes = require('./routes/roleRoutes');
const workflowRoutes = require('./routes/workflowRoutes');
const workflowInstanceRoutes = require('./routes/workflowInstanceRoutes');

// Sprint 2: Attachment routes
const attachmentRoutes = require('./routes/attachmentRoutes');

// Sprint 3: Supplier routes
const supplierRoutes = require('./routes/supplierRoutes');

// Sprint 4: Material routes
const materialCategoryRoutes = require('./routes/materialCategoryRoutes');
const materialRoutes = require('./routes/materialRoutes');

// Sprint 5: Purchase Order routes
const purchaseOrderRoutes = require('./routes/purchaseOrderRoutes');

// Sprint 6: Goods Receipt routes
const goodsReceiptRoutes = require('./routes/goodsReceiptRoutes');

// Sprint 6: Material Quotation routes
const materialQuotationRoutes = require('./routes/materialQuotationRoutes');

const fileUpload = require('express-fileupload');
// create our Express app
const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(compression());

// File upload middleware - enable for attachments
app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  abortOnLimit: true,
  createParentPath: true
}));

// Here our API Routes

app.use('/api', coreAuthRouter);
app.use('/api', adminAuth.isValidAuthToken, coreApiRouter);
app.use('/api', adminAuth.isValidAuthToken, erpApiRouter);
app.use('/api', adminAuth.isValidAuthToken, roleRoutes);
app.use('/api', adminAuth.isValidAuthToken, workflowRoutes);
app.use('/api/workflow-instances', adminAuth.isValidAuthToken, workflowInstanceRoutes);
app.use('/api/attachments', adminAuth.isValidAuthToken, attachmentRoutes);
app.use('/api/suppliers', adminAuth.isValidAuthToken, supplierRoutes);
app.use('/api/material-categories', adminAuth.isValidAuthToken, materialCategoryRoutes);
app.use('/api/materials', adminAuth.isValidAuthToken, materialRoutes);
app.use('/api/purchase-orders', adminAuth.isValidAuthToken, purchaseOrderRoutes);
app.use('/api/goods-receipts', adminAuth.isValidAuthToken, goodsReceiptRoutes);
app.use('/api/material-quotations', adminAuth.isValidAuthToken, materialQuotationRoutes);
app.use('/download', coreDownloadRouter);
app.use('/public', corePublicRouter);

// If that above routes didnt work, we 404 them and forward to error handler
app.use(errorHandlers.notFound);

// production error handler
app.use(errorHandlers.productionErrors);

// done! we export it so we can start the site in start.js
module.exports = app;

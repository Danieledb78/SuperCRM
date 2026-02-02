import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import contactRoutes from './routes/contact.routes.js';
import companyRoutes from './routes/company.routes.js';
import dealRoutes from './routes/deal.routes.js';
import pipelineRoutes from './routes/pipeline.routes.js';
import productRoutes from './routes/product.routes.js';
import quoteRoutes from './routes/quote.routes.js';
import invoiceRoutes from './routes/invoice.routes.js';
import taskRoutes from './routes/task.routes.js';
import activityRoutes from './routes/activity.routes.js';
import campaignRoutes from './routes/campaign.routes.js';
import automationRoutes from './routes/automation.routes.js';
import tagRoutes from './routes/tag.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

// Suppliers, Warehouse, Projects
import supplierRoutes from './routes/supplier.routes.js';
import warehouseRoutes from './routes/warehouse.routes.js';
import purchaseOrderRoutes from './routes/purchaseorder.routes.js';
import ddtRoutes from './routes/ddt.routes.js';
import projectRoutes from './routes/project.routes.js';

// Reports, Templates, Documents
import reportRoutes from './routes/report.routes.js';
import templateRoutes from './routes/template.routes.js';
import documentRoutes from './routes/document.routes.js';

// Integrations, Email, AI, Webhooks
import integrationRoutes from './routes/integration.routes.js';
import emailRoutes from './routes/email.routes.js';
import aiRoutes from './routes/ai.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import pricelistRoutes from './routes/pricelist.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/pipelines', pipelineRoutes);
app.use('/api/products', productRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/automations', automationRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Suppliers, Warehouse, Projects
app.use('/api/suppliers', supplierRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/ddt', ddtRoutes);
app.use('/api/projects', projectRoutes);

// Reports, Templates, Documents
app.use('/api/reports', reportRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/documents', documentRoutes);

// Integrations, Email, AI, Webhooks, Price Lists
app.use('/api/integrations', integrationRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/pricelists', pricelistRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║          SuperCRM API Server              ║
  ║                                           ║
  ║   🚀 Server running on port ${PORT}          ║
  ║   📚 API: http://localhost:${PORT}/api       ║
  ║   💚 Health: http://localhost:${PORT}/health ║
  ╚═══════════════════════════════════════════╝
  `);
});

export default app;

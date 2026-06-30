// ============================================================
//  1. DEBUG & ENV CHECK (env is already loaded via --env-file)
// ============================================================

// Debug: check if variables are loaded
console.log('🔍 Current working directory:', process.cwd());
console.log('🔍 SUPABASE_URL from env:', process.env.SUPABASE_URL);
console.log('🔍 PORT from env:', process.env.PORT);

// If SUPABASE_URL is still missing, throw a clear error
if (!process.env.SUPABASE_URL) {
  console.error('❌ SUPABASE_URL is not defined in .env');
  console.error('   Please create a .env file in the backend root with:');
  console.error('   SUPABASE_URL=https://your-project.supabase.co');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  process.exit(1);
}

// ============================================================
//  2. IMPORTS
// ============================================================
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';

// Routes
import authRoutes from './routes/auth.routes.js';
import customerRoutes from './routes/customer.routes.js';
import productRoutes from './routes/product.routes.js';
import warehouseRoutes from './routes/warehouse.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import orderRoutes from './routes/order.routes.js';
import invoiceRoutes from './routes/invoice.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import rejectionRoutes from './routes/rejection.routes.js';
import productionRoutes from './routes/production.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import userRoutes from './routes/user.routes.js';

// Middleware
import { errorHandler } from './middleware/error.middleware.js';

// ============================================================
//  3. APP SETUP
// ============================================================
const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 3001;

// ============================================================
//  4. MIDDLEWARE
// ============================================================
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
//  5. HEALTH CHECK
// ============================================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'ERP Backend is running',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
//  6. API ROUTES
// ============================================================
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/warehouses', warehouseRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/rejections', rejectionRoutes);
app.use('/api/v1/production', productionRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/users', userRoutes);

// ============================================================
//  7. ERROR HANDLING & 404
// ============================================================
app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// ============================================================
//  8. START SERVER
// ============================================================
httpServer.listen(PORT, () => {
  console.log('=================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📡 API Base: http://localhost:${PORT}/api/v1`);
  console.log('=================================');
});

export default app;
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import employeeRoutes from './routes/employee.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'PeoplePay360 API',
    timestamp: new Date().toISOString() 
  });
});

// Routes
app.use('/api/employees', employeeRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 PeoplePay360 API running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
});

export default app;
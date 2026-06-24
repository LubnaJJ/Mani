import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { healthRouter } from './routes/health.routes';
import { productRouter } from './routes/product.routes';
import { categoryRouter } from './routes/category.routes';
import { orderRouter } from './routes/order.routes';
import { uploadRouter } from './routes/upload.routes';
import { beadColorRouter } from './routes/bead-color.routes';
import { charmRouter } from './routes/charm.routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: [
    'https://mani-production-a577.up.railway.app',
    'http://localhost:5173'
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/health', healthRouter);
app.use('/api/products', productRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/orders', orderRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/bead-colors', beadColorRouter);
app.use('/api/charms', charmRouter);

// Global error handler — must be last
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;

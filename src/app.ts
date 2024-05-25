import express, { Request, Response, NextFunction } from 'express';
import { connectDB } from './utils/features.js';
import { errorMiddleware } from './middlewares/error.js';
import NodeCache from 'node-cache';
import { config } from 'dotenv';
import morgan from 'morgan';
import Stripe from 'stripe';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Importing Routes
import userRoute from './routes/user.js';
import productRoute from './routes/products.js';
import orderRoute from './routes/order.js';
import paymentRoute from './routes/payment.js';
import dashboardRoute from './routes/stats.js';

config({
  path: './.env',
});

const port = process.env.PORT || 7000;
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/Project_24';
const stripeKey = process.env.STRIPE_KEY || 'sk_test_51PGbTHSEKpMvhtuTeS28T2p8oPRjT3Hiy4s2dF3K0XANMdbu1SRrK53zdZJomDSdYknbgwVR3Nf11uIt5jIegWKw00360ACzMY';

connectDB(mongoURI);

export const stripe = new Stripe(stripeKey);
export const myCache = new NodeCache();

const app = express();

app.use(express.json());
app.use(morgan('dev'));
app.use(cors());

// Setup Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = '/var/data/uploads'; // Persistent storage path
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

app.post('/upload', upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }
    console.log(`File uploaded: ${req.file.path}`);
    res.send(`File uploaded: ${req.file.path}`);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).send('Error uploading file.');
  }
});

app.get('/', (req: Request, res: Response) => {
  res.send('API Working with /api/v1');
});

// Using Routes
app.use('/api/v1/user', userRoute);
app.use('/api/v1/product', productRoute);
app.use('/api/v1/order', orderRoute);
app.use('/api/v1/payment', paymentRoute);
app.use('/api/v1/dashboard', dashboardRoute);

// Serve static files from the uploads directory
app.use('/uploads', express.static('/var/data/uploads'));
app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`Express is working on http://localhost:${port}`);
});

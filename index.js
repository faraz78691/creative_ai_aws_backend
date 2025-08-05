import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import route from './routes/index.js';
import msg from './utils/message.js';
import { fileURLToPath } from 'url';
 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
 
dotenv.config();
 
const app = express();
 
// ✅ Enable CORS early
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
 
// ✅ Handle preflight (CORS OPTIONS requests)
app.options('*', cors());
 
// ✅ View & static setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use('/', express.static(path.join(__dirname, '/public')));
 
// ✅ Body parsers
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
 
// ✅ Main routes
app.use('/api', route);
 
// ✅ Error handler (to avoid 502 issues)
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ message: 'Internal Server Error' });
});
 
export default app;
 
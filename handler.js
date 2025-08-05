// handler.js
import serverless from 'serverless-http';
import index from './index.js';

export const app = serverless(index);

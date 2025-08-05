import express from 'express';
import userRoutes from './user.js';
import paymentRoutes from './payment.js';
import adminRoutes from './admin.js';
import creativeRoutes from './members.js';


const router = express.Router();

router.use('/user', userRoutes);
router.use('/payment', paymentRoutes);
router.use('/admin', adminRoutes);
router.use('/creative', creativeRoutes);

export default router;


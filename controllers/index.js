import * as userController from '../controllers/user_controller.js';
import * as adminController from '../controllers/admin_controller.js';
import * as paymentController from '../controllers/payment_controller.js';
import * as ctiController from './cti_members_controller.js'

const controller = {
  userController, adminController,paymentController,ctiController
};

export default controller;

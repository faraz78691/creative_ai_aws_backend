import express from 'express';
import controller from '../controllers/index.js';
import {
  userSignUp, userSignIn, emailVallidation, passwordVallidate, passwordChange,
  getFreeDemoVallidations, tellAboutUsVallidations, scheduledDateAndTimeVallidations,
  billingFormValidation,
  handleValidationErrors
} from '../vallidation/userVallidation.js';
import { authenticateUser } from '../middleware/userAuth.js';
import { uploadProfile } from '../middleware/upload.js'

const fieldsConfig = [
  { name: 'logoImg', maxCount: 1 },
  { name: 'backgroundImage', maxCount: 1 }
];

const app = express();

// ------------------------------------------Using Paypal payment gateway----------------------------------------------//


app.get('/amountAddSuccessful', controller.paymentController.amountAddSuccessful);
app.get('/amountCancelled', controller.paymentController.amountCancelled);
app.post('/createRazorpayOrder', controller.paymentController.createRazorpayOrder);
app.post('/addClientPayment', authenticateUser, controller.paymentController.addClientPayment);

app.post('/verifyPayment', controller.paymentController.verifyPayment );


app.post('/razorpay-webhook', express.raw({ type: 'application/json' }), controller.paymentController.razorpayWebhookHandler);
app.get('/status', controller.paymentController.fallbackPaymentStatus);


export default app;

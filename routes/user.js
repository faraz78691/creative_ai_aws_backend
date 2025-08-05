import express from 'express';
import controller from '../controllers/index.js';
import {
  userSignUp, userSignIn, emailVallidation, passwordVallidate, passwordChange,
  getFreeDemoVallidations, tellAboutUsVallidations, scheduledDateAndTimeVallidations,
  billingFormValidation,
  handleValidationErrors
} from '../vallidation/userVallidation.js';
import { authenticateUser } from '../middleware/userAuth.js';
import { uploadContactStorage, uploadProfile } from '../middleware/upload.js'
import uploadFiles from '../middleware/fileUpload.js'
const fieldsConfig = [
  { name: 'logoImg', maxCount: 1 },
  { name: 'backgroundImage', maxCount: 1 },
  { name: 'multiple_files', maxCount: 10 },

];

const app = express();

app.post('/signUp', userSignUp, handleValidationErrors, controller.userController.userSignUp);
app.post('/signIn', userSignIn, handleValidationErrors, controller.userController.userSignIn);
app.post('/forgotPassword', emailVallidation, handleValidationErrors, controller.userController.forgotPassword);
app.get('/verifyPassword', controller.userController.verifyPassword);
app.post('/changeForgotPassword', passwordVallidate, handleValidationErrors, controller.userController.changeForgotPassword);
app.post('/changePassword', authenticateUser, passwordChange, handleValidationErrors, controller.userController.changePasswordFn);

app.get('/fetchAllProjects', authenticateUser, controller.userController.fetchAllProjects);
app.post('/getFreeDemo', controller.userController.getFreeDemo);
app.get('/fetchUsersFreeDemo', controller.userController.fetchFreeDemo);
app.post('/tellUsAbout', tellAboutUsVallidations, handleValidationErrors, controller.userController.tellUsAbout);
app.post('/scheduledDateAndTime', scheduledDateAndTimeVallidations, handleValidationErrors, controller.userController.scheduledDateAndTime);
app.get('/fetchProjectDetailedById', authenticateUser, controller.userController.fetchProjectDetailedById);
app.get('/fetchFeaturesAndThereSubFeatures', authenticateUser, controller.userController.fetchFeaturesAndThereSubFeatures);

app.post('/addProjectNameAndLogo', authenticateUser, uploadFiles, controller.userController.addProjectNameAndLogo);
app.post('/addClientInquries', controller.userController.addClientInquries);
app.get('/fetchClientInquries', authenticateUser, controller.userController.fetchClientInquries);
app.post('/addClientPaymentPlan', authenticateUser, controller.userController.addClientPaymentPlan);

app.get('/fetchClientAllProjects', authenticateUser, controller.userController.fetchClientAllProjects);
app.get('/sendClientEnquiryEmail', authenticateUser, controller.userController.sendClientEnquiryEmail);

// -------------------------------------------add fund to using paypal----------------------------------------------//
// app.post('/createPayPalPayment', controller.userController.createPayPalPayment );
// app.post('/paymentPayUsingCardDetails', controller.userController.paymentPayUsingCardDetails );
// app.get('/amountAddSuccessful', controller.userController.amountAddSuccessful);
// app.get('/amountCancelled', controller.userController.amountCancelled);


export default app;

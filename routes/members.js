import express from 'express';
import controller from '../controllers/index.js';
import {
  userSignUp, userSignIn, emailVallidation, passwordVallidate, passwordChange,
  getFreeDemoVallidations, tellAboutUsVallidations, scheduledDateAndTimeVallidations,
  billingFormValidation,
  handleValidationErrors
} from '../vallidation/userVallidation.js';

import { authenticateUser } from '../middleware/ctiMemberAuth.js';
import { uploadProfile } from '../middleware/upload.js'


const app = express();

app.post('/login', controller.ctiController.login); 
app.post('/creatememeber',authenticateUser, controller.ctiController.createMember); 
app.post('/insertOnboardProjects',authenticateUser, controller.ctiController.insertOnboardProjects); 
app.get('/getAllRoles',authenticateUser, controller.ctiController.getAllRoles); 
app.get('/getClientEnquiries',authenticateUser, controller.ctiController.getClientEnquiry); 
app.get('/getTeamMembers',authenticateUser, controller.ctiController.getTeamMembers); 
app.get('/getOnboardedPRojects',authenticateUser, controller.ctiController.getOnboardedPRojects); 




export default app;

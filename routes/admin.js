import express from 'express';
import controller from '../controllers/index.js';
import {
    userSignUp, userSignIn, emailVallidation, passwordVallidate, passwordChange,
    getFreeDemoVallidations, tellAboutUsVallidations, scheduledDateAndTimeVallidations,
    billingFormValidation,
    handleValidationErrors
} from '../vallidation/userVallidation.js';
import { authenticateAdmin } from '../middleware/adminAuth.js';
import uploadFiles from '../middleware/fileUpload.js'
const app = express();

app.post('/signIn', userSignIn, handleValidationErrors, controller.adminController.adminSignIn);
app.post('/forgotPassword', emailVallidation, handleValidationErrors, controller.adminController.forgotPassword);
app.get('/verifyPassword', controller.adminController.verifyPassword);
app.post('/changeForgotPassword', passwordVallidate, handleValidationErrors, controller.adminController.changeForgotPassword);
app.post('/changePassword', authenticateAdmin, passwordChange, handleValidationErrors, controller.adminController.changePasswordFn);
app.get('/fetchAllUsersByAdmin', authenticateAdmin,controller.adminController.fetchAllUsersByAdmin);
app.get('/fetchAllBillingInfo', authenticateAdmin,controller.adminController.fetchAllBillingInfo);
app.get('/fetchBuilderProjects', authenticateAdmin,controller.adminController.fetchBuilderProjects);
app.get('/fetchFeaturesById', authenticateAdmin,controller.adminController.fetchFeaturesByProjectId);
app.get('/getAllFeatures', authenticateAdmin,controller.adminController.getAllFeatures);
app.post('/addFeature', authenticateAdmin,controller.adminController.addFeature);
app.post('/addSubFeature', authenticateAdmin,controller.adminController.addSubFeature);
app.post('/insertProjectSubFeatures', authenticateAdmin,controller.adminController.insertProjectSubFeatures);
app.post('/updateProjects', authenticateAdmin,uploadFiles, controller.adminController.updateProjects);
app.post('/addProjectTemplateImages', authenticateAdmin,uploadFiles, controller.adminController.addProjectTemplateImages);
app.get('/getSubfeaturesByFeatureId', authenticateAdmin, controller.adminController.getSubfeaturesByFeatureId);
app.get('/deleteImageById', authenticateAdmin, controller.adminController.deleteProjectTemplateImageById);
app.get('/deleteSubFeature', authenticateAdmin, controller.adminController.deleteSubFeature);
app.post('/updateFeatures', authenticateAdmin, controller.adminController.updateFeatures);
app.post('/updateSubFeatures', authenticateAdmin, controller.adminController.updateSubFeatures);
app.get('/getProjectTemplates', authenticateAdmin, controller.adminController.getProjectTemplates);
app.get('/deleteFeatures', authenticateAdmin, controller.adminController.deleteFeatures);


export default app;

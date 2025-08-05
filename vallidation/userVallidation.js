import { body, validationResult } from 'express-validator';
import { vallidationErrorHandle } from '../utils/responseHandler.js';

const userSignUp = [
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Must be a valid email address'),
    body('name')
        .notEmpty().withMessage('Company name is required')
        .isLength({ min: 3, max: 50 }).withMessage('Company name must be between 3 and 50 characters'),
    body('phoneNumber')
        .notEmpty().withMessage('Phone Number is required')
        .isLength({ min: 8, max: 15 }).withMessage('Phone Number must be between 8 and 15 digits')
        .isNumeric().withMessage('Phone Number must contain only numeric values'),
    body('location')
        .notEmpty().withMessage('Location is required')
        .isString().withMessage('Location must be a valid string'),
    body('currency')
        .notEmpty().withMessage('Currency is required'),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
        .matches(/\d/).withMessage('Password must contain at least one digit')
        .matches(/[!@#$%^&*]/).withMessage('Password must contain at least one special character (!@#$%^&*)')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
];

const userSignIn = [
    body('email')
        .isEmail().withMessage('Email Must Be Required'),

    body('password')
        .notEmpty().withMessage('Password must be required')
        .isLength({ min: 8 }).withMessage('Password should be at least 8 characters long')
];

const emailVallidation = [
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Must be a valid email address'),
];

const passwordVallidate = [
    body('password')
        .notEmpty().withMessage('Password Must Be Required')
        .isLength({ min: 8 }).withMessage('Password Should Be At Least 8 Characters Long'),
    body('confirm_password')
        .notEmpty().withMessage('Confirm Password Must Be Required')
        .isLength({ min: 8 }).withMessage('Password Should Be At Least 8 Characters Long')
];

const passwordChange = [
    body('old_password')
        .notEmpty().withMessage('Old Password Must Be Required')
        .isLength({ min: 8 }).withMessage('Password Should Be At Least 8 Characters Long'),

    body('new_password')
        .notEmpty().withMessage('New Password Is Required')
        .isLength({ min: 8 }).withMessage('Password Should Be At Least 8 Characters Long')
        .matches(/[a-z]/).withMessage('Password Must Contain At Least One Lowercase Letter')
        .matches(/[A-Z]/).withMessage('Password Must Contain At Least One Uppercase Letter')
        .matches(/\d/).withMessage('Password Must Contain At Least One Number')
        .matches(/[\W_]/).withMessage('Password Must Contain At Least One Special Character'),

    body('confirm_password')
        .notEmpty().withMessage('Confirm Password Is Required')
        .isLength({ min: 8 }).withMessage('Password Should Be At Least 8 Characters Long')
        .matches(/[a-z]/).withMessage('Password Must Contain At Least One Lowercase Letter')
        .matches(/[A-Z]/).withMessage('Password Must Contain At Least One Uppercase Letter')
        .matches(/\d/).withMessage('Password Must Contain At Least One Number')
        .matches(/[\W_]/).withMessage('Password Must Contain At Least One Special Character'),
];

const getFreeDemoVallidations = [
    body('fullName')
        .notEmpty().withMessage('Full Name is required')
        .isString().withMessage('Full Name must be a string'),

    body('phoneNumber')
        .notEmpty().withMessage('Phone Number is required'),

    body('businessEmail')
        .notEmpty().withMessage('Business Email is required')
        .isEmail().withMessage('Must be a valid email address'),

    body('companyName')
        .notEmpty().withMessage('Company Name/Project Name is required')
        .isString().withMessage('Company Name/Project Name must be a string'),

    body('companySize')
        .notEmpty().withMessage('Company Size is required')
        .isString().withMessage('Company Size must be a string'),

    body('jobTitle')
        .notEmpty().withMessage('Job Title is required')
        .isString().withMessage('Job Title must be a string'),

    body('project_name')
        .notEmpty().withMessage('Project Name is required')
        .isString().withMessage('Project Name must be a string'),

    body('project_description')
        .optional(),
];

const tellAboutUsVallidations = [
    body('yourRole')
        .notEmpty().withMessage('Your Role is required')
        .isString().withMessage('Your Role must be a string'),

    body('softwareDelivered')
        .notEmpty().withMessage('Software Delivered is required')
        .isString().withMessage('Software Delivered must be a string'),

    body('spend')
        .notEmpty().withMessage('Spend is required')
        .isString().withMessage('Spend must be a string'),

    body('softwareCategories')
        .notEmpty().withMessage('Software Categories are required')
        .isString().withMessage('Software Categories must be a string'),
];

const scheduledDateAndTimeVallidations = [
    body('scheduledTime')
        .notEmpty().withMessage('Scheduled Time is required')
        .isString().withMessage('Scheduled Time must be a string'),

    body('scheduledDate')
        .notEmpty().withMessage('Scheduled Date is required')
        .isString().withMessage('Scheduled Date must be a string'),
];

const billingFormValidation = [
    body('customer_type')
        .notEmpty().withMessage('Customer type is required')
        .isIn(['individual', 'company']).withMessage('Customer type must be either "individual" or "company"'),
    
    body('company_name')
        .if(body('customer_type').equals('company'))
        .notEmpty().withMessage('Company name is required for company customers')
        .isLength({ min: 3, max: 50 }).withMessage('Company name must be between 3 and 50 characters'),
    
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Must be a valid email address'),
    
    body('phone')
        .notEmpty().withMessage('Phone Number is required')
        .isLength({ min: 8, max: 15 }).withMessage('Phone Number must be between 8 and 15 digits')
        .isNumeric().withMessage('Phone Number must contain only numeric values'),
    
    body('company_location')
        .if(body('customer_type').equals('company'))
        .notEmpty().withMessage('Company location is required for company customers')
        .isString().withMessage('Company location must be a valid string'),

    body('address_line_1')
        .notEmpty().withMessage('Address Line 1 is required')
        .isString().withMessage('Address must be a valid string'),
    
    body('address_line_2')
        .optional()
        .isString().withMessage('Address Line 2 must be a valid string'),
    
    body('city')
        .notEmpty().withMessage('City is required')
        .isString().withMessage('City must be a valid string'),
    
    body('state')
        .notEmpty().withMessage('State is required')
        .isString().withMessage('State must be a valid string'),
    
    body('postal_code')
        .notEmpty().withMessage('Postal Code is required')
        .isPostalCode('any').withMessage('Must be a valid postal code'),

    body('estimated_duration')
        .notEmpty().withMessage('Estimated Duration is required')
        .isString().withMessage('Estimated Duration must be a string'),

    body('expected_completion')
        .notEmpty().withMessage('Expected Completion is required')
        .isString().withMessage('Expected Completion must be a valid date format'),

    body('features')
        .notEmpty().withMessage('Features cost is required')
        .isFloat({ min: 0 }).withMessage('Features cost must be a positive number'),

    body('customization')
        .notEmpty().withMessage('Customization cost is required')
        .isFloat({ min: 0 }).withMessage('Customization cost must be a positive number'),

    body('studio_one_12_months')
        .notEmpty().withMessage('Studio One (12 months) cost is required')
        .isFloat({ min: 0 }).withMessage('Studio One (12 months) cost must be a positive number'),

    body('total_cost')
        .notEmpty().withMessage('Total cost is required')
        .isFloat({ min: 0 }).withMessage('Total cost must be a positive number')
];

// Middleware function to handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return vallidationErrorHandle(res, errors);
    }
    next();
};

// Exporting validation rules and error handling middleware
export {
    userSignIn,
    userSignUp,
    emailVallidation,
    passwordVallidate,
    passwordChange,
    getFreeDemoVallidations,
    tellAboutUsVallidations,
    scheduledDateAndTimeVallidations,
    billingFormValidation,



    handleValidationErrors
};

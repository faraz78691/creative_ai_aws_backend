import dotenv from 'dotenv';
import Msg from '../utils/message.js';
import baseurl from '../config/path.js';
import path from 'path';
import handlebars from 'handlebars';
import fs from 'fs/promises';
import localStorage from 'localStorage';
import bcrypt from 'bcryptjs';
import { sendEmail } from '../utils/emailService.js';
import { handleError, handleSuccess } from '../utils/responseHandler.js';
import nodemailer from 'nodemailer';
import hbs from 'nodemailer-express-handlebars';
dotenv.config();
import { fileURLToPath } from 'url';
import paypal from "@paypal/checkout-server-sdk";
import { uploadToS3} from '../utils/s3Uploader.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatePath = path.join(__dirname, '..', 'views');
const transporter = nodemailer.createTransport({
    service: process.env.SMTP_HOST,
    port: 587,                     // SSL port
    secure: false,                  // true because using port 465
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS  // replace with the actual password
    }
});

handlebars.registerHelper('calcTotal', function (a, b) {
    const total = (parseFloat(a) || 0) + (parseFloat(b) || 0);
    return total.toFixed(2);
});

transporter.use('compile', hbs({
    viewEngine: {
        extname: '.hbs',
        layoutsDir: templatePath,
        defaultLayout: false,
    },
    viewPath: templatePath,
    extName: '.hbs',
}));
// amit.ctinfotech@gmail.com
import {
    isUsersExistsOrNot,
    userRegistration,
    updateUserToken,
    fetchUsersByToken,
    updateUserPassword,
    fetchUsersById,
    changePassword,
    fetchProjectDeatils,
    insertFreeDemo,
    fetchUsersFreeDemo,
    insertTellaboutUs,
    fetchUsersFreeDemoByid,
    fetchProjectFeaturesDeatils,
    fetchFeaturesAndSubFeatures,
    countProductSubFeatures,
    addClientsQuries,
    insertClientInquries,
    fetchClientsInquriesById,
    insertClientInstallmentPlan,
    fetchAllProjectsClientId,
    getUserDetails

} from '../models/user.model.js';

import { getData, insertData, getSelectedColumn } from '../models/common.js';
import {
    randomStringAsBase64Url, authenticateUser,
    hashPassword, sendHtmlResponse, comparePassword

} from '../utils/user_helper.js';

dotenv.config();

// ---------------------------------using paypal------------------------------------



const environment = new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_SECRET
);

const client = new paypal.core.PayPalHttpClient(environment);
import { v4 as uuidv4 } from "uuid";

// --------------------------using razar pay---------------------------------------

import Razorpay from "razorpay";
import { platform } from 'os';
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default razorpayInstance;

export const userSignUp = async (req, res) => {
    try {
        const { email, name, phoneNumber, location, currency, password } = req.body;
        const hash = await hashPassword(password);
        let obj = { email, name, phoneNumber, location, currency, password: hash, }
        const result = await isUsersExistsOrNot(email);
        if (result.length > 0) {
            return handleError(res, 400, Msg.emailAlreadyExists, []);
        } else {
            let userSign = await userRegistration(obj)
            return handleSuccess(res, 200, Msg.userRegistered, userSign.insertedId);
        }
    } catch (error) {
        console.error(error);
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const userSignIn = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(email, password);
        console.log("here")
        const userData = await isUsersExistsOrNot(email);
        console.log(userData)
        return authenticateUser(res, email, password, userData);
    } catch (error) {
        console.error(error);
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const data = await isUsersExistsOrNot(email);
        if (data.length > 0) {
            const genToken = await randomStringAsBase64Url(20);
            await updateUserToken(genToken, email);
            const result = await isUsersExistsOrNot(email);
            let token = result[0].genToken;
            if (!result.error) {
                const resetLink = `${baseurl}/api/user/verifyPassword?token=${encodeURIComponent(token)}`;
                const context = {
                    href_url: resetLink,
                    msg: Msg.passwordResetLink
                };
                const projectRoot = path.resolve(__dirname, "../");
                const emailTemplatePath = path.join(projectRoot, "views", "forget_template.handlebars");
                const templateSource = await fs.readFile(emailTemplatePath, "utf-8");
                const template = handlebars.compile(templateSource);
                const emailHtml = template(context);
                const emailOptions = {
                    to: email,
                    subject: Msg.passwordResetSubject,
                    html: emailHtml,
                };
                await sendEmail(emailOptions);
                return handleSuccess(res, 200, `${Msg.passwordResetLinkSentSuccesfully} ${email}.`);
            }
        } else {
            return handleError(res, 400, Msg.emailNotFound, []);
        }
    } catch (error) {
        console.error(error);
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const verifyPassword = async (req, res) => {
    try {
        const id = req.query.token;
        if (!id) {
            return res.status(400).send(Msg.invalidLink);
        } else {
            const result = await fetchUsersByToken(id);

            const token = result[0]?.genToken;
            if (result.length !== 0) {
                localStorage.setItem("vertoken", JSON.stringify(token));
                res.render(path.join(__dirname, "../views/", "forgotPassword.ejs"), {
                    msg: "",
                });
            } else {
                res.render(path.join(__dirname, "../views/", "forgotPassword.ejs"), {
                    msg: "",
                });
            }
        }
    } catch (err) {
        console.log(err);
        return sendHtmlResponse(res, 404, Msg.pageNotFound);
    }
};

export const changeForgotPassword = async (req, res) => {
    try {
        const { password, confirm_password } = req.body;
        const token = JSON.parse(localStorage.getItem("vertoken"));
        if (password == confirm_password) {
            const data = await fetchUsersByToken(token);
            if (data.length !== 0) {
                const hash = await bcrypt.hash(password, 12);
                const result2 = await updateUserPassword(hash, token);
                if (result2) {
                    res.sendFile(path.join(__dirname, "../views/message.html"), {
                        msg: "",
                    });
                } else {
                    res.render(path.join(__dirname, "../views/", "forgetPassword.ejs"), {
                        msg: "Internal Error Occured, Please contact Support.",
                    });
                }
            } else {
                res.render(path.join(__dirname, "../views/", "sessionExpire.ejs"), {
                    msg: "your session is expired",
                });
            }
        } else {
            res.render(path.join(__dirname, "../views/", "forgetPassword.ejs"), {
                msg: "Password and Confirm Password do not match",
            });
        }
    } catch (error) {
        res.render(path.join(__dirname, "../view/", "forgetPassword.ejs"), {
            msg: "Internal server error",
        });
    }
};

export const changePasswordFn = async (req, res) => {
    try {
        let {
            old_password,
            new_password,
            confirm_password
        } = req.body
        let { id } = req.user
        const data = await fetchUsersById(id);

        if (data.length > 0) {
            const match = await comparePassword(old_password, data[0].password);
            if (match) {
                if (new_password == confirm_password) {
                    const hash = await hashPassword(confirm_password);
                    let result = await changePassword(hash, id)
                    if (result.affectedRows) {
                        return handleSuccess(res, 200, Msg.passwordChanged);
                    } else {
                        return handleError(res, 400, Msg.passwordNotChanged);
                    }
                } else {
                    return handleError(res, 400, Msg.passwordsDoNotMatch);
                }
            } else {
                return handleError(res, 400, Msg.currentPasswordIncorrect, []);
            }
        } else {
            return handleError(res, 400, Msg.dataNotFound, []);
        }
    } catch (error) {
        console.error(error);
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const fetchAllProjects = async (req, res) => {
    try {
        let { id } = req.user;
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;
        let data = await fetchProjectDeatils(id);
        if (data.length > 0) {
            data = await Promise.all(
                data.map(async (item) => {
                    let subFeatureCounts = await countProductSubFeatures(item.id);
                    item.subFeaturesCounts = subFeatureCounts.length > 0 ? subFeatureCounts.length : 0;
                    item.contain = item.contain ? item.contain.split(", ").map(i => i.trim()) : [];
                    item.projectImage = item.projectImage;
                    return item;
                })
            );
            const paginatedData = data.slice(offset, offset + limit);
            return handleSuccess(res, 200, Msg.dataFoundSuccessful, paginatedData);
        } else {
            return handleError(res, 400, Msg.dataNotFound, []);
        }
    } catch (error) {
        console.error(error);
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const getFreeDemo = async (req, res) => {
    try {
        // const files = req.files;
        let fileNames = '';
        let fileLinks = [];

        // if (files && files.multiple_files && files.multiple_files.length > 0) {
        //     fileLinks = files.multiple_files.map(file => {
        //         const storedFileName = file.filename;
        //         const fileUrl = `https://creativethoughts.ai:4000/contact_us_files/${storedFileName}`;
        //         return {
        //             name: file.originalname,
        //             url: fileUrl
        //         };
        //     });
        // }

        // ======== MAILER SEND WITH INDIVIDUAL ERROR CATCH ========
        try {
            const mailInfo = await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_USER,
                subject: 'New Free Demo Request',
                template: 'demo_request',
                context: {
                    fullName: req.body.fullName,
                    phoneNumber: req.body.phoneNumber,
                    businessEmail: req.body.businessEmail,
                    companyName: req.body.companyName,
                    companySize: req.body.companySize,
                    jobTitle: req.body.jobTitle,
                    projectName: req.body.project_name,
                    projectDescription: req.body.project_description,
                    files: fileLinks.length > 0 ? fileLinks : null,
                },
            });

            console.log('✅ Email sent:', mailInfo.messageId);

        } catch (mailError) {
            console.error('❌ Failed to send email:', mailError);
            // You can optionally return here if you want to block DB save:
            // return handleError(res, 500, 'Failed to send email notification.');
        }


        if (fileLinks.length > 0) {
            req.body.files = fileLinks.map(f => f.url).join(',');
        }

        const result = await insertFreeDemo(req.body);
        return handleSuccess(res, 200, Msg.freeDemoRegistered, result);

    } catch (error) {
        console.error('❌ Internal error:', error);
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const fetchFreeDemo = async (req, res) => {
    try {
        const result = await fetchUsersFreeDemo();
        if (result.length === 0) {
            return handleSuccess(res, 200, Msg.freeDemoNotFound, []);
        }
        return handleSuccess(res, 200, Msg.freeDemoRegistered, result);
    } catch (error) {
        console.error(error);
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const tellUsAbout = async (req, res) => {
    try {
        let { demoId } = req.query
        if (!demoId) {
            return handleError(res, 200, Msg.idRequire);
        }
        const isExistsIdOrNot = await fetchUsersFreeDemoByid(demoId);
        if (isExistsIdOrNot.length === 0) {
            return handleSuccess(res, 200, Msg.freeDemoNotFoundOnGivenId, {});
        }

        const result = await insertTellaboutUs(req.body, demoId);
        return handleSuccess(res, 200, Msg.dataAddedSuccessfull, result);
    } catch (error) {
        console.error(error);
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const scheduledDateAndTime = async (req, res) => {
    try {
        let { demoId } = req.query
        if (!demoId) {
            return handleError(res, 200, Msg.idRequire);
        }
        const isExistsIdOrNot = await fetchUsersFreeDemoByid(demoId);
        if (isExistsIdOrNot.length === 0) {
            return handleSuccess(res, 200, Msg.freeDemoNotFoundOnGivenId, {});
        }
        const result = await insertTellaboutUs(req.body, demoId);
        return handleSuccess(res, 200, Msg.scheduleAdded, result);
    } catch (error) {
        console.error(error);
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const fetchProjectDetailedById = async (req, res) => {
    try {
        let { projectId } = req.query
        const data = await fetchProjectFeaturesDeatils(projectId);
        let transformedData = Object.values(
            data.reduce((acc, curr) => {
                const { featuresName, featuredId, subFeaturesName, subFeaturedPrice, estimated_time, customisationPrice } = curr;
                if (!acc[featuredId]) {
                    acc[featuredId] = {
                        featuresName,
                        estimated_time: estimated_time ? estimated_time : 0,
                        totalSubFeaturedPrice: 0,
                        countSubFeaturesName: 0,
                        totalCustomisationPrice: 0,
                        subFeaturesListWithPrice: []
                    };
                }
                acc[featuredId].totalSubFeaturedPrice += parseFloat(subFeaturedPrice);
                acc[featuredId].totalCustomisationPrice += parseFloat(customisationPrice)
                acc[featuredId].countSubFeaturesName += 1;
                acc[featuredId].subFeaturesListWithPrice.push({ subFeaturesName, customisationPrice, subFeaturedPrice });
                return acc;
            }, {})
        );
        return handleSuccess(res, 200, Msg.dataFoundSuccessful, transformedData);
    } catch (error) {
        console.error(error);
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const fetchFeaturesAndThereSubFeatures = async (req, res) => {
    try {
        const data = await fetchFeaturesAndSubFeatures();
        const groupedData = Object.values(
            data.reduce((acc, { featuresName, subFeaturesName, subFeaturedPrice, customisationPrice }) => {
                if (!acc[featuresName]) {
                    acc[featuresName] = { featuresName, subFeaturesList: [] };
                }
                acc[featuresName].subFeaturesList.push({ subFeaturesName, subFeaturedPrice, customisationPrice });
                return acc;
            }, {})
        );
        return handleSuccess(res, 200, Msg.dataFoundSuccessful, groupedData);
    } catch (error) {
        console.error(error);
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const addClientInquries = async (req, res) => {
    try {
        let { inquiryId } = req.query
        let { formNumber } = req.body
        let data;
        if (formNumber == 2) {
            let { projectFeatures, durations, totalCost, currentRoutes, no_of_features } = req.body
            projectFeatures = JSON.stringify(req.body.projectFeatures)
            data = {
                projectFeatures,
                durations,
                totalCost,
                currentRoutes,
                no_of_features
            }
        } else if (formNumber == 3) {
            let { platforms, developmentSpeed, PhasesAndDeliverables, featuresPrice, customisationPrice, durations, totalCost, currentRoutes,estimated_time } = req.body
            platforms = JSON.stringify(req.body.platforms)
            PhasesAndDeliverables = JSON.stringify(req.body.PhasesAndDeliverables)
            data = {
                durations,
                customisationPrice,
                totalCost,
                featuresPrice,
                platforms,
                developmentSpeed,
                PhasesAndDeliverables,
                currentRoutes,
                expectedDuration: estimated_time
            }
        } else {
            data = {
                bellingDetails: JSON.stringify(req.body.bankInfo),
                currentRoutes: req.body.currentRoutes,
                
            }
        }
        let detailsAdded = await addClientsQuries(data, inquiryId)
        if (detailsAdded.affectedRows == 1) {
            return handleSuccess(res, 200, Msg.dataAddedSuccessfull, detailsAdded);
        } else {
            return handleError(res, 400, Msg.dataNotAdded);
        }
    } catch (error) {
        console.error(error);
        return handleError(res, 500, Msg.internalServerError);
    }
};

// export const addProjectNameAndLogo = async (req, res) => {
//     try {
//         let { projectId, projectName, logoSize, currentRoutes } = req.body
//         let { id } = req.user
//         let logoImg = "";
//         if (req.files) {
//             logoImg = req.files && req.files.logoImg ? req.files.logoImg[0].filename : null;
//         }
//         const data = {
//             userId: id,
//             projectId,
//             clientProjectName: projectName,
//             clientProjectLogo: logoImg,
//             logoSize: JSON.stringify(logoSize),
//             currentRoutes
//         };
//         const result = await insertClientInquries(data);
//         return handleSuccess(res, 200, Msg.dataAddedSuccessfull, result.insertId);
//     } catch (err) {
//         console.error(err);
//         return handleError(res, 500, Msg.internalServerError);
//     }
// };


export const addProjectNameAndLogo = async (req, res) => {
  try {
    const { projectId, projectName, logoSize, currentRoutes } = req.body;
    const { id } = req.user;
 
    let s3Url = '';
    const file = req.files.find(f => f.fieldname === 'logoImg');
 
    if (file) {
      s3Url = await uploadToS3({
        file,
        folder: 'clientImages',
        prefix: `${projectId}_`,
      });
    }
 
    const data = {
      userId: id,
      projectId,
      clientProjectName: projectName,
      clientProjectLogo: s3Url,
      logoSize: JSON.stringify(logoSize),
      currentRoutes,
    };
 
    const result = await insertClientInquries(data);
    return handleSuccess(res, 200, Msg.dataAddedSuccessfull, result.insertId);
  } catch (err) {
    console.error('Upload failed:', err);
    return handleError(res, 500, Msg.internalServerError);
  }
};
export const fetchClientInquries = async (req, res) => {
    try {
        let { inquiryId } = req.query
        let result = await fetchClientsInquriesById(inquiryId);
        if (result.length === 0) {
            return handleSuccess(res, 200, Msg.dataNotFound, []);
        }
        let obj = {
            clientProjectName: result[0].clientProjectName,
            clientProjectLogo: result[0].clientProjectLogo ? baseurl + "/profile/" + result[0].clientProjectLogo : null,
            logoSize: result[0].logoSize ? JSON.parse(result[0].logoSize) : null,
            projectFeatures: result[0].projectFeatures ? JSON.parse(result[0].projectFeatures) : null,
            durations: result[0].durations,
            totalCost: result[0].totalCost,
            featuresPrice: result[0].featuresPrice,
            bellingDetails: result[0].bellingDetails ? JSON.parse(result[0].bellingDetails) : null,
            platforms: result[0].platforms ? JSON.parse(result[0].platforms) : null,
            developmentSpeed: result[0].developmentSpeed,
            PhasesAndDeliverables: result[0].PhasesAndDeliverables ? JSON.parse(result[0].PhasesAndDeliverables) : null,
            paymentPlan: result[0].paymentPlan,
            installmentType: result[0].installmentType,
            taxes: result[0].taxes,
            gstTotalCost: result[0].gstTotalCost,
            securityDeposit: result[0].securityDeposit,
            currentRoutes: result[0].currentRoutes,
            projectStatus: result[0].status
        }
        return handleSuccess(res, 200, Msg.dataFoundSuccessful, obj);
    } catch (error) {
        console.error(error);
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const addClientPaymentPlan = async (req, res) => {
    try {
        let { inquiryId } = req.query
        let { paymentPlan, installmentType, taxes, gstTotalCost, securityDeposit, installmentPlan, currentRoutes } = req.body
        let data = { paymentPlan, installmentType, taxes, gstTotalCost, securityDeposit, currentRoutes }
        let detailsAdded = await addClientsQuries(data, inquiryId)
        if (detailsAdded.affectedRows == 1) {
            if (paymentPlan.toUpperCase() === "INSTALLMENT" && Array.isArray(installmentPlan)) {
                const values = installmentPlan.map(({ dueDate, projectStage, amount }) =>
                    `(${inquiryId}, '${dueDate}', '${projectStage}', '${amount}')`
                ).join(", ");
                await insertClientInstallmentPlan(values)
                return handleSuccess(res, 200, Msg.dataAddedSuccessfull, detailsAdded);
            }
            return handleSuccess(res, 200, Msg.dataAddedSuccessfull, detailsAdded);
        } else {
            return handleError(res, 400, Msg.dataNotAdded);
        }
    } catch (error) {
        console.error(error);
        return handleError(res, 500, Msg.internalServerError);
    }
};


export const fetchClientAllProjects = async (req, res) => {
    try {
        let { id } = req.user;
        let result = await fetchAllProjectsClientId(id);
        if (result.length === 0) { return handleSuccess(res, 200, Msg.projectNotFound, []); }
        const filteredResult = result.map((item) => {
            const projectFeatures = item.projectFeatures ? JSON.parse(item.projectFeatures) : [];
            const allFeatureCount = projectFeatures.reduce((total, feature) => total + (feature.subFeaturesListWithPrice?.length || 0), 0);
            return {
                projectId: item.id, projectName: item.clientProjectName, durations: item.durations, totalCost: item.totalCost,
                featuresPrice: item.featuresPrice, currentRoutes: item.currentRoutes, projectStatus: item.paymentStatus, allFeatureCount,
            };
        });
        return handleSuccess(res, 200, Msg.dataFoundSuccessful, filteredResult);
    } catch (error) {
        console.error(error);
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const sendClientEnquiryEmail = async (req, res) => {
    try {
        const { inquiryId } = req.query;

        if (!inquiryId) {
            return handleError(res, 400, 'inquiryId is required');
        }

        // ✅ Fetch enquiry from DB
        const [enquiry] = await getData('tbl_clientlnqueries', `WHERE id = ${inquiryId}`);
        console.log(enquiry);
        if (!enquiry) {
            return handleError(res, 404, 'Enquiry not found');
        }

        // Parse feature table data (assuming it's stored in JSON or longtext)
        let features = [];
        if (enquiry.projectFeatures) {
            features = JSON.parse(enquiry.projectFeatures); // Ensure it's stored as JSON string
        }

        let billingInfo = {};

        const projectTotal = enquiry.totalCost || formattedFeatures.reduce((acc, f) => acc + f.totalPrice, 0);
        const parsedBilling = JSON.parse(enquiry.bellingDetails);
        billingInfo = Array.isArray(parsedBilling) ? parsedBilling[0] : parsedBilling;
        // ✅ Send the email
        try {
            const mailInfo = await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_USERTO,
                subject: 'Client Enquiry Follow-up',
                template: 'clientEnquiries',
                context: {
                    fullName: billingInfo.full_name,
                    businessEmail: billingInfo.email || 'N/A',
                    phoneNumber: billingInfo.phone || 'N/A',
                    companyName: billingInfo.company_name || 'N/A',
                    clientType: billingInfo.customer_type || 'N/A',
                    companyAddress: billingInfo.address_line_1 || 'N/A',
                    country: billingInfo.company_location || 'N/A',
                    projectName: enquiry.clientProjectName || 'N/A',
                    features: features,
                    platform: JSON.parse(enquiry.platforms )|| 'N/A',
                    projectTotal,
                    estimated_time: enquiry.expectedDuration || 'N/A',
                }
            });

            console.log('✅ Email sent:', mailInfo.messageId);
        } catch (mailError) {
            console.error('❌ Failed to send email:', mailError);
            return handleError(res, 500, 'Failed to send email.');
        }

        return handleSuccess(res, 200, 'Enquiry email sent successfully.');
    } catch (err) {
        console.error('❌ Internal error:', err);
        return handleError(res, 500, Msg.internalServerError);
    }
};

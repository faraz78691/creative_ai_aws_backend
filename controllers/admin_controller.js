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
import { uploadToS3, deleteObjectFromS3 } from '../utils/s3Uploader.js'
import { getData, getDataPagination, getSelectedColumn, insertData, updateData,deleteData } from '../models/common.js';
import {
    isAdminExistsOrNot,
    fetchAdminByToken,
    updateAdminToken,
    updateAdminPassword,
    changePassword,
    fetchAllUsers, addProjectSubfeatures,
    fetchUsersAllBillingInfo, getProjectsFeaturesById,getSubFeatureByFId,getFeatureNameBySubFeature

} from '../models/admin.model.js';
import {
    randomStringAsBase64Url, authenticateUser,
    hashPassword, sendHtmlResponse, comparePassword

} from '../utils/user_helper.js';

dotenv.config();
import { fileURLToPath } from 'url';
import { get } from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export const adminSignIn = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userData = await isAdminExistsOrNot(email);
        return authenticateUser(res, email, password, userData);
    } catch (error) {
        console.error(error);
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const data = await isAdminExistsOrNot(email);
        if (data.length > 0) {
            const genToken = await randomStringAsBase64Url(20);
            await updateAdminToken(genToken, email);
            const result = await isAdminExistsOrNot(email);
            let token = result[0].genToken;
            if (!result.error) {
                const resetLink = `${baseurl}/api/admin/verifyPassword?token=${encodeURIComponent(token)}`;
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
                return handleSuccess(res, 200, `${Msg.passwordResetLinkSentSuccesfully}${email}.`);
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
            const result = await fetchAdminByToken(id);

            const token = result[0]?.genToken;
            if (result.length !== 0) {
                localStorage.setItem("vertoken", JSON.stringify(token));
                res.render(path.join(__dirname, "../views/", "adminForgotPassword.ejs"), {
                    msg: "",
                });
            } else {
                res.render(path.join(__dirname, "../views/", "adminForgotPassword.ejs"), {
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
            const data = await fetchAdminByToken(token);
          

            if (data.length !== 0) {
                const hash = await bcrypt.hash(password, 12);
                const result2 = await updateAdminPassword(hash, token);
                if (result2) {
                    res.sendFile(path.join(__dirname, "../views/message.html"), {
                        msg: "",
                    });
                } else {
                    res.render(path.join(__dirname, "../views/", "adminForgotPassword.ejs"), {
                        msg: "Internal Error Occured, Please contact Support.",
                    });
                }
            } else {
                res.render(path.join(__dirname, "../views/", "sessionExpire.ejs"), {
                    msg: "your session is expired",
                });
            }
        } else {
            res.render(path.join(__dirname, "../views/", "adminForgotPassword.ejs"), {
                msg: "Password and Confirm Password do not match",
            });
        }
    } catch (error) {
        res.render(path.join(__dirname, "../view/", "adminForgotPassword.ejs"), {
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
        const data = await fetchAdminById(id);

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

export const fetchAllUsersByAdmin = async (req, res) => {
    try {
        const result = await fetchAllUsers();
        return handleSuccess(res, 200, Msg.dataFoundSuccessful, result);
    } catch (err) {
        console.log(err);
        return sendHtmlResponse(res, 404, Msg.pageNotFound);
    }
};

export const fetchAllBillingInfo = async (req, res) => {
    try {
        const result = await fetchUsersAllBillingInfo();
        if (result.length === 0) {
            return handleError(res, 400, Msg.dataNotFound, []);
        }
        result.map((item) => {
            return item.billingInfo = JSON.parse(item.billingInfo)
        })
        return handleSuccess(res, 200, Msg.dataFoundSuccessful, result);
    } catch (err) {
        console.log(err);
        return sendHtmlResponse(res, 404, Msg.pageNotFound);
    }
};

export const fetchBuilderProjects = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const searchKey = req.query.search || '';
  
      const result = await getDataPagination('builder_projects', '', {
        page,
        limit,
        searchKey,
        searchColumn: 'projectName'  // change this if needed
      });
  
      if (result.data.length === 0) {
        return handleError(res, 400, Msg.dataNotFound, []);
      }
  
      return handleSuccess(res, 200, Msg.dataFoundSuccessful, result.data, result.pagination.total);
    } catch (err) {
      console.log(err);
      return handleError(res, 404, Msg.pageNotFound);
    }
  };
  


export const fetchFeaturesByProjectId = async (req, res) => {
    try {

        const projectId = req.query.projectId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        if (!projectId) {
            return handleError(res, 400, "projectId is required", []);
        }

        const result = await getProjectsFeaturesById(projectId, page, limit);

        if (result.length === 0) {
            return handleError(res, 400, Msg.dataNotFound, []);
        }


        return handleSuccess(res, 200, Msg.dataFoundSuccessful, result[0].features, result[0].pagination.total[0].total);
    } catch (err) {
        console.log(err);
        return handleError(res, 404, Msg.pageNotFound);
    }
};
export const getAllFeatures = async (req, res) => {
    try {
        const page = parseInt(req.query.page)
        const limit = parseInt(req.query.limit) 
        const searchKey = req.query.search

        const getFeatures = await getDataPagination('builder_features', '', { page, limit, searchKey, searchColumn: 'featuresName' });

        if (getFeatures.data.length === 0) {
            return handleError(res, 404, "No features found", []);
        }

        const featureIds = getFeatures.data.map(f => f.id);
        // Single query to get all subfeatures
        const subFeatures = await getSubFeatureByFId(featureIds);

        // Group subfeatures by featureId
        const groupedSubFeatures = {};
        subFeatures.forEach(sub => {
            if (!groupedSubFeatures[sub.featureId]) {
                groupedSubFeatures[sub.featureId] = [];
            }
            groupedSubFeatures[sub.featureId].push(sub);
        });

        // Attach grouped subfeatures to each feature
        getFeatures.data.forEach(feature => {
            feature.subFeatures = groupedSubFeatures[feature.id] || [];
        });

        return handleSuccess(
            res,
            200,
            "Features with subfeatures fetched",
            getFeatures.data,
            getFeatures.pagination ? getFeatures.pagination.total : 0
        );

    } catch (err) {
        console.error(err);
        return handleError(res, 500, "Server error");
    }
};


export const addFeature = async (req, res) => {
    try {
        const { featureName } = req.body;

        if (!featureName) {
            return handleError(res, 400, "Feature name is required");
        }

        // Check if feature name already exists
        const existingFeature = await getData('builder_features', `WHERE featuresName = '${featureName}'`);

        if (existingFeature.length > 0) {
            return handleError(res, 400, "Feature name already exists");
        }
        const result = await insertData("builder_features", { featuresName: featureName });

        return handleSuccess(res, 200, "Feature added successfully", result);
    } catch (err) {
        console.error(err);
        return handleError(res, 500, "Server error");
    }
};

export const getSubfeaturesByFeatureId = async (req, res) => {
    try {
        const featureId = req.query.featureId;
        const page = parseInt(req.query.page)
        const limit = parseInt(req.query.limit)
        if (!featureId) {
            return handleError(res, 400, "Feature ID is required");
        }

        const getFeatures = await getDataPagination('builder_subfeatures', `WHERE featureId = ${featureId}`, { page, limit });

        if (getFeatures.data.length === 0) {
            return handleError(res, 404, "No features found", []);
        }

        return handleSuccess(res, 200, "Features with subfeatures fetched", getFeatures.data, getFeatures.pagination ? getFeatures.pagination.total : 0);
    } catch (err) {
        console.error(err);
        return handleError(res, 500, "Server error");
    }
};


export const addSubFeature = async (req, res) => {
    try {
        const { subFeatureName, featureId,estimatedTime } = req.body;

        if (!subFeatureName || !featureId ) {
            return handleError(res, 400, "Sub feature name is required");
        }
        if (!estimatedTime) {
            return handleError(res, 400, "Estimated time is required");
        }

        // Check if feature name already exists
        const existingFeature = await getFeatureNameBySubFeature(subFeatureName);

        if (existingFeature.length > 0) {
            return handleError(res, 400, `This Subfeature already exists in ${existingFeature[0].featureName} feature`);
        }
        const result = await insertData("builder_subfeatures", { featureId: featureId, subFeaturesName: subFeatureName, estimated_time: estimatedTime });

        return handleSuccess(res, 200, "Subfeature added successfully", result);
    } catch (err) {
        console.error(err);
        return handleError(res, 500, "Server error");
    }
};

export const deleteSubFeature = async (req, res) => {
    try {
        const {  id } = req.query;

        if (!id) {
            return handleError(res, 400, "Id is required");
        }

        // Check if feature name already exists
        const deleteSubFeatureResult = await deleteData('builder_subfeatures', `WHERE id = '${id}'`);
        const deleteMapping = await deleteData('project_subfeatures_mapping', `WHERE subFeatureId = '${id}'`);

        if (deleteSubFeatureResult.affectedRows === 0) {
            return handleError(res, 400, "Subfeature not found");
        }

        return handleSuccess(res, 200, "Subfeature deleted successfully", deleteSubFeatureResult);
    } catch (err) {
        console.error(err);
        return handleError(res, 500, "Server error");
    }
};

export const insertProjectSubFeatures = async (req, res) => {
    try {
        const { projectId,featureData } = req.body;

        if (!projectId || !Array.isArray(featureData) || featureData.length === 0) {
            return handleError(res, 400, "projectId and featureData[] are required", []);
        }
       
        await deleteData('project_subfeatures_mapping', `WHERE projectId = ${projectId}`);


       // Step 2: Convert featureData to values array
        const values = [];

        featureData.forEach(item => {
            const { featureId, subFeatureIds } = item;
            if (Array.isArray(subFeatureIds) && subFeatureIds.length > 0) {
                subFeatureIds.forEach(subFeatureId => {
                    values.push([projectId, featureId, subFeatureId]);
                });
            }
        });

        // Step 3: Insert new values
        if (values.length > 0) {
            await addProjectSubfeatures(values);
        }

        return handleSuccess(res, 200, "Subfeatures mapped to project successfully", {
            projectId,
        });

    } catch (err) {
        console.error(err);
        return handleError(res, 500, "Server error while mapping subfeatures");
    }
};

export const updateBuilderProjects = async (req, res) => {
    try {
        const { projectId, subFeatureIds } = req.body;

        if (!projectId || !Array.isArray(subFeatureIds) || subFeatureIds.length === 0) {
            return handleError(res, 400, "projectId and subFeatureIds[] are required", []);
        }

        const values = subFeatureIds.map(subFeatureId => [projectId, subFeatureId]);

        await addProjectSubfeatures(values);

        return handleSuccess(res, 200, "Subfeatures mapped to project successfully", {
            projectId,
            subFeatureCount: subFeatureIds.length
        });

    } catch (err) {
        console.error(err);
        return handleError(res, 500, "Server error while mapping subfeatures");
    }
};

export const updateProjects = async (req, res) => {
    try {
        const { projectId, projectName, description } = req.body;

        let s3Url = '';
        const file = req.files.find(f => f.fieldname === 'projectImage');

        if (file) {
            s3Url = await uploadToS3({
                file,
                folder: 'builderProjectTemplates',
                prefix: `${projectId}_`,
            });
        }

        const data = {
            projectName: projectName,
            description: description,
        };

        if (s3Url) {
            data.projectImage = s3Url;
        }

        const result = await updateData('builder_projects', data, `WHERE id = ${projectId}`);

        return handleSuccess(res, 200, Msg.projectUpdated, result);
    } catch (err) {
        console.error('Upload failed:', err);
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const addProjectTemplateImages = async (req, res) => {
    try {
        const { projectId } = req.body;

        if (!projectId) {
            return handleError(res, 400, 'Project ID is required');
        }

        if (!req.files || req.files.length === 0) {
            return handleError(res, 400, 'No images uploaded');
        }

        const uploadedImages = [];

        for (const file of req.files) {
            const s3Url = await uploadToS3({
                file,
                folder: 'builderProjectTemplates',
                prefix: `${projectId}_img_`,
            });

            const imageData = {
                projectId,
                imageUrl: s3Url,
            };

            await insertData('builder_project_templates_images', imageData);
            uploadedImages.push(s3Url);
        }

        return handleSuccess(res, 200, Msg.uploadSuccess || 'Images uploaded successfully', uploadedImages);
    } catch (error) {
        console.error('Upload error:', error);
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const deleteProjectTemplateImageById = async (req, res) => {
    try {
      const { id } = req.query;
  
      if (!id) {
        return handleError(res, 400, 'Image ID is required');
      }
  
      const [imageData] = await getData('builder_project_templates_images', `WHERE id = ${id}`);
  
      if (!imageData) {
        return handleError(res, 404, 'Image not found');
      }
  
      const {imageUrl} = imageData;
  
      // Extract S3 key from full URL
      const s3Key = imageUrl.split('.amazonaws.com/')[1];
      if (!s3Key) {
        return handleError(res, 500, 'Could not extract S3 key');
      }
  
      // Delete from S3
      await deleteObjectFromS3(s3Key);
  
      // Delete from DB
      await deleteData('builder_project_templates_images', `WHERE id = ${id}`);
  
      return handleSuccess(res, 200, Msg.deletedSuccessfully || 'Image deleted successfully');
    } catch (err) {
      console.error('Error deleting image:', err);
      return handleError(res, 500, Msg.internalServerError);
    }
  };


  export const updateFeatures = async (req, res) => {
    try {
        const { id ,featureName } = req.body;

        if (!id || !featureName) {
            return handleError(res, 400, 'Feature ID and feature name are required');
        }
           // Check if feature name already exists
           const existingFeature = await getData('builder_features', `WHERE featuresName = '${featureName}' AND id != ${id}`);

           if (existingFeature.length > 0) {
               return handleError(res, 400, "Feature name already exists");
           }

        const result = await updateData('builder_features', { featuresName: featureName }, `WHERE id = ${id}`);

        return handleSuccess(res, 200, Msg.projectUpdated, result);
    } catch (err) {
        console.error('Upload failed:', err);
        return handleError(res, 500, Msg.internalServerError);
    }
};
  export const updateSubFeatures = async (req, res) => {
    try {
        const { id ,subFeatureName,estimatedTime } = req.body;

        if (!id || !subFeatureName || !estimatedTime) {
            return handleError(res, 400, 'Sub feature ID and sub feature name and estimated time are required');
        }

          // Check if feature name already exists
          const existingFeature = await getFeatureNameBySubFeature(subFeatureName ,id);

          if (existingFeature.length > 0) {
              return handleError(res, 400, `This Subfeature already exists in ${existingFeature[0].featureName} feature`);
          }

        const result = await updateData('builder_subfeatures', { subFeaturesName: subFeatureName ,estimated_time:estimatedTime }, `WHERE id = ${id}`);

        return handleSuccess(res, 200, 'Sub feature updated', result);
    } catch (err) {
        console.error('Upload failed:', err);
        return handleError(res, 500, Msg.internalServerError);
    }
};
  export const getProjectTemplates = async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) {
            return handleError(res, 400, 'Project ID is required');
        }

        const result = await getData('builder_project_templates_images',`WHERE projectId = ${id}`);
        return handleSuccess(res, 200, Msg.projectUpdated, result);
    } catch (err) {
        console.error('Upload failed:', err);
        return handleError(res, 500, Msg.internalServerError);
    }
};


export const deleteFeatures = async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) {
            return handleError(res, 400, 'Feature ID is required');
        }

        const result = await deleteData('builder_features', `WHERE id = ${id}`);
        
        return handleSuccess(res, 200, Msg.projectUpdated, result);
    } catch (err) {
        console.error('Upload failed:', err);
        return handleError(res, 500, Msg.internalServerError);
    }
};

  









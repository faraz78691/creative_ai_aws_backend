import Joi from "joi";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import hbs from "nodemailer-express-handlebars";
import path from "path";
import base64url from "base64url";
import crypto from "crypto";

import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

// Load environment variables
dotenv.config();


import {
    insertData,
    updateData,
    getData,
    getSelectedColumn,getDataWithJoin
} from "../models/common.js";

import {getTeamMember , getClientEnquiries} from "../models/cti_perfex_model.js"


function generateRandomString(length) {
    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

const saltRounds = 10;

const complexityOptions = {
    min: 8,
    max: 250,
    lowerCase: 1,
    upperCase: 1,
    numeric: 1,
    symbol: 1,
};

function generateToken() {
    var length = 6,
        charset =
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&",
        retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}

function generateOTP(length = 8) {
    const chars = "0123456789";
    let OTP = "";

    for (let i = 0; i < length; i++) {
        const randomIndex = crypto.randomInt(0, chars.length);
        OTP += chars.charAt(randomIndex);
    }

    return OTP;
}



var transporter = nodemailer.createTransport({
    service: 'gmail',
    host: "smtp.gmail.com",
    port: 587,
    secure: true,
    auth: {
        user: "mohdfaraz.ctinfotech@gmail.com",
        pass: "ansnwwornvjlomym",
    },
});

// const handlebarOptions = {
//     viewEngine: {
//         partialsDir: path.resolve(__dirname + "/view/"),
//         defaultLayout: false,
//     },
//     viewPath: path.resolve(__dirname + "/view/"),
// };

// transporter.use("compile", hbs(handlebarOptions));


export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const schema = Joi.object({
            email: Joi.string().email().required().messages({
                "string.empty": "Email can't be empty",
                "any.required": "Email is required",
                "string.email": "Email must be valid",
            }),
            password: Joi.string().min(8).max(15).required().messages({
                "string.empty": "Password can't be empty",
                "string.min": "Password must be at least 8 characters",
                "string.max": "Password must be no more than 15 characters",
                "any.required": "Password is required",
            }),
        });

        const result = schema.validate({ email, password });

        if (result.error) {
            return res.status(400).json({
                success: false,
                message: result.error.details[0].message,
                status: 400,
            });
        }

        const data = await getData("cti_members", `WHERE email = '${email}'`);
        console.log(data);
        if (data.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Account not found. Please check your details.",
            });
        }
        const user = data[0];

        if (user.email_token !== "" && user.email_token !== null) {
            return res.status(400).json({
                success: false,
                message: "Login failed. Please verify your account and try again.",
            });
        }

        // 🔐 Compare password
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).json({
                success: false,
                message: "Invalid password.",
            });
        }

        // ✅ Generate JWT token
        const jwtToken = jwt.sign(
            {
                data: {
                    id: user.id,
                    email: user.email,
                },
            },
            process.env.AUTH_SECRETKEY,
            { expiresIn: "7d" } 
        );
        delete user.password;
        delete user.email_token;
        return res.json({
            status: 200,
            success: true,
            message: "Login successful!",
            token: jwtToken, 
            user_info: user,
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: "An internal server error occurred. Please try again later.",
            error,
        });
    }
};

export const createMember = async (req, res) => {
    try {
        const userid = req.user;
        const { name, email, password, role_uuid , phone_number } = req.body;
  
      // Validate input
      const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(8).max(20).required(),
        role_uuid: Joi.string().guid().required(),
        phone_number: Joi.string().required()
      });
  
      const { error } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
      }
  
      // Check if email already exists
      const existing = await getData('cti_members', `WHERE email = '${email}'`);
      if (existing.length > 0) {
        return res.status(409).json({ success: false, message: 'Email already in use' });
      }
  
      // Hash password
      const hashedPassword = await bcrypt.hash(password, saltRounds);
  
      // Create member
      const newMember = {
        id: uuidv4(),
        name,
        email,
        password: hashedPassword,
        role_uuid,
        added_by: userid,
        phone_no:phone_number
      };
  
      await insertData('cti_members', newMember, '');
  
      return res.status(201).json({
        success: true,
        message: 'Member created successfully',
        member: {
          id: newMember.id,
          name,
          email,
          role_uuid,
        },
      });
    } catch (error) {
      console.error('Error creating member:', error);
      return res.status(500).json({ success: false, message: 'Internal server error', error });
    }
  };


  export const assignProjectMembers = async (req, res) => {
    try {
      const user = req.user;
      const { project_id, member_id, role_id } = req.body;
  
      // 1. Validate input
      const schema = Joi.object({
        project_id: Joi.string().guid().required(),
        member_id: Joi.string().guid().required(),
        role_id: Joi.string().guid().required(),
      });
  
      const { error } = schema.validate({ project_id, member_id, role_id });
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }
  
      // 2. Check if role_id exists
      const [roleExists] = await getData('tbl_roles', `WHERE role_uuid = '${role_id}'`);
      if (!roleExists) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Role. Role does not exist.',
        });
      }
  
      // (Optional) 3. Prevent duplicate entry
      const [existing] = await getData(
        'project_team_assignment',
        `WHERE project_id = '${project_id}' AND member_id = '${member_id}'`
      );
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'This member is already assigned to the project.',
        });
      }
  
      // 4. Insert assignment
      const data = {
        project_id,
        member_id,
        role_id,
        added_by: user.id
       
      };
  
      await insertData('project_team_assignment', data);
  
      return res.status(200).json({
        success: true,
        message: 'Member successfully assigned to project.',
        data,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: 'An internal server error occurred.',
      });
    }
  };
  export const insertOnboardProjects = async (req, res) => {
    try {
        const userid = req.user;
        
        const { project_name, project_description, client_name, start_date, end_date, priority } = req.body;

     
      const schema = Joi.object({
        project_name: Joi.string().required(),
        project_description: Joi.string().required(),
        client_name: Joi.string().required(),
        start_date: Joi.date().required(),
        end_date: Joi.date().required(),
        priority: Joi.string().required()
      });
  
      const { error } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
      }
  
   
      const onboardProejct = {
        id: uuidv4(),
        project_name,
        project_description,
        client_name,
        start_date,
        deadline: end_date,
        priority,
        added_by: userid.id
      };
  
      await insertData('onboarded_projects', onboardProejct, '');
  
      return res.status(201).json({
        success: true,
        message: 'Project Onboarded Successfully',
    
      });
    } catch (error) {
      console.error('Error creating member:', error);
      return res.status(500).json({ success: false, message: 'Internal server error', error });
    }
  };


  export  const getOnboardedPRojects = async (req, res) => {
    try {

        const getResults = await getData('onboarded_projects', '');

        if (getResults.length > 0) {
            return res.json({
                message: "Data fetched successfully",
                status: 200,
                data: getResults,
                success: true,
            });
        } else {
            return res.json({
                message: "Data not found ",
                status: 200,
                success: false,
            });
        }


    } catch (err) {
        console.log(err);
        return res.json({
            success: false,
            message: "Internal server error",
            error: err,
            status: 500,
        });
    }
};


export const resetPassword = async (req, res) => {
    const { user_id, password } = req.body;
    try {
        const schema = Joi.alternatives(
            Joi.object({
                password: Joi.string().min(5).max(10).required().messages({
                    "any.required": "{{#label}} is required!!",
                    "string.empty": "can't be empty!!",
                    "string.min": "minimum 5 value required",
                    "string.max": "maximum 10 values allowed",
                }),
                user_id: Joi.number().empty().required().messages({
                    "number.empty": "id can't be empty",
                    "number.required": "id  is required",
                }),
            })
        );
        const result = schema.validate(req.body);

        if (result.error) {
            const message = result.error.details.map((i) => i.message).join(",");
            return res.json({
                message: result.error.details[0].message,
                error: message,
                missingParams: result.error.details[0].message,
                status: 400,
                success: false,
            });
        } else {
            const result = await fetchUserById(user_id);
            if (result.length != 0) {
                const hash = await bcrypt.hash(password, saltRounds);
                const result2 = await updateUserbyPass(hash, user_id);

                if (result2) {
                    return res.json({
                        success: true,
                        status: 200,

                        message:
                            "Password reset successful. You can now log in with your new password",
                    });
                } else {
                    return res.json({
                        success: false,
                        status: 200,
                        message: "Some error occured. Please try again",
                    });
                }
            } else {
                return res.json({
                    success: false,
                    status: 200,
                    message: "User Not Found",
                });
            }
        }
    } catch (error) {
        console.log(error);
        return res.json({
            success: false,
            message: "Internal server error",
            status: 500,
            error: error,
        });
    }
};

function randomStringAsBase64Url(size) {
    return base64url(crypto.randomBytes(size));
}

export const forgotPassword__by_email = async (req, res) => {
    try {
        const { email } = req.body;
        const schema = Joi.alternatives(
            Joi.object({
                email: Joi.string().email().required().messages({
                    "any.required": "Email is required!",
                    "string.email": "Invalid email format!",
                    "string.empty": "Email cannot be empty!"
                }),

            })
        );
        const result = schema.validate({ email });
        if (result.error) {
            const message = result.error.details.map((i) => i.message).join(",");
            return res.json({
                message: result.error.details[0].message,
                error: message,
                missingParams: result.error.details[0].message,
                status: 400,
                success: false,
            });
        } else {
            const data = await getData('admin_credentials', `where email = '${email}'`);
            if (data.length !== 0) {

                // Generate JWT Token valid for 15 minutes
                const token = jwt.sign({ email: email }, 'SECRET_key');
                const user = {
                    resetToken: token
                }

                await updateData('admin_credentials', user, `where email = '${email}'`);
                const resetLink = `${'http://147.93.86.148/admin/reset-password/'}${token}`;
                const mailOptions = {
                    from: "mohdfaraz.ctinfotech@gmail.com",
                    to: email,
                    subject: "Password Reset",
                    html: ` <html>
            <body>
                <div style="max-width: 600px; margin: auto; text-align: center;">
                    <h2>Password Reset Request</h2>
                    <p>You have requested to reset your password. Click the button below to proceed.</p>
                    <p>This link will expire in 15 minutes.</p>
                    <a href="${resetLink}" style="display: inline-block; background-color: #007bff; color: white; text-decoration: none; font-size: 18px; padding: 12px 20px; border-radius: 5px; font-weight: bold;">Reset Password</a>
                    <p>If you did not request a password reset, please ignore this email.</p>
                    <p style="color: #888;">© 2025 Warwickshire. All rights reserved.</p>
                </div>
            </body>
            </html>`,
                };
                transporter.sendMail(mailOptions, async function (error, info) {
                    if (error) {
                        return res.json({
                            success: false,
                            message: error,
                        });
                    } else {
                        return res.json({
                            success: true,

                            message:
                                "Password reset link sent successfully. Please check your email " +
                                email,
                            email: email,
                        });
                    }
                });

            } else {
                return res.json({
                    success: false,

                    message: "Email address not found. Please enter a valid email",
                    status: 400,
                });
            }
        }
    } catch (error) {
        console.log(error);
        return res.json({
            success: false,
            message: "Internal server error",
            status: 500,
            error: error,
        });
    }
};

export const verifyPassword = async (req, res) => {
    try {
        const id = req.params.token;
        if (!id) {
            return res.status(400).send("Invalid link");
        } else {
            const result = await fetchUserByIdtoken(id);
            const token = result[0]?.token;
            if (result.length !== 0) {
                localStorage.setItem("vertoken", JSON.stringify(token));

                res.render(path.join(__dirname, "/view/", "forgetPassword.ejs"), {
                    msg: "",
                });
            } else {
                res.render(path.join(__dirname, "/view/", "forgetPassword.ejs"), {
                    msg: "This User is not Registered",
                });
            }
        }
    } catch (err) {
        console.log(err);
        res.send(`<div class="container">
          <p>404 Error, Page Not Found</p>
          </div> `);
    }
};
export const verifyResetToken = async (req, res) => {
    const { token } = req.params;

    try {
        // Verify token
        const decoded = jwt.verify(token, 'SECRET_key');
        console.log(decoded);
        if (!decoded) {
            return res.status(200).json({ message: "Invalid token", success: false });
        }
        // Fetch user using decoded email
        const user = await getData("admin_credentials", `where email = '${decoded.email}'`);
        console.log(user);
        if (!user || user[0].resetToken !== token) {
            return res.status(200).json({ message: "Invalid or expired token", success: false });
        }

        return res.json({
            message: "Valid Token",
            status: 200,
            success: true,
        });

    } catch (error) {
        console.log(error);
        return res.status(200).json({ message: "Invalid or expired token", success: false });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { password, confirm_password } = req.body;
        const token = JSON.parse(localStorage.getItem("vertoken"));
        const schema = Joi.alternatives(
            Joi.object({
                password: Joi.string().min(8).max(10).required().messages({
                    "any.required": "{{#label}} is required!!",
                    "string.empty": "can't be empty!!",
                    "string.min": "minimum 8 value required",
                    "string.max": "maximum 10 values allowed",
                }),
                confirm_password: Joi.string().min(8).max(10).required().messages({
                    "any.required": "{{#label}} is required!!",
                    "string.empty": "can't be empty!!",
                    "string.min": "minimum 8 value required",
                    "string.max": "maximum 10 values allowed",
                }),
            })
        );
        const result = schema.validate({ password, confirm_password });
        if (result.error) {
            const message = result.error.details.map((i) => i.message).join(",");
            res.render(path.join(__dirname + "/view/", "forgetPassword.ejs"), {
                message: result.error.details[0].message,
                error: message,
                missingParams: result.error.details[0].message,
                msg: message,
            });
        } else {
            if (password == confirm_password) {
                const data = await fetchUserByToken(token);

                if (data.length !== 0) {
                    const update_show_password = await updatePassword_2(password, token);
                    const hash = await bcrypt.hash(password, saltRounds);
                    const result2 = await updatePassword(hash, token);

                    if (result2) {
                        res.sendFile(path.join(__dirname + "/view/message.html"), {
                            msg: "",
                        });
                    } else {
                        res.render(path.join(__dirname, "/view/", "forgetPassword.ejs"), {
                            msg: "Internal Error Occured, Please contact Support.",
                        });
                    }
                } else {
                    return res.json({
                        message: "User not found please sign-up first",
                        success: false,
                        status: 400,
                    });
                }
            } else {
                res.render(path.join(__dirname, "/view/", "forgetPassword.ejs"), {
                    msg: "Password and Confirm Password do not match",
                });
            }
        }
    } catch (error) {
        console.log(error);
        res.render(path.join(__dirname, "/view/", "forgetPassword.ejs"), {
            msg: "Internal server error",
        });
    }
};
export const changeForgotpassword = async (req, res) => {

    const { token, newPassword } = req.body;

    try {
        const decoded = jwt.verify(token, 'SECRET_key');
        const user = await getData('admin_credentials', `where email = '${decoded.email}'`);

        if (!user || user[0].resetToken !== token) {
            return res.status(200).json({
                message: "Invalid or expired token", success: false,
                status: 400,
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const data = {
            password: hashedPassword,
            resetToken: null
        }
        const result = await updateData('admin_credentials', data, `where email = '${user[0].email}'`);
        if (!result) {
            return res.json({
                message: "Password reset failed", success: false,
                status: 400,
            });
        } else {
            return res.json({
                message: "Password reset successful", success: true,
                status: 200,
            });
        }


    } catch (error) {
        return res.status(400).json({ message: "Invalid or expired token" });
    }

};


export  const getAllRoles = async (req, res) => {
    try {

        const getResults = await getData('tbl_roles', '');

        if (getResults.length > 0) {
            return res.json({
                message: "Roles fetched successfully",
                status: 200,
                data: getResults,
                success: true,
            });
        } else {
            return res.json({
                message: "Roles not found ",
                status: 200,
                success: false,
            });
        }


    } catch (err) {
        console.log(err);
        return res.json({
            success: false,
            message: "Internal server error",
            error: err,
            status: 500,
        });
    }
};

export const getClientEnquiry = async (req, res) => {
    try {

        const getResults = await getClientEnquiries();
        if (getResults.length > 0) {
            return res.json({
                message: "Results fetched successfully",
                status: 200,
                data: getResults,
                success: true,
            });
        } else {
            return res.json({
                message: "Data not found",
                status: 200,
                success: false,
            });
        }


    } catch (err) {
        console.log(err);
        return res.json({
            success: false,
            message: "Internal server error",
            error: err,
            status: 500,
        });
    }
};
export const getTeamMembers = async (req, res) => {
    try {

        const getResults = await getTeamMember();

        if (getResults.length > 0) {
            return res.json({
                message: "Results fetched successfully",
                status: 200,
                data: getResults,
                success: true,
            });
        } else {
            return res.json({
                message: "Data not found",
                status: 200,
                success: false,
            });
        }


    } catch (err) {
        console.log(err);
        return res.json({
            success: false,
            message: "Internal server error",
            error: err,
            status: 500,
        });
    }
};

export const uploadMaps = async (req, res) => {
    try {
        const {
            name, image, id
        } = req.body;
        const schema = Joi.alternatives(
            Joi.object({
                name: [Joi.string().empty().required()],
                image: [Joi.string().allow('', null)],
                id: [Joi.string().allow('', null)],
            })
        );
        const result = schema.validate(req.body);
        if (result.error) {
            const message = result.error.details.map((i) => i.message).join(",");
            return res.json({
                message: result.error.details[0].message,
                error: message,
                missingParams: result.error.details[0].message,
                status: 400,
                success: false,
            });
        } else {

            let filename = false;
            if (req.file) {
                const file = req.file;
                filename = file.filename;
            };
            let user = {
                name: name,
                image: filename
            };
            if (id) {
                const getImage = await getSelectedColumn('image', 'maps', `where id =${id}`);

                let user = {
                    name: name,
                    image: filename ? filename : getImage[0].image
                };

                var results = await updateData('maps', user, `where id =${id}`);
                if (results.affectedRows) {
                    return res.json({
                        message: "Map updated successfully",
                        status: 200,
                        success: true,
                    });
                } else {
                    return res.json({
                        message: "Update failed",
                        status: 200,
                        success: false,
                    });
                }
            } else {
                var results = await insertData('maps', user, '');

                if (results.affectedRows) {
                    return res.json({
                        message: "Map uploaded successfully",
                        status: 200,
                        success: true,
                    });
                } else {
                    return res.json({
                        message: "Update failed",
                        status: 200,
                        success: false,
                    });
                }

            }
        }
    } catch (err) {
        console.log(err);
        return res.json({
            success: false,
            message: "Internal server error",
            error: err,
            status: 500,
        });
    }
};


export const deleteCollectionImage = async (req, res) => {
    try {
        const {
            collection_id,
            imageName

        } = req.body;
        const getResults = await deleteData('collection_more_images', `where collection_id = ${collection_id} and image = '${imageName}'`);

        if (getResults.affectedRows) {
            return res.json({
                message: "Image deleted successfully",
                status: 200,
                success: true,
            });
        } else {
            return res.json({
                message: "Update failed ",
                status: 200,
                success: false,
            });
        }


    } catch (err) {
        console.log(err);
        return res.json({
            success: false,
            message: "Internal server error",
            error: err,
            status: 500,
        });
    }
};

export const updateMoreImages = async (req, res) => {
    try {
        const {
            id
        } = req.body;
        const schema = Joi.alternatives(
            Joi.object({
                id: [Joi.string().empty().required()],
            })
        );
        const result = schema.validate(req.body);
        if (result.error) {
            const message = result.error.details.map((i) => i.message).join(",");
            return res.json({
                message: result.error.details[0].message,
                error: message,
                missingParams: result.error.details[0].message,
                status: 400,
                success: false,
            });
        } else {

            let filename = false;
            for (let file of req.files) {
                const fileData = {
                    collection_id: id,
                    image: file.filename
                };
                await insertData('collection_more_images', fileData, '');
            }
            return res.json({
                message: "Collection image uploaded successfully",
                status: 200,
                success: true,
            });

        }
    } catch (err) {
        console.log(err);
        return res.json({
            success: false,
            message: "Internal server error",
            error: err,
            status: 500,
        });
    }
};


export const getCollectionByMapType = async (req, res) => {
    try {
        const { mapId } = req.query
        const getResults = await getCollectionByMapType(mapId);
        if (getResults.length > 0) {
            return res.json({
                message: "Home section updated successfully",
                status: 200,
                data: getResults,
                success: true,
            });
        } else {
            return res.json({
                message: "No Data found",
                status: 200,
                success: false,
            });
        }
    } catch (err) {
        console.log(err);
        return res.json({
            success: false,
            message: "Internal server error",
            error: err,
            status: 500,
        });
    }
};

export const searchCollections = async (req, res) => {
    try {
        const { keyword } = req.query
        const getResults = await getCollectionByKeyword(keyword);
        if (getResults.length > 0) {
            return res.json({
                message: "Home section updated successfully",
                status: 200,
                data: getResults,
                success: true,
            });
        } else {
            return res.json({
                message: "No Data found",
                status: 200,
                success: false,
            });
        }
    } catch (err) {
        console.log(err);
        return res.json({
            success: false,
            message: "Internal server error",
            error: err,
            status: 500,
        });
    }
}
export const deleteCollectionsById = async (req, res) => {
    try {
        const { id } = req.query
        const getResults = await deleteData('warwickshire_collection', `where id = ${id}`); 
        if (getResults.affectedRows > 0) {
            return res.json({
                message: "Collection Deleted successfully",
                status: 200,
                data: getResults,
                success: true,
            });
        } else {
            return res.json({
                message: "No Data found",
                status: 200,
                success: false,
            });
        }
    } catch (err) {
        console.log(err);
        return res.json({
            success: false,
            message: "Internal server error",
            error: err,
            status: 500,
        });
    }
};









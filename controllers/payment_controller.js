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
import crypto from 'crypto';

// import {
//     fetchAllProjectsClientId,
// } from '../models/payment.model.js';

import {
    randomStringAsBase64Url, authenticateUser,
    hashPassword, sendHtmlResponse, comparePassword,
    handlePaymentSuccess,
    handlePaymentCancelled

} from '../utils/user_helper.js';
import {
    getUserDetails,insertUserPayment

} from '../models/user.model.js';

dotenv.config();

// ---------------------------------using paypal------------------------------------

import { fileURLToPath } from 'url';
import paypal from "@paypal/checkout-server-sdk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const environment = new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_SECRET
);

const client = new paypal.core.PayPalHttpClient(environment);
import { v4 as uuidv4 } from "uuid";

// --------------------------using razar pay---------------------------------------

import Razorpay from "razorpay";
import { updateData } from '../models/common.js';
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default razorpay;

// ---------------------------------------------Add Payments---------------------------------------------//

export const amountAddSuccessful = async (req, res) => {
    try {
        const { token, userId, totalAmount } = req.query;
        const request = new paypal.orders.OrdersCaptureRequest(token);
        request.requestBody({});

        const capture = await client.execute(request);

        if (capture.result.status === "COMPLETED") {
            res.render(path.join(__dirname, "../views/", "amount_add_success.ejs"));
        } else {
            res.status(400).json({ message: "Payment was not successful" });
        }
    } catch (err) {
        console.error("PayPal Capture Error:", err);
        res.send(`<div class="container">
            <p>Payment failed or was cancelled</p>
            </div>`);
    }
};

export const amountCancelled = async (req, res) => {
    try {
        let { user_id, amount } = req.query;
        const newAmount = Number(amount);
        let userData = {
            user_id: user_id,
            total_amount: newAmount,
            status: 0
        };
        let getPayment = await getPaymentHistory(user_id);
        if (getPayment.length > 0) {
            let remainingAmount = getPayment[0].amount;
            let totalAmount = Number(remainingAmount) + newAmount;
            let payment_status = 0;

            // Update user's wallet with new amounts
            await amountAdd(totalAmount, payment_status, user_id);
        } else {
            // Insert new user wallet if it doesn't exist
            await amountAddedInWallet(userData);
        }

        // Render cancellation confirmation page
        res.render(path.join(__dirname, "../view/", "amount_canceled.ejs"));
    } catch (err) {
        console.log("Payment Cancellation Error:", err);
        res.status(500).send(`<div class="container">
            <p>Something went wrong. Please try again later.</p>
            </div>`);
    }
};


export const razorpayWebhookHandler = async (req, res) => {
    try {
        const secret = "CREATIVE_AI_SECRET_KEY";
        const crypto = require("crypto");

        const signature = req.headers["x-razorpay-signature"];
        const body = JSON.stringify(req.body);

        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(body)
            .digest("hex");

        if (signature !== expectedSignature) {
            return res.status(400).json({ message: "Invalid webhook signature" });
        }

        const event = req.body.event;
        const paymentData = req.body.payload.payment_link.entity;
        const userId = paymentData.reference_id;
        const amount = paymentData.amount / 100;

        if (event === "payment_link.paid") {
            await handlePaymentSuccess(userId, amount);
        } else if (event === "payment_link.cancelled") {
            await handlePaymentCancelled(userId, amount);
        }
        res.status(200).json({ status: "ok" });
    } catch (error) {
        console.error(err);
        return handleError(res, 500, Msg.internalServerError);
    }
};

export const fallbackPaymentStatus = async (req, res) => {
    res.render(path.join(__dirname, "../views/", "payment_status_fallback.ejs"));
};

export const createOrder = async (req, res) => {
    try {
        const { amount, currency = "INR", receipt } = req.body;

        const options = {
            amount: amount * 100,
            currency,
            //   receipt,
            payment_capture: 1,
        };
        const order = await razorpay.orders.create(options);
        res.json({ success: true, order_id: order.id });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const createRazorpayOrder = async (req, res) => {
    try {
        const { amount } = req.body;
        const options = {
            amount: amount * 100, // in paise
            currency: "INR",
            receipt: "wallet_txn_" + Date.now(),
            payment_capture: 1,
        };

        const order = await razorpay.orders.create(options);
        res.json({ orderId: order.id, amount: options.amount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(sign).digest("hex");

        if (expectedSignature === razorpay_signature) {
            res.status(200).json({ status: "success", message: "Payment verified" });
        } else {
            res.status(400).json({ status: "failure", message: "Invalid signature" });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const addClientPayment = async (req, res) => {
    try {
    const userID = req.user.id;
   
        let { razorpay_order_id, razorpay_payment_id, razorpay_signature, clientInquiryId,paymentMethod, installmentType, gstTotalCost, paymentPlan } = req.body
        const data = {
            userId: userID,
            clientInquriesId: clientInquiryId,
            order_id: razorpay_order_id,
            payable_amount: gstTotalCost,
            signature: razorpay_signature,
            payment_method: paymentMethod,
            razorpay_payment_id: razorpay_payment_id,
            paymentStatus:1,
            paymentPlan: paymentPlan,
            installmentType : installmentType
          
        };
        let detailsAdded = await insertUserPayment(data);
        const updatePaymentStatus = await updateData("tbl_clientlnqueries",{paymentStatus:1},`where id = ${clientInquiryId}`);

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




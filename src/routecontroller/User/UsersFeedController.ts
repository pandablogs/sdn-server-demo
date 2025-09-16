import { Router } from "express";
const bcrypt = require("bcryptjs"); // for password compare
const jwt = require("jsonwebtoken");
const multer = require("multer");
const express = require("express");
const fs = require("fs");
const path = require("path");
import Auth from '../../models/Middleware/authentication';
import utility from "../../services/utility";
import db from "../../models/Middleware/Mongodb";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";
import { registerJoiSchema } from "../../validation/userValidation";
import { verifyToken } from "../../models/Middleware/authMiddleware";
const OAuth2Server = require("oauth2-server");
const PROCESS_ENV: any = process.env
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class UsersFeedController {
    constructor(router: any) {
        this.MAIN_API(router);
    }
    public MAIN_API(router: Router) {
        router.post('/api/register', Auth.TenantConnection(), async (req: any, res: any, next: any) => {
            try {
                const { error, value } = registerJoiSchema.validate(req.body, {});
                // console.log('error=========================', error)
                // console.log('valueeeeeeeeeeeeeeeee', value)
                if (error) {
                    return res.status(400).json({
                        msg: "Validation error",
                        details: error.details.map((err: any) => err.message),
                    });
                }
                const { user_name, email, password, confirm_password } = value;

                // if (!user_name || !email || !password || !confirm_password) {
                //     return res.status(400).json({ msg: "All fields are required" });
                // }

                if (password !== confirm_password) {
                    return res.status(400).json({ msg: "Passwords do not match" });
                }
                const Users = db.TenantDB(utility.getTenantDevName(utility.getHostName(req))).Users;
                const exit_user = await Users.findOne({
                    $or: [{ email }, { user_name }],
                });

                if (exit_user) {
                    return res.status(400).json({ msg: "User already exists" });
                }
                const hashPassword = await bcrypt.hash(password, 10)
                // newuser save
                const newUser = await Users({ user_name, email, password: hashPassword });

                await newUser.save();

                // status 200 api
                res.status(200).json({ newUser, msg: 'User registered successfully', is_succes: true })

            } catch (err) {
                return res.status(500).json({ msg: "Server error", error: err });
            }
        });

        router.post('/api/login', async (req: any, res: any, next: any) => {
            try {
                const { user_name, email, password } = req.body;

                //    username OR email
                if (!user_name && !email) {
                    return res.status(400).json({ msg: "Either Username/Email required" });
                }
                const Users = db.TenantDB(utility.getTenantDevName(utility.getHostName(req))).Users;
                let query: any = {};
                if (email) {
                    query.email = email;
                } else if (user_name) {
                    query.user_name = user_name;
                }

                const user = await Users.findOne(query);

                if (!user) {
                    return res.status(400).json({ msg: "Invalid username/email" });
                }

                // ✅ Verify password
                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) {
                    return res.status(400).json({ msg: "Invalid Password" });
                }

                // ✅ Generate JWT
                const token = jwt.sign(
                    { id: user._id, email: user.email, user_name: user.user_name },
                    process.env.JWT_SECRET || "yourSecretKey",
                    { expiresIn: "1h" }
                );

                res.status(200).json({
                    msg: "Login successful",
                    token,
                    user: {
                        id: user._id,
                        user_name: user.user_name,
                        email: user.email,
                    },
                    is_succes: true
                });

            } catch (err) {
                console.error("Login Error:", err);
                return res.status(500).json({ msg: "Server error", error: err });
            }
        });

        // router.post('/api/loginv2', async (req: any, res: any, next: any) => {
        //     try {
        //         const { user_name, email, password } = req.body;

        //         const OuthRequest = OAuth2Server.Request;
        //         const OuthResponse = OAuth2Server.Response;

        //         let outhrequest = new OuthRequest({
        //             method: req.method,
        //             query: req.param,
        //             headers: { ...req.headers, 'content-type': 'application/x-www-form-urlencoded' },
        //             body: { ...req.body, 'grant_type': 'password', username: { email: req.body.email, } }
        //         });
        //         let outhresponse = new OuthResponse({ headers: {} });
        //         const token: any = await Auth.oauthaccess(outhrequest, outhresponse)
        //         var response_data: any = {
        //             access_token: token.accessToken,
        //             refresh_token: token.refreshToken,
        //         }
        //         console.log('response_data', response_data)
        //         if (req.body.email) {
        //             Auth.getCompanyByEmailDomain(req, (err, company_data) => {
        //                 if (err) {
        //                     res.json({ "status": false, "message": "Some thing is wrong, Please try to contact support.", "status_code": 202 });
        //                 }
        //                 else {
        //                     if (company_data) {
        //                         if (company_data.hostname != utility.getHostInfo(req).hostName) {
        //                             var domain = PROCESS_ENV.TENANT_DOMAIN.replace("<tenatdomain>", company_data.hostname);
        //                             var temp_data: any = {
        //                                 user: {
        //                                     level: "6",
        //                                     domain: domain,
        //                                     isView: "login",
        //                                     email: req.body.email,
        //                                     password: req.body.password
        //                                 }
        //                             }
        //                         }
        //                         else {
        //                             res.json({ "status": false, "message": "OOPS! Your account does not exist.", "status_code": 202 });
        //                         }
        //                         res.json({ "status_code": 200, status: true, data: temp_data })
        //                     }
        //                 }
        //             })
        //         }
        //     } catch (err) {
        //         console.error("Login Error:", err);
        //         return res.status(500).json({ msg: "Server error", error: err });
        //     }
        // });

        router.post("/api/auth/google", Auth.TenantConnection(), async (req, res) => {
            try {
                const { access_token } = req.body;

                if (!access_token) return res.status(400).json({ msg: "Access token is required" });

                // fetch Google user
                const { data } = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
                    headers: { Authorization: `Bearer ${access_token}` },
                });

                const { email, name, sub: googleId } = data;

                const Users = db.TenantDB(utility.getTenantDevName(utility.getHostName(req))).Users;

                let user = await Users.findOne({ email });

                if (!user) {
                    user = await Users.create({
                        email,
                        user_name: name,
                        googleId,
                        password: null,
                        is_verify: true,
                    });
                }

                const token = jwt.sign(
                    { id: user._id, email: user.email, user_name: user.user_name },
                    process.env.JWT_SECRET || "yourSecretKey",
                    { expiresIn: "1h" }
                );

                res.json({
                    msg: "Google login successful",
                    token,
                    user: { id: user._id, email: user.email, user_name: user.user_name },
                    is_succes: true,
                });

            } catch (err: any) {
                res.status(500).json({ msg: "Server error", error: err.message });
            }
        });

        router.get("/api/get/profile", Auth.TenantConnection(), verifyToken, async (req: any, res: any) => {
            try {
                const Users = db.TenantDB(utility.getTenantDevName(utility.getHostName(req))).Users;
                const user = await Users.findById(req.user.id).select("-password");


                if (!user) return res.status(404).json({ msg: "User not found" });
                const profile = {
                    user_name: user.user_name || "",
                    email: user.email || "",
                    first_name: user.first_name || "",
                    last_name: user.last_name || "",
                    gender: user.gender || "",
                    nationality: user.nationality || "",
                    marital_status: user.marital_status || "",
                    city: user.city || "",
                    state: user.state || "",
                    mobile_number: user.mobile_number || "",
                    passport_number: user.passport_number || "",
                    profile_img: user.profile_img || "",
                    passport_country: user.passport_country || "",
                    pan_number: user.pan_number || "",
                    is_deleted: user.is_deleted ?? false,
                    is_active: user.is_active ?? true,
                    is_verify: user.is_verify ?? false,
                    createdAt: user.createdAt || null,
                    updatedAt: user.updatedAt || null,
                    _id: user._id,
                };


                res.json({
                    msg: "User profile fetched successfully",
                    user: profile,
                    is_succes: true
                });
            } catch (err: any) {
                res.status(500).json({ msg: "Server error", error: err.message });
            }
        });

        // router.post("/api/profile", Auth.TenantConnection(), async (req: any, res: any) => {
        //     try {
        //         const { user_id } = req.body;

        //         if (!user_id) {
        //             return res.status(400).json({ msg: "User ID is required" });
        //         }

        //         const Users = db.TenantDB(utility.getTenantDevName(utility.getHostName(req))).Users;
        //         const user = await Users.findById(user_id).select("-password");

        //         if (!user) {
        //             return res.status(404).json({ msg: "User not found" });
        //         }

        //         res.json({
        //             msg: "User details fetched successfully",
        //             user,
        //             is_succes: true
        //         });
        //     } catch (err: any) {
        //         res.status(500).json({ msg: "Server error", error: err.message });
        //     }
        // });


        router.post("/api/profile/update", Auth.TenantConnection(), verifyToken, async (req: any, res: any) => {
            try {
                const Users = db.TenantDB(utility.getTenantDevName(utility.getHostName(req))).Users;

                const updateFields = {
                    first_name: req.body.first_name,
                    last_name: req.body.last_name,
                    gender: req.body.gender,
                    nationality: req.body.nationality,
                    marital_status: req.body.marital_status,
                    city: req.body.city,
                    state: req.body.state,
                    mobile_number: req.body.mobile_number,
                    passport_number: req.body.passport_number,
                    passport_country: req.body.passport_country,
                    pan_number: req.body.pan_number,
                };

                const user = await Users.findByIdAndUpdate(req.user.id, updateFields, { new: true }).select("-password");

                res.json({
                    msg: "Profile updated successfully",
                    user,
                    is_succes: true
                });
            } catch (err: any) {
                res.status(500).json({ msg: "Server error", error: err.message });
            }
        });

        const storage = multer.diskStorage({
            destination: (req: any, file: any, cb: any) => {
                const uploadPath = path.join(__dirname, "../uploads/profile");
                // ✅ make sure folder exists
                fs.mkdirSync(uploadPath, { recursive: true });
                cb(null, uploadPath);
            },
            filename: (req: any, file: any, cb: any) => {
                cb(null, Date.now() + path.extname(file.originalname));
            },
        });

        const upload = multer({ storage });
        router.use("/uploads", express.static(path.join(__dirname, "../uploads")));
        router.put(
            "/api/profile/upload",
            Auth.TenantConnection(),
            verifyToken,
            upload.single("profile_img"),
            async (req: any, res: any) => {
                try {
                    if (!req.file) {
                        return res.status(400).json({ msg: "No file uploaded" });
                    }

                    const Users = db
                        .TenantDB(utility.getTenantDevName(utility.getHostName(req)))
                        .Users;

                    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/profile/${req.file.filename}`;

                    const updatedUser = await Users.findByIdAndUpdate(
                        req.user.id,
                        { profile_img: fileUrl },
                        { new: true }
                    ).select("-password");

                    res.json({
                        msg: "Profile image updated successfully",
                        user: updatedUser,
                        is_succes: true,
                    });
                } catch (err: any) {
                    res.status(500).json({ msg: "Server error", error: err.message });
                }
            }
        );

    }
}
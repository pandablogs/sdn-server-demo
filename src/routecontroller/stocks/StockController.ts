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

export class StockController {
    constructor(router: any) {
        this.MAIN_API(router);
    }
    public MAIN_API(router: Router) {
        router.post('/api/stocks', async (req: any, res: any) => {
            try {
                const tenantName = req.tenant || 'portal-dev';
                const tenantDbUrl = req.dbURL || process.env.MONGO_URI;

                const ok = await db.connection(tenantName, tenantDbUrl);
                if (!ok) return res.status(500).json({ error: "DB connection failed" });

                const Tenant = db.TenantDB(tenantName) || db.MasterDB();

                const StockModel =
                    Tenant?.Stocks ||
                    Tenant?.stocks ||
                    Tenant?.Stock ||
                    Tenant?.stock ||
                    db.DaynamicCollectionForm(tenantName, 'stocks');

                if (!StockModel) return res.status(500).json({ error: "Stocks model not found" });

                const stock = await StockModel.create(req.body);
                return res.json({ status: true, data: stock });
            } catch (err: any) {
                console.error("POST /api/stocks error:", err);
                return res.status(500).json({ error: err.message || err });
            }
        });

        // Get all Stocks
        router.get('/api/stocks', async (req: any, res: any) => {
            try {
                const tenantName = req.tenant || 'portal-dev';
                const tenantDbUrl = req.dbURL || process.env.MONGO_URI;

                await db.connection(tenantName, tenantDbUrl);
                const Tenant = db.TenantDB(tenantName) || db.MasterDB();

                const StockModel =
                    db.TenantDB(tenantName)?.Stocks ||
                    db.DaynamicCollectionForm(tenantName, 'stocks');

                if (!StockModel) return res.status(500).json({ error: "Stocks model not found" });

                // populate customer if ref exists
                let query = StockModel.find();
                if (StockModel.schema.path("customer")) {
                    query = query.populate("customer");
                }

                const stocks = await query.exec();
                return res.json({ status: true, data: stocks });
            } catch (err: any) {
                console.error("GET /api/stocks error:", err);
                return res.status(500).json({ error: err.message || err });
            }
        });

    }
}
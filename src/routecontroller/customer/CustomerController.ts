import { Router } from "express";
const express = require("express");
const fs = require("fs");
const path = require("path");
import Auth from '../../models/Middleware/authentication';
import utility from "../../services/utility";
import db from "../../models/Middleware/Mongodb";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";
import { verifyToken } from "../../models/Middleware/authMiddleware";

export class CustomerController {
    constructor(router: any) {
        this.MAIN_API(router);
    }
    public MAIN_API(router: Router) {
        router.post('/api/customers', async (req: any, res: any) => {
            try {
                const tenantName = req.tenant || 'portal-dev';
                const tenantDbUrl = req.dbURL || process.env.MONGO_URI;

                const ok = await db.connection(tenantName, tenantDbUrl);
                if (!ok) return res.status(500).json({ error: "DB connection failed" });

                const Tenant = db.TenantDB(tenantName) || db.MasterDB();

                const CustomerModel =
                    Tenant?.Customer ||
                    Tenant?.customer ||
                    Tenant?.Customers ||
                    Tenant?.customers ||
                    db.DaynamicCollectionForm(tenantName, 'customer');

                if (!CustomerModel) return res.status(500).json({ error: "Customer model not found" });

                const customer = await CustomerModel.create(req.body);
                return res.json({ status: true, data: customer });
            } catch (err: any) {
                console.error("POST /api/customers error:", err);
                return res.status(500).json({ error: err.message || err });
            }
        });

        // Get all Customers
        router.get('/api/customers', async (req: any, res: any) => {
            try {
                const tenantName = req.tenant || 'portal-dev';
                const tenantDbUrl = req.dbURL || process.env.MONGO_URI;

                // Ensure tenant connection
                await db.connection(tenantName, tenantDbUrl);

                // Get tenant DB models
                const Tenant = db.TenantDB(tenantName) || db.MasterDB();

                // Get Customer model
                const CustomerModel =
                    Tenant?.Customer ||
                    Tenant?.customer ||
                    Tenant?.Customers ||
                    Tenant?.customers ||
                    db.DaynamicCollectionForm(tenantName, 'customer');

                if (!CustomerModel) return res.status(500).json({ error: "Customer model not found" });

                // Fetch customers and populate stockId to get stock_name
                const customers = await CustomerModel.find()
                    .populate({ path: "stockId", select: "stock_name", strictPopulate: false })
                    .exec();

                // Return response
                return res.json({ status: true, data: customers });
            } catch (err: any) {
                console.error("GET /api/customers error:", err);
                return res.status(500).json({ error: err.message || err });
            }
        });

    }
}
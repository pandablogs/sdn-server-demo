import { NextFunction, Response, Router } from "express";
import Auth from "../../../../models/Middleware/authentication";
import db from "../../../../models/Middleware/Mongodb";
import utility from '../../../../services/utility';

export class AdminFeedController {
    constructor(router: any) {
        this.API_V1(router);
    }
    public API_V1(router: Router) {
        router.post('/api/GetCompanySetting', Auth.Authenticate, async (req: any, res, next) => {
            try {
                res.json({ "status": true, "message": "OOPS! Data Doesn't exist.", "status_code": 202 })
            } catch (err: any) {
                res.json({ "status": false, "message": err.message, "status_code": 202 });
            }
        });
    }
}
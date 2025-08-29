import { Router } from "express";
import Auth from "../../../../models/Middleware/authentication";
const PROCESS_ENV: any = process.env;

export class UserStudioController {
    constructor(router: any) {
        this.MAIN_API(router);
    }
    public MAIN_API(router: Router) {
        router.post('/api/AddUser', Auth.Authenticate, async (req: any, res: any, next) => {
            try {
                res.json({ "status_code": 200, status: true, data: [] })
            } catch (err: any) {
                res.json({ "status": false, "message": err.message, "status_code": 201 });
            }
        });
    }
}
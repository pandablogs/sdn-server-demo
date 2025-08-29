import * as express from "express";
import * as bodyParser from "body-parser";

/* Router Controller  */
//-----------------------------------------------Feed(Controller)----------------------------------------------------------------------------
import { AdminFeedController } from './routecontroller/Feed/Admin/Account/AdminFeedController';
//-----------------------------------------------Studio(Controller)----------------------------------------------------------------------------
import { UserStudioController } from './routecontroller/Studio/Content/User/UserStudioController';
import { UsersFeedController } from "./routecontroller/User/UsersFeedController";

//logger
//const logger = require("../src/services/logger");
//Google Service
const cookieSession = require('cookie-session')
const passport = require('passport');
const PROCESS_ENV: any = process.env;

export default class Server {

    public app: express.Application;
    public router: express.Router;

    constructor(app: any) {
        this.router = express.Router();
        //create expressjs application
        this.app = app;
        //configure application
        this.config();
        //mount json form parser    
        this.app.use(bodyParser.json({ limit: '50mb' }));

        //add api For Rest API
        this.api();
    }

    public api() {
        this.router.get('/api', (req, res) => res.send("Server working...."));
        this.app.use(this.router);  //User App router in the app
        // new SharedformController(this.router);
        //-----------------------------------------------Feed(Controller)----------------------------------------------------------------------------
        new AdminFeedController(this.router);
        //-----------------------------------------------Studio(Controller)--------------------------------------------------------------------------
        new UserStudioController(this.router);
        // user
        new UsersFeedController(this.router)
    }

    public config() {
        var self = this;
        this.app.use(cookieSession({ maxAge: 30 * 24 * 60 * 60 * 1000, keys: [PROCESS_ENV.COOKIE_KEY] }));
        this.app.use(passport.initialize());
        this.app.use(passport.session());
        //mount json form parser    
        this.app.use(bodyParser.json({ limit: '50mb' }));

        this.app.use(function (req, res, next) {
            res.header("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers,crossdomain,withcredentials,Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin,tenant,preflight,present,cache-control");
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            next();
        });
        //mount query string parser
        this.app.use(bodyParser.urlencoded({ extended: true }));
        // catch 404 and forward to error handler
        this.app.use(function (err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
            err.status = 404;
            next(err);
        });
        //error handling
        //this.app.use(errorHandler());
    }
}


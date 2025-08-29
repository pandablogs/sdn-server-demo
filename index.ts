require('dotenv').config()
import { Express, Request, Response } from "express";
import mongodb from './src/models/Middleware/Mongodb';
import server from "./src/server";

const PROCESS_ENV: any = process.env
import express = require("express");
import http = require("http");
import path = require("path");
import initSocket from './socket';  // Import socket setup function
var compression = require('compression');

const port = PROCESS_ENV.PORT
console.log("process.env.NODE_ENV => ", process.env.NODE_ENV);
const httpPort = process.env.PORT || port;

// for swagger 
// const swaggerDocs = yamljs.load('./src/swagger.yaml');

class Main {
    public static start() {
        const app: Express = express();

        // for swagger 
        // app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
        //Access Fornt-end code
        app.use(compression());//add this as the 1st middleware
        // Custom middleware to dynamically set the static path based on request URL
        app.use((req, res, next) => {
            const staticPath = path.resolve(__dirname, this.getTenantBuildPath(req.get('host'))); // Default build path
            // Use express.static middleware for the resolved path
            express.static(staticPath)(req, res, next);
        });
        //Call Client side request 
        var httpServer = http.createServer(app);
        // Initialize socket.io
        initSocket(httpServer);
        //listen on provided ports
        httpServer.listen(httpPort);
        //add error handler
        httpServer.on("error", this.onError);
        //start listening on port
        httpServer.on("listening", () => {
            this.connection(httpServer, app, () => {
                console.log("Master database connected successfully");
            })
        });

    }

    public static connection(httpServer: any, app: any, callback: any) {
        mongodb.connection('portal-dev').then((connection: any) => {
            if (connection == true) {
                new server(app);
                var addr: any = httpServer.address();
                var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
                callback(true)
            } else {
                console.log("Database connection failed....");
                setTimeout(() => this.connection(httpServer, app, callback), 7000)
            }
        }).catch((error: any) => {
            console.log("Database connection error:", error);
            console.log("Database connection failed....");
            setTimeout(() => this.connection(httpServer, app, callback), 7000)
        })
    }

    public static onError(error: any) {
        if (error.syscall !== "listen") {
            throw error;
        }

        var bind = typeof httpPort === "string"
            ? "Pipe " + httpPort
            : "Port " + httpPort;

        // handle specific listen errors with friendly messages
        switch (error.code) {
            case "EACCES":
                console.error(bind + " requires elevated privileges");
                process.exit(1);
                break;
            case "EADDRINUSE":
                console.error(bind + " is already in use");
                process.exit(1);
                break;
            default:
                throw error;
        }
    }

    public static getTenantBuildPath(origin: any) {
        let staticPath = 'build';
        const domains = [{
            "origins": [
                "web.imu.edu.my",
                "icl.imu.edu.my",
                "imu.glozic.com"
            ],
            "buildFolder": "build_imu",
        }]


        const domaindata = domains.find(item => item.origins.includes(origin));
        if (domaindata) {
            staticPath = domaindata.buildFolder;
        }
        return staticPath;
    }
}

Main.start();


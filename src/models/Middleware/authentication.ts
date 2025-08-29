import { NextFunction, Request, Response, Router } from "express";
import db from "./Mongodb";
import utility from '../../services/utility';
import oauth from './oauth';
const URL = require('url')
const OAuth2Server = require("oauth2-server");
const PROCESS_ENV = process.env

const Authenticate = (req: any, res: Response, next: NextFunction) => {
    if (req.headers.authorization && req.headers.tenant) {
        const is_dev_connection = (req.headers.tenant.search("-dev") >= 0) ? true : false;
        req.headers["is_dev_connection"] = is_dev_connection;

        const OuthRequest = OAuth2Server.Request;
        const OuthResponse = OAuth2Server.Response;

        let outhrequest = new OuthRequest({
            method: req.method,
            query: req.param,
            headers: { ...req.headers, Authorization: req.headers.authorization }
        });

        let outhresponse = new OuthResponse({
            headers: {}
        });

        IsTenantConnection(req, function (data: any) {
            req.headers.tenant = req.headers["is_dev_connection"] ? req.headers.tenant : utility.getTenantDevName(req.headers.tenant);
            if (data.status) {
                OauthAutheticate(req, res, next, outhrequest, outhresponse)
            } else {
                res.json(data);
            }
        });



    } else {
        res.status(401).json({ "res": 1, status: false, message: "Missing credential. Please try again." });
    }
}

const OauthAutheticate = (req: any, res: Response, next: NextFunction, outhrequest: any, outhresponse: any) => {
    oauthCollection(req, (oauthT: any) => {
        oauthT.authenticate(outhrequest, outhresponse)
            .then(function (token: any) {
                req.headers.tenant = req.headers["is_dev_connection"] ? req.headers.tenant : req.headers.tenant.replace("-dev", "")
                req["token"] = token;
                next()
            })
            .catch(function (err: any) {
                // Request is not authorized.
                var message = err.message.split(":")[1] ? err.message.split(":")[1] : "";
                var status = 401;
                if (message == " no authentication given") {
                    message = "Authentication Failed."
                } else if (message == " access token has expired") {
                    message = "Authentication token has expired."
                    status = 403;
                } else {
                    message = "Authentication Failed."
                }
                res.json({ status: status, message: message });
            });
    });
}

const oauthaccess = (request: Request, response: Response) => {
    return new Promise((resolve, reject) => {
        oauthCollection(request, (oauthT: any) => {
            var res = oauthT.token(request, response).then(function (token: any) {
                return token
            });
            resolve(res);
        })
    })
}

const IsTenantConnection = async (req: any, done: any) => {
    const header_res = { headers: req.headers, url: req.url }
    try {

        //Setup Live database
        let tenant = req.headers.tenant;
        const is_dev_connection = (req.headers.tenant.search("-dev") >= 0) ? true : false;
        req.headers.tenant = is_dev_connection ? req.headers.tenant : utility.getTenantDevName(req.headers.tenant);
        req.headers["is_dev_connection"] = is_dev_connection;

        if (req.headers.tenant) {
            const company_data = await db.MasterDB().Company.findOne({ hostname: utility.getHostName(req).replace("-dev", ""), is_deleted: false });
            if (!company_data) {
                done({ "status": false, "message": "Some thing is wrong, Please try to contact support.", header_res, 'error': 'Company not fount' });
            } else if (company_data && company_data.is_active != true) {
                done({ "status": false, "message": "Your Account is not active, Please try to contact support." });
            } else if (!company_data.configuration || !company_data.configuration.database_url || company_data.configuration.database_url == "") {
                done({ "status": false, "message": "Your Database is not setup, Please try to contact support." });
            } else {

                req["company_data"] = {
                    company_id: company_data._id,
                    emailDomain: company_data.emailDomain,
                    company_logo: company_data.company_logo,
                    hostname: company_data.hostname,
                    external_access_profiles: company_data.configuration.external_access_profiles ? company_data.configuration.external_access_profiles : [],
                    dashboard_app_version: company_data.dashboard_app_version,
                    personal_tokens: company_data.personal_tokens,
                    tenant_type: company_data.tenant_type
                };

                if (company_data.configuration.dev_database_url && company_data.configuration.dev_database_url && company_data.configuration.dev_database_url != "" && company_data.configuration.dev_database_url) {
                    //Default Tenant Dev connection
                    await db.connection(utility.getTenantDevName(utility.getHostName(req)), company_data.configuration.dev_database_url);

                    //Live Tenant Connection
                    if (req.headers["is_dev_connection"] == false) {
                        await db.connection(utility.getHostName(req).replace("-dev", ""), company_data.configuration.database_url);
                        req.headers.tenant = tenant;
                    }
                    done({ "status": true, tenantdb: company_data.configuration.dev_database_url });
                } else {
                    done({ "status": false, "message": "Some thing is wrong, Please try to contact support", header_res, 'error': 'Data not fount' });
                }
            }
        } else {
            done({ "res": 1, status: false, message: "Header is not corrected. Please try again.", header_res, 'error': 'Tenant not fount' });
        }
    } catch (err: any) {
        done({ "status": false, "message": "Some thing is wrong, Please try to contact support", header_res, 'error': err.message });
    }
}

const callBackTenantConnection = (req: any) => {
    try {
        return new Promise((resolve, rejects) => {
            IsTenantConnection(req, () => {
                resolve(true);
            });
        });
    } catch (err) {
        return ({ "status": false, "message": "Some thing is wrong, Please try to contact support" });
    }
}

const oauthCollection = async (req: any, done: any) => {
    try {
        const Mongodb = db.TenantDB((req.headers.tenant), req.headers.tenantdb)

        oauth.SetCollection({
            User: Mongodb.Users,
            OAuthClient: Mongodb.OauthClients,
            OAuthAccessToken: Mongodb.OauthAccessTokens,
            OAuthRefreshToken: Mongodb.RefreshTokens,
        });

        var oauthT = new OAuth2Server({
            debug: true,
            model: {
                getAccessToken: oauth.getAccessToken,
                getClient: oauth.getClient,
                getRefreshToken: oauth.getRefreshToken,
                getUser: oauth.getUser,
                getUserFromClient: oauth.getUserFromClient,
                revokeAuthorizationCode: oauth.revokeAuthorizationCode,
                revokeToken: oauth.revokeToken,
                saveToken: oauth.saveToken,//saveOAuthAccessToken, renamed to
                saveAuthorizationCode: oauth.saveAuthorizationCode, //renamed saveOAuthAuthorizationCode,
                verifyScope: oauth.verifyScope,
            },
            allowBearerTokensInQueryString: true,
            accessTokenLifetime: 36000 * 60 * 60
        });
        done(oauthT)
    } catch (err: any) {
        console.log(err.message);

    }
}

const TenantConnection = () => {
    return function (req: any, res: any, next: any) {
        if (req.headers.tenant) {
            const is_dev_connection = (req.headers.tenant.search("-dev") >= 0) ? true : false;
            req.headers["is_dev_connection"] = is_dev_connection;
            IsTenantConnection(req, function (data: any) {
                if (data.status == true) {
                    req["headers"]["tenantdb"] = data.tenantdb;
                    req.headers.tenant = req.headers["is_dev_connection"] ? req.headers.tenant : req.headers.tenant.replace("-dev", "")
                    next();
                } else {
                    res.json(data);
                }
            })
        } else {
            res.json({ "res": 1, status: false, message: "Header is not corrected. Please try again." });
        }

    }
}

var outhauthenticate = (request: any, response: any) => {
    return new Promise((resolve, reject) => {
        oauthCollection(request, (oauthT: any) => {
            var res = oauthT.token(request, response).then(function (token: any) {
                return token
            });
            resolve(res);
        })
    })
}

var callBackAuthenticate = (request: any, response: any) => {
    return new Promise((resolve, reject) => {
        Authenticate(request, response, () => {
            resolve(true)
        })
    })
}

var BasicAuthenticate = (reques: any, response: any, next: any) => {
    if (reques.headers.authenticate == ("Basic " + PROCESS_ENV.BASIC_AUTHENTICATE)) {
        response.json({ "status": true, "message": "Authorization Success" });
    } else {
        next();
    }
}

const getCompanyInfo = async (req: any, select?: string) => {
    try {
        var companyData = "";
        if (select) {
            companyData = await db.MasterDB().Company.findOne({ hostname: utility.getTenantName(utility.getHostName(req)), is_deleted: false }).select(select)
        } else {
            companyData = await db.MasterDB().Company.findOne({ hostname: utility.getTenantName(utility.getHostName(req)), is_deleted: false });
        }

        return companyData
    } catch (err) {
        return null
    }
}

const getCompanyInfoById = async (company_id: any) => {
    try {
        const companyData = await db.MasterDB().Company.findOne({ _id: company_id, is_deleted: false });
        return companyData
    } catch (err) {
        return null
    }
}

const getCompanyInfoByHostName = async (hostname: any, select?: string) => {
    try {

        var companyData = null;
        if (select) {
            companyData = await db.MasterDB().Company.findOne({ hostname: hostname, is_deleted: false }).select(select)
        } else {
            companyData = await db.MasterDB().Company.findOne({ hostname: hostname, is_deleted: false });
        }

        return companyData
    } catch (err) {
        return null
    }
}

function getCompanyByEmailDomain(req: any, callback: (err: any, companyData: any) => void) {
    const emailDomain = utility.getHostInfo(req).request_emaildomain;
    db.MasterDB().Company.findOne(
        { emailDomain: emailDomain, is_deleted: false },
        (err: any, companyData: any) => {
            callback(err, companyData);
        }
    );
}

const getCompanyByEmailDomainasync = async (req: any) => {
    try {
        const emailDomain = utility.getHostInfo(req).request_emaildomain;

        const companyData = await db.MasterDB().Company.findOne({
            emailDomain: emailDomain,
            is_deleted: false
        });

        return companyData;
    } catch (err) {
        console.error("Error finding company by email domain:", err);
        throw err; // or handle the error appropriately
    }
}

const getCompanyByHostorDomain = async (req: any, tenant_name: any) => {
    try {
        const companyData = await db.MasterDB().Company.findOne({ hostname: tenant_name || utility.getTenantName(utility.getHostName(req)), is_deleted: false });
        return companyData
    } catch (err) {
        return null
    }
}

const updateCompanyStudioUser = async (req: any, data: any) => {
    await db.MasterDB().Company.updateOne({ hostname: req.body.tenant_name }, { $push: { studio_users: data._id } })
}

const updateCompanyStudioUserbyCompany = async (req: any, data: any) => {
    const company_info = await db.MasterDB().Company.findOne({ hostname: utility.getTenantName(req["headers"]["tenant"]), is_deleted: false }).select('studio_users hostname');
    await db.MasterDB().Company.updateOne({ _id: company_info._id }, { $push: { studio_users: data._id } })

}

const getTenantDomain = async (domain_name: any) => {
    try {
        const TenantDomain: any = db.MasterDB().TenantDomain;
        const tenantData = await TenantDomain.findOne({ domain_name: domain_name, is_deleted: false, is_active: true, status: 1 });
        return tenantData
    } catch (err) {
        return null
    }
}

export = {
    //Functions
    BasicAuthenticate: BasicAuthenticate,
    Authenticate: Authenticate,
    oauthaccess: oauthaccess,
    IsTenantConnection: IsTenantConnection,
    TenantConnection: TenantConnection,
    outhauthenticate: outhauthenticate,
    callBackTenantConnection: callBackTenantConnection,
    callBackAuthenticate: callBackAuthenticate,

    getCompanyInfo: getCompanyInfo,
    getCompanyByEmailDomain: getCompanyByEmailDomain,
    getCompanyByEmailDomainasync: getCompanyByEmailDomainasync,
    getCompanyInfoById: getCompanyInfoById,
    getCompanyInfoByHostName: getCompanyInfoByHostName,
    getCompanyByHostorDomain: getCompanyByHostorDomain,
    updateCompanyStudioUser: updateCompanyStudioUser,
    updateCompanyStudioUserbyCompany: updateCompanyStudioUserbyCompany,
    getTenantDomain: getTenantDomain

}


const crypto = require("crypto");
const algorithm = 'aes-256-ctr';
const password = 'n^6F!423DCvOlSfs*6!55wR2X4w20ji8';
const URL = require('url');
const ejs = require('ejs');
const PROCESS_ENV: any = process.env;

const replaceall = require("replaceall");


//Set default dashboardId
const defaultsystemids = {
    dashboardId: "5f190371db85375976b48101",
    tenantDashboardId: "62b46d8c0e0f2b10aca6b001",
    defaultDashboardPageId: "62b46d8c0e0f2b10aca6b001"
};

const IsTenant = (host: any) => {
    //let result = host == "portal" ? false : true
    let result = host ? !host.match(/^(portal-dev|localhost)$/) : false;
    //let result = host? !host.match(/^(portal|localhost)$/) : false; 
    return result;
}
const IsStudioTenant = (tenant: string) => {
    const result = tenant.search("-dev") >= 0 ? true : false
    return result;
}

const getISODate = () => {
    return new Date().toISOString()
}
const isFile = (doc?: any) => {
    return doc.type === "dir" || doc.mimeType === "application/vnd.google-apps.folder" ? false : true;
}

const getTenantName = (TenantName: any) => {
    return TenantName.replace("-dev", "");
}
const getTenantDevName = (TenantName: any) => {
    const is_dev_connection = (TenantName.search("-dev") >= 0) ? true : false;
    TenantName = is_dev_connection ? TenantName : TenantName + "-dev"
    return TenantName;
}

const getDomainName = (req: any) => {
    try {
        // Remove any leading whitespace
        var url = req.headers.host.trim();

        // Check if the URL starts with "localhost"
        if (url.startsWith("localhost")) {
            return url;
        }

        if (url.split(".").length > 2) {
            // Check if the URL contains a dot
            const dotIndex = url.indexOf(".");
            if (dotIndex !== -1) {
                // If there is a dot, return the substring after the first dot
                return url.slice(dotIndex + 1);
            }

        } else {
            return url
        }

        // If there is no dot, return the entire URL
        return url;
    } catch (err) {
        return null
    }

}

const getHostNameOrigin = (req: any) => {
    let tenant = req.headers.referer.match(/(?<=\/\/)(.*?)(?=\.|\:)/)[0];
    if (process.env.NODE_ENV == 'local') {
        tenant = req.headers.referer.search("3003") >= 0 ? (tenant == 'localhost' ? 'portal-dev' : tenant + '-dev') : (tenant == 'localhost' ? 'portal' : tenant);
    } else {
        tenant = req.headers.referer.search(".dev") >= 0 ? tenant + '-dev' : tenant;
    }
    return tenant;
}

const getHostName = (req: any) => {
    try {
        const urls = ["/auth/saml/external/callback", "/auth/saml/callback"];
        if (urls.includes(req.url)) throw ("");
        let tenant = req.headers.tenant ? req.headers.tenant : req.headers.origin ? req.headers.origin.match(/(?<=\/\/)(.*?)(?=\.|\:)/)[0] : (req.headers.referer ? req.headers.referer.match(/(?<=\/\/)(.*?)(?=\.|\:)/)[0] : req.headers.host.split(".")[0])
        if (req.headers.host == "localhost:3003" || req.headers.host == "localhost:3003") {
            return "portal";
        } else {
            return tenant == 'localhost' ? 'portal' : tenant;
        }
    } catch (error) {
        let tenant = req.headers.tenant ? req.headers.tenant : req.headers.host.split(".")[0];
        if (req.headers.host == "localhost:3003" || req.headers.host == "localhost:3003") {
            tenant = "portal";
        }
        return tenant == 'localhost' ? 'portal' : tenant;
    }
}

const encrypt = (text: string) => {
    var cipher = crypto.createCipher(algorithm, password);
    var crypted = cipher.update(text, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
}

const decrypt = (text: string) => {
    var decipher = crypto.createDecipher(algorithm, password);
    try {
        var dec = decipher.update(text, 'hex', 'utf8');
        dec += decipher.final('utf8');
        return dec;
    }
    catch (err) {
        return "";
    }
}

const getHostInfo = (req: any) => {
    var host = getHostName(req);
    let user_emaildomain = "", user_hostname = "";
    var temp_data = {
        hostName: "portal",
        emailDomain: "portal" + ".com",
        request_emaildomain: user_emaildomain,
        request_hostname: user_hostname
    }
    try {
        if (req.body && req.body.email) {
            user_emaildomain = req.body.email.split("@")[1];
            user_hostname = user_emaildomain.split(".")[0];
        }
        temp_data = {
            hostName: host,
            emailDomain: host + ".com",
            request_emaildomain: user_emaildomain,
            request_hostname: user_hostname
        }
    } catch (e: any) {
        console.log("getHostInfo error =>" + e.message);
    }

    return temp_data
}

//Used Gridfs
const convert = async (file: any, output: any, file_name: any, req: any, preset?: any) => {
    return new Promise(async (resolve, reject) => {
        try {
            resolve(false)
        } catch (err: any) {
            console.error(`Psst! something went wrong: ${err.msg}`)
            resolve(false)
        }
    })
}

const setContainerTenant = (req: any, res: any, next: any) => {
    try {
        req["headers"]["tenant"] = req.params.tenant;
        next()
    } catch (err) {
        next()
    }
}

const setTenantPublicUrl = (req: any, res: any, next: any) => {
    try {
        const url = URL.parse(req.url, true)
        let { filename } = req.params.filename ? req.params : url.query;
        filename = filename.split("?id=")[0];
        const tenantName = filename.split("-")[1] == "dev" ? filename.split("-")[0] + "-dev" : filename.split("-")[0];
        req["headers"]["tenant"] = tenantName;
        next()
    } catch (err) {
        next()
    }
}

const setTenantPublicUrlV2 = (req: any, res: any, next: any) => {
    try {
        let tenant = getHostNameEndpoint(req)
        req["headers"]["requestType"] = "ENDPOINT_API_CALL";
        if (process.env.NODE_ENV == "local") {
            console.log("req.headers.host", req.headers.host);
            req["headers"]["tenant"] = req.headers.host.search("5000") >= 0 ? tenant + '-dev' : tenant
        } else {
            let origin = req.headers.origin ? req.headers.origin : req.headers.host;
            req["headers"]["tenant"] = origin.search(".dev") >= 0 ? (tenant + '-dev') : (tenant)
        }
        next()
    } catch (err) {
        next()
    }
}

const setTenantOrigin = (req: any, res: any, next: any) => {
    try {
        if (!req.headers.tenant || req.headers.tenant == "") {
            req["headers"]["tenant"] = getHostName(req)
            req["headers"]["hostname"] = getHostName(req).replace("-dev", "");
        }
        next()
    } catch (err) {
        next()
    }
}

const setTenantOriginEndpoint = (req: any, res: any, next: any) => {
    try {
        let tenant = getHostName(req)
        if (process.env.NODE_ENV == "local") {
            req["headers"]["tenant"] = req.headers.host.search("3003") >= 0 ? tenant + '-dev' : tenant
        } else {
            let origin = req.headers.origin ? req.headers.origin : req.headers.host
            req["headers"]["tenant"] = origin.search(".dev") >= 0 ? tenant + '-dev' : tenant
        }
        next()
    } catch (err) {
        next()
    }
}

const GetDataBase = (dbBase: any) => {
    try {
        dbBase = dbBase.split("@")
        if (dbBase.length >= 2) {
            dbBase = dbBase[1].split("/")[1].split("?")[0]
        } else {
            dbBase = dbBase[0].split("/")[3].split("?")[0]
        }
        return dbBase
    } catch (err) {
        return dbBase
    }
}

async function printPDF(content: any, filename: any, data: any, callback: any) {
    try {

        let contents = content.replace('<script type="text/javascript" src="https://portal.glozic.com/assets/js/formio.js"></script>', "")
        //console.log(contents)
    } catch (err: any) {
        callback(false)
        console.log(err.message);
    }
}

const defaultSidenav = [
    {
        "app_id": "5f190371db85375976b48101",
        "createdTime": new Date().toISOString(),
        "createdBy": "",
        "modifiedTime": new Date().toISOString(),
        "modifiedBy": "",
        "is_deleted": 0,
        "groupLinks": [
            {
                "header": "Content",
                "dividerBottom": false,
                "links": [
                    {
                        "id": 2,
                        "name": "Collections",
                        "route": "/collections",
                        "icon": "view_module",
                        "text": "Collections"
                    },
                    {
                        "id": 6,
                        "name": "Page Layout",
                        "route": "/pages",
                        "icon": "settings",
                        "text": "Page Layout"
                    },
                    {
                        "id": 7,
                        "name": "Endpoint",
                        "route": "/endpoints",
                        "icon": "settings_ethernet",
                        "text": "Endpoint"
                    },
                    {
                        "id": 7,
                        "name": "Calendar",
                        "route": "/calendars",
                        "icon": "calendar_month",
                        "text": "Calendar"
                    },
                    {
                        "name": "workflow",
                        "route": "/workflows",
                        "icon": "link",
                        "text": "workflow"
                    },
                    {
                        "id": 5,
                        "name": "Connections",
                        "route": "/connections",
                        "icon": "settings_input_component",
                        "text": "Connections"
                    },
                    {
                        "id": 3,
                        "name": "File Folders",
                        "route": "/folders",
                        "icon": "folder",
                        "text": "File Folders"
                    },
                    {
                        "id": 8,
                        "name": "assets",
                        "route": "/assets",
                        "icon": "today",
                        "text": "assets"
                    }
                ]
            }
        ]
    },
    {
        "app_id": "5f190371db85375976b48102",
        "createdTime": new Date().toISOString(),
        "createdBy": "",
        "modifiedTime": new Date().toISOString(),
        "modifiedBy": "",
        "is_deleted": 0,
        "groupLinks": [
            {
                "header": "Admin",
                "dividerBottom": false,
                "links": [
                    {
                        "name": "user",
                        "route": "/user",
                        "icon": "account_circle",
                        "text": "User management"
                    },
                    {
                        "name": "Tenant Setting",
                        "route": "/settings",
                        "icon": "settings",
                        "text": "Tenant Setting"
                    },
                    {
                        "name": "email-templates",
                        "icon": "markunread",
                        "route": "/email-templates",
                        "text": "Email Templates"
                    },
                    {
                        "name": "Studio Settings",
                        "text": "Studio Settings",
                        "icon": "account_balance",
                        "sublink": [
                            {
                                "name": "Page Templates",
                                "route": "/page-templates",
                                "icon": "description",
                                "text": "Page Templates"
                            },
                            {
                                "name": "Widget",
                                "route": "/widgets",
                                "icon": "description",
                                "text": "Widgets"
                            }
                        ]
                    },
                    {
                        "name": "logs",
                        "route": "/logs",
                        "icon": "link",
                        "text": "logs"
                    }
                ]
            }
        ]
    }
];

const defualtPagePath = [{
    "_id": "5a190371db85375976b48001",
    "path_name": "/",
    "path_description": "This is Root Path ",
    "authentication_profile_id": "null",
    "createdBy": "5c4e707358093c2b7cccc7d2",
    "modifiedBy": "5c4e707358093c2b7cccc7d2",
    "createdAt": "2021-09-27T06:57:07.903Z",
    "updatedAt": "2021-09-27T06:57:07.903Z",
    "is_system": true
}, {
    "_id": "5a190371db85375976b48002",
    "path_name": "/public",
    "path_description": "This is Root Path ",
    "authentication_profile_id": "null",
    "createdBy": "5c4e707358093c2b7cccc7d2",
    "modifiedBy": "5c4e707358093c2b7cccc7d2",
    "createdAt": "2021-09-27T06:57:07.903Z",
    "updatedAt": "2021-09-27T06:57:07.903Z",
    "is_system": true
}];

const getObjectKey = (string: any, index: any, variable: any) => {
    try {
        var result = "";
        if (string.split("[[{").length >= 2) {
            let stringArrya = string.split("],[");
            if (variable) {
                stringArrya.forEach((ele: any) => {
                    let data = JSON.parse(ele.replace("[[{", "[{").replace("}]]", "}]"));
                    if (data && data.length != 0 && (data[0].value.search(variable) >= 0)) {
                        result = data[0].value.replace(/{{/g, "").replace(/}}/g, "").split(".")[index];
                        return false;
                    }
                });
            } else {
                stringArrya.forEach((ele: any) => {
                    let r1 = replaceall("[[{", "[{", ele);
                    let r2 = replaceall("}]]", "}]", r1);
                    let data = JSON.parse(r2);
                    if (data && data.length != 0) {
                        result = data[0].value.replace(/{{/g, "").replace(/}}/g, "").split(".")[index];
                        return false;
                    }
                });
            }

            // result = JSON.parse(string)[0][0].value.replaceAll("{{", "").replaceAll("}}", "").split(".")[index];
        } else {
            result = string.replace(/{{/g, "").replace(/}}/g, "").split(".")[index];
        }
        return result
    } catch (err) {
        console.log(err);
        return string
    }
}

const loadVariablesold = (column: any, obj: any) => {
    try {
        var gv: any = [], s, string = column.value;
        const regex1 = /\[([[.*+?^$(){[\]}:@"0-9a-zA-Z_., \/\']+)\]/gm; // "[[{value:{{user.name}}]]"
        const regex2 = /\{{([0-9a-zA-Z-_., \/\']+)\}}/gm; // {{user.firstname}}
        [regex1, regex2].forEach(ele => {
            while ((s = ele.exec(string)) !== null) {
                if (s.index === ele.lastIndex) {
                    ele.lastIndex++;
                }
                gv.push(s[0]);
            }
        });

        for (let index = 0; index < gv.length; index++) {
            const objectKey = getObjectKey(gv[index], 1, null);
            string = string.replace(gv[index], obj[objectKey])
        }
        return string
    } catch (err) {
        return "-"
    }
}

const loadVariables = (column: any, Variables: any) => {
    try {

        //String like "[[{value:{{user.name}}]]" ||  {{user.firstname}} 
        var gv: any = [], s, string = column.value;
        string = replaceall("]]", ']]$', replaceall("[[", '$[[', string))
        const regex1 = /\$([.*+?^$(){[\]}:@"0-9a-zA-Z-_.,\/\']+)\$/gm; // "[[{value:{{user.name}}]]"
        [regex1].forEach(ele => {
            while ((s = ele.exec(string)) !== null) {
                if (s.index === ele.lastIndex) {
                    ele.lastIndex++;
                }

                const regex2 = /{{([^{}[\]]*?(?:(?:\[[^\]]*\])[^{}[\]]*?)*)}}/g;
                while (true) {
                    const match = regex2.exec(s[0])
                    if (!match) {
                        break;
                    } else {
                        string = string.replace(s[0], `{{${match[1]}}}`)
                        gv.push(`{{${match[1]}}}`);
                    }
                }
            }
        });

        const regex3 = /{{([^{}[\]]*?(?:(?:\[[^\]]*\])[^{}[\]]*?)*)}}/g;
        while (true) {
            const match = regex3.exec(string)
            if (!match) {
                break;
            } else {
                gv.push(`{{${match[1]}}}`);
            }
        }

        for (let index = 0; index < gv.length; index++) {
            string = ejsRender(string, { data: Variables })
        }
        return string
    } catch (err) {
        return "-"
    }
}

const isJSON = (str: any) => {
    try {
        return (JSON.parse(str) && !!str);
    } catch (e) {
        return false;
    }
}

const isJSONV2 = (str: any) => {
    try {
        return (JSON.parse(str) && typeof JSON.parse(str) == 'object');
    } catch (e) {
        return false;
    }
}

const stringuuiid = (string: any) => {
    try {
        return encrypt(string.toLowerCase().replace(" ", ""))
    } catch (err) {
        return string;
    }
}

const isCheckString = (string: any) => {
    try {
        if (typeof string == 'string') {
            return true;
        } else {
            return false;
        }
    } catch (e) {
        return false;
    }
}

const getDocumentIdObjectSchema = (object: any) => {
    if (object.documentId || object.documentid) {
        object["_id"] = object._id || (object.documentId ? object.documentId : object.documentid);
        delete object.documentId;
        delete object.documentid;
    }
    return object
}

const getDocumentIdFieldSchema = (field: any) => {
    let tempField = field
    if (field == "documentId" || field == "documentId") {
        tempField = "_id"
    }
    return tempField
}

const getHostNameEndpoint = (req: any) => {
    try {
        const urls = ["/auth/saml/external/callback", "/auth/saml/callback"];
        if (urls.includes(req.url)) throw ("");
        let tenant = req.headers.tenant ? req.headers.tenant : req.headers.origin ? req.headers.origin.match(/(?<=\/\/)(.*?)(?=\.|\:)/)[0] : req.headers.host.split(".")[0];
        if (req.headers.host == "localhost:3003" || req.headers.host == "localhost:3003") {
            return "portal";
        } else {
            return tenant == 'localhost' ? 'portal' : tenant;
        }
    } catch (error) {
        let tenant = req.headers.tenant ? req.headers.tenant : req.headers.host.split(".")[0];
        if (req.headers.host == "localhost:3003" || req.headers.host == "localhost:3003") {
            tenant = "portal";
        }
        return tenant == 'localhost' ? 'portal' : tenant;
    }
}


const randomString = (length: any) => {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}

const ejsRender = (value: any, varVault: any) => {
    try {
        value = replaceall("}}", "%>", replaceall("{{", "<%=", value));
        value = replaceall("%}", "%>", replaceall("{%", "<%", value));
        let varVaultdata: any = {};
        Object.keys(varVault).forEach(ele => {
            varVaultdata[ele] = isJSON(varVault[ele]) ? JSON.parse(varVault[ele]) : varVault[ele]
        });
        const outputHtml = ejs.render(value, varVaultdata);
        return outputHtml;
    } catch (err) {
        return value;
    }

}

const IsTenantPlatform = (company: any) => {
    var result = false;
    if (company && company.tenant_type == 'Platform') {
        result = true;
    }
    return result
}

export default {
    setTenantPublicUrl: setTenantPublicUrl,
    setContainerTenant: setContainerTenant,
    setTenantOrigin: setTenantOrigin,
    IsTenant: IsTenant,
    getHostName: getHostName,
    encrypt: encrypt,
    decrypt: decrypt,
    getHostInfo: getHostInfo,
    PDFconvert: convert,
    getISODate,
    isFile,
    GetDataBase,
    printPDF,
    getTenantName,
    getTenantDevName,
    getHostNameOrigin,
    loadVariables,
    isJSON,
    stringuuiid,
    defaultSidenav,
    defualtPagePath,
    isCheckString,
    getDocumentIdObjectSchema,
    setTenantOriginEndpoint,
    getDocumentIdFieldSchema,
    defaultsystemids,
    randomString,
    setTenantPublicUrlV2,
    IsStudioTenant,
    IsTenantPlatform
}
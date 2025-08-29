import Database from './Database';
import Company from '../Company/CompanyModel';
import TenantDomain from '../Company/TenantDomainModel';
import CollectionsForms from '../Feed/Collections/CollectionFormsModel';
import CollectionModels from "../Feed";
import LogsFactory from "../Feed/SystemLogs/logsModel"


const PROCESS_ENV: any = process.env;
const mongoose = require('mongoose');
mongoose.set('debug', process.env.NODE_ENV == "local" ? true : false);

var PROCESS_ENV_DB: any = {
    BASIC_AUTHENTICATE: 'ZGVtb2NsaWVudDpkZW1vY2xpZW50c2VjcmV0'
}
Database["db_url"] = {};

const connection = (tenant_name: any, TenantDBURL?: any) => {
    return new Promise(async (resolve: any, reject: any) => {
        try {
            if (!Database[tenant_name]) {
                const MONGO_URI = tenant_name === "portal-dev" ? PROCESS_ENV.MONGO_URI : TenantDBURL;

                // ✅ Use .asPromise() to get a real promise
                const db = await mongoose.createConnection(MONGO_URI).asPromise();

                if (tenant_name === "portal-dev") {
                    const PortalDB = {
                        ...CollectionModels(PROCESS_ENV.MONGO_URI, db),
                        Company: Company(db),
                        TenantDomain: TenantDomain(db),
                        Logs: await LogsFactory(db),
                    };
                    Database[tenant_name] = PortalDB;
                    Database["db_url"][tenant_name] = MONGO_URI;
                } else {
                    Database[tenant_name] = {
                        ...CollectionModels(MONGO_URI, db),
                        Logs: await LogsFactory(db),
                    };
                    Database["db_url"][tenant_name] = MONGO_URI;
                }

                if (Database[tenant_name]) {
                    resolve(true);
                } else {
                    console.log("103 connection error =>", Database[tenant_name]);
                    reject(false);
                }
            } else {
                resolve(true);
            }
        } catch (err) {
            console.log("107 connection error =>", err);
            reject(false);
        }
    });
};

//Database connection 
const Newconnection = (tenant_name: any, TenantDBURL?: any) => {
    return new Promise((resolve: any, reject: any) => {
        if (tenant_name != 'portal-dev') {
            const MONGO_URI = TenantDBURL;
            var db = mongoose.createConnection(MONGO_URI);
            db.then((res: any) => {
                Database[tenant_name] = CollectionModels(MONGO_URI, db)
                Database["db_url"][tenant_name] = MONGO_URI;
                resolve(true)
            }).catch((err: any) => {
                console.log(err.message);
                resolve(false)
            });
        } else {
            resolve(false)
        }
    });
}

// //Master Database Connection schema 
const MasterDB = () => {
    return Database["portal-dev"];
}

//Tenant Database schema 
const TenantDB = (tenant_name: string, TenantDBURL?: any, DyanmicCollection?: any) => {
    return Database[tenant_name]
}

//Dynamic Collection Template form 
const DaynamicCollectionForm = (tenant_name: string, DyanmicCollection?: any) => {
    if (!Database[tenant_name][DyanmicCollection]) {
        Database[tenant_name][DyanmicCollection] = CollectionsForms(Database[tenant_name].mydb, DyanmicCollection)
    }
    return Database[tenant_name][DyanmicCollection]
}

//ValidConnection 
const ValidConnection = (TenantDBURL: any) => {
    console.log(TenantDBURL);
    return new Promise(async (resolve: any, reject: any) => {
        try {
            var db = mongoose.createConnection(TenantDBURL);
            db.then((res: any) => {
                const tempTable = CollectionsForms(db, 'tempTable')
                tempTable.create({ "verify": true }).then(() => {
                    tempTable.collection.drop().then(() => {
                        db.close();
                        resolve({ status: true })
                    }).catch((err: any) => {
                        console.log(err.message);
                        reject({ status: false, message: err.message })
                    });
                }).catch((err: any) => {
                    console.log(err.message);
                    reject({ status: false, message: err.message })
                });
            }).catch((err: any) => {
                console.log(err.message);
                reject({ status: false, message: err.message })
            });
        } catch (err) {
            reject({ status: false, message: err instanceof Error ? err.message : String(err) })
        }
    });
}

var DeleteDatabaseConnection = (tenantName: string) => {
    delete Database[tenantName];
    delete Database["db_url"][tenantName];
    return Database["db_url"];
}

var ResetAllDatabaseConnection = () => {
    try {
        const dbLists = Object.keys(Database);
        dbLists.forEach(ele => {
            delete Database[ele];
        });
        return true;
    } catch (err) {
        return err instanceof Error ? err.message : String(err)
    }
}

const GetDatabaseLists = () => {
    return Database["db_url"]
}

const isObjecjtKey = (id: any) => {
    try {
        const ObjectId = mongoose.Types.ObjectId;
        if (ObjectId.isValid(id)) {
            if ((String)(new ObjectId(id)) === id)
                return true;
            return false;
        }
        return false;
    } catch (err) {
        return false
    }
}

const isValidObjectId = (string: any) => {
    try {
        if (typeof string == "string") {
            return (mongoose.Types.ObjectId.isValid(string) && string.match(/^[0-9a-fA-F]{24}$/))
        } else {
            return false
        }
    } catch (err) {
        return false
    }
}

export default {
    DaynamicCollectionForm: DaynamicCollectionForm,
    ValidConnection: ValidConnection,
    connection: connection,
    Newconnection: Newconnection,
    MasterDB: MasterDB,
    TenantDB: TenantDB,
    ObjectId: mongoose.Types.ObjectId,
    isObjecjtKey: isObjecjtKey,
    isValidObjectId: isValidObjectId,
    GetDatabaseLists: GetDatabaseLists,
    DeleteDatabaseConnection: DeleteDatabaseConnection,
    ResetAllDatabaseConnection: ResetAllDatabaseConnection,
    PROCESS_ENV_DB: PROCESS_ENV_DB
}
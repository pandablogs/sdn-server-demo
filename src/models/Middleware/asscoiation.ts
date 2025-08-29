
const findAll = (schemas: any, asscoiation: any) => {
    let lookup: any = [];
    schemas = schemas.concat([{ "foreignKey": "createdBy", "targetKey": "_id", "relationType": "Belongs-to", "refCollection": "users", "alias": "createdBy" }])
    schemas.forEach((element: any) => {
        const alias = `${element.alias ? element.alias : element.foreignKey}`
        element.targetKey =  (element.targetKey=="documentId" || element.targetKey=="documentid") ? "_id" : element.targetKey
        element.foreignKey = (element.foreignKey=="documentId" || element.foreignKey=="documentid") ? "_id" : element.foreignKey
        let tempLookups: any = [{
            $lookup: {
                from: element.refCollection,
                localField: element.foreignKey,
                foreignField: element.targetKey,
                as: alias
            }
        }]
	
        if (element.relationType == "Belongs-to") {
            tempLookups.push({
                "$unwind": {
                    path: `$${alias}`,
                    preserveNullAndEmptyArrays: true,
                }
            })
        }

        //Filter User collection Keys
        if (element.foreignKey == "createdBy") {
            tempLookups[0]["$lookup"]['pipeline'] = [
                {
                    $project: {
                        _id: 1,
                        "firstname": 1,
                        "lastname": 1,
                        "email": 1,
                        "username": 1,
                        "gender": 1,
                        "level": 1
                    }
                }
            ]
        }

        lookup = tempLookups.concat(lookup)
    });
    asscoiation = lookup.concat(asscoiation);
    return asscoiation;
}

export default {
    findAll: findAll,
}
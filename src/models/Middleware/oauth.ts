import utility from '../../services/utility'
var _ = require('lodash');

var User: any,
    OAuthClient: any,
    OAuthAccessToken: any,
    OAuthAuthorizationCode: any,
    OAuthRefreshToken: any;


let getAccessToken = async (bearerToken: any) => {
    return new Promise(async (resolve, rejecte) => {
        try {
            const res_data = await OAuthAccessToken.aggregate([
                { $match: { access_token: bearerToken, is_deleted: false } },
                {
                    $lookup:
                    {
                        from: 'users',
                        localField: 'User',
                        foreignField: '_id',
                        as: 'User'
                    }
                },
                {
                    $unwind: "$User"
                },
                {
                    $lookup: {
                        from: "oauthclients",
                        localField: "OAuthClient",
                        foreignField: "_id",
                        as: "OAuthClient"
                    }
                },
                {
                    $unwind: "$OAuthClient"
                }
            ]);
            if (res_data.length != 0) {
                var token = res_data[0];
                token.user = token.User;
                token.client = token.OAuthClient;
                token.accessTokenExpiresAt = token.expires
                token.scope = token.scope
                resolve(token);
            } else {
                rejecte(false)
            }
        } catch (err) {
            rejecte(false)
        }

    })
}

function getClient(clientId: any, clientSecret: any) {
    console.log("getClient");

    const options: any = { client_id: clientId };
    if (clientSecret) options.client_secret = clientSecret;
    return OAuthClient
        .findOne(options)
        .then(function (client: any) {
            if (!client) return new Error("client not found");
            var clientWithGrants = client
            clientWithGrants.grants = ['authorization_code', 'password', 'refresh_token', 'client_credentials']
            // Todo: need to create another table for redirect URIs
            clientWithGrants.redirectUris = [clientWithGrants.redirect_uri]
            delete clientWithGrants.redirect_uri
            return clientWithGrants
        }).catch(function (err: any) {
            console.log("error => " + err.message);
        });
}

const getUser = async (requestData: any, password: any) => {
    try {
        var filter: any = { email: requestData.email };
        if (requestData.level) {
            filter["level"] = requestData.level
        }
        if (requestData.console_type) {
            filter["console_type"] = requestData.console_type
        }

        filter["password"] = utility.encrypt(password)
        var user = await User.findOne(filter);
        return user
    } catch (err: any) {
        console.log(err.message);
        return false
    }
}

function revokeAuthorizationCode(code: any) {
    console.log("revokeAuthorizationCode");
    return OAuthAuthorizationCode.findOne({
        where: {
            authorization_code: code.code
        }
    }).then(function (rCode: any) {
        var expiredCode = code
        expiredCode.expiresAt = new Date('2015-05-28T06:59:53.000Z')
        return expiredCode
    }).catch(function (err: any) {
        console.log("error => " + err.message);
    });
}

function revokeToken(token: any) {
    console.log("revokeToken");
    return OAuthRefreshToken.findOne({ refresh_token: token.refreshToken }).then(function (rT: any) {
        OAuthRefreshToken.remove({ refresh_token: token.refreshToken });
        var expiredToken = token
        expiredToken.refreshTokenExpiresAt = new Date('2015-05-28T06:59:53.000Z')
        return expiredToken
    }).catch(function (err: any) {
        console.log("error => " + err.message);
    });
}

function saveToken(token: any, client: any, user: any) {
    return Promise.all([
        OAuthAccessToken.create({
            access_token: token.accessToken,
            expires: token.accessTokenExpiresAt,
            OAuthClient: client._id,
            User: user._id,
            scope: token.scope
        }),
        token.refreshToken ? OAuthRefreshToken.create({ // no refresh token for client_credentials
            refresh_token: token.refreshToken,
            expires: token.refreshTokenExpiresAt,
            OAuthClient: client._id,
            User: user._id,
            scope: token.scope
        }) : [],
    ]).then(function (resultsArray) {
        return _.assign({
            client: client,
            user: user,
            access_token: token.accessToken, // proxy
            refresh_token: token.refreshToken, // proxy
        }, token)
    }).catch(function (err) {
        console.log("error => " + err.message);
    });
}

function saveAuthorizationCode(code: any, client: any, user: any) {
    console.log("saveAuthorizationCode");
    return OAuthAuthorizationCode
        .create({
            expires: code.expiresAt,
            OAuthClient: client._id,
            authorization_code: code.authorizationCode,
            User: user._id,
            scope: code.scope
        })
        .then(function () {
            code.code = code.authorizationCode
            return code
        }).catch(function (err: any) {
            console.log("saveAuthorizationCode error => " + err.message);
        });
}

function getUserFromClient(client: any) {
    console.log("getUserFromClient");
    var options: any = { client_id: client.client_id };

    if (client.client_secret) options.client_secret = client.client_secret;

    return new Promise((resolve, rejecte) => {
        OAuthClient.aggregate([
            { $match: options },
            {
                $lookup:
                {
                    from: 'users',
                    localField: 'User',
                    foreignField: '_id',
                    as: 'User'
                }
            },
            {
                $unwind: "$User"
            }
        ]).next(function (err: any, client: any) {
            if (client) {
                resolve(client.User);
            } else {
                rejecte(false);
            }

        });
    });
}

function getRefreshToken(refreshToken: any) {

    if (!refreshToken || refreshToken === 'undefined') return false
    return new Promise((resolve, rejecte) => {
        OAuthRefreshToken.aggregate([
            { $match: { refresh_token: refreshToken } },
            {
                $lookup:
                {
                    from: 'users',
                    localField: 'User',
                    foreignField: '_id',
                    as: 'User'
                }
            },
            {
                $unwind: "$User"
            },
            {
                $lookup: {
                    from: "oauthclients",
                    localField: "OAuthClient",
                    foreignField: "_id",
                    as: "OAuthClient"
                }
            },
            {
                $unwind: "$OAuthClient"
            }
        ]).next(function (err: any, savedRT: any) {
            if (savedRT) {
                var tokenTemp = {
                    user: savedRT ? savedRT.User : {},
                    client: savedRT ? savedRT.OAuthClient : {},
                    refreshTokenExpiresAt: savedRT ? new Date(savedRT.expires) : null,
                    refreshToken: refreshToken,
                    refresh_token: refreshToken,
                    scope: savedRT.scope
                };
                resolve(tokenTemp);
            } else {
                rejecte(true);
            }

        });
    });
}

function verifyScope(token: any, scope: any) {
    return token.scope === scope
}

function SetCollection(PayloadConnection: any) {

    User = PayloadConnection.User
    OAuthClient = PayloadConnection.OAuthClient
    OAuthAccessToken = PayloadConnection.OAuthAccessToken
    OAuthAuthorizationCode = PayloadConnection.OAuthAuthorizationCode
    OAuthRefreshToken = PayloadConnection.OAuthRefreshToken
}

export = {

    //Functions
    getAccessToken: getAccessToken,
    getClient: getClient,
    getRefreshToken: getRefreshToken,
    getUser: getUser,
    getUserFromClient: getUserFromClient,
    revokeAuthorizationCode: revokeAuthorizationCode,
    revokeToken: revokeToken,
    saveToken: saveToken,//saveOAuthAccessToken, renamed to
    saveAuthorizationCode: saveAuthorizationCode, //renamed saveOAuthAuthorizationCode,
    verifyScope: verifyScope,
    SetCollection: SetCollection
}

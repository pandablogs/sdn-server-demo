// Import Models using Default Import
import OauthAccessTokens from './AuthTokens/OauthAccessTokensModel';
import OauthClients from './AuthTokens/OauthClientModel';
import OauthScopes from './AuthTokens/OauthScopesModel';
import RefreshTokens from './AuthTokens/refreshtokensModel';
import Users from './Users/UsersModel';


// Collection Models Factory Function
const CollectionModels = (MONGO_URI: any, DBConnection: any) => {
    return {
        mydb: DBConnection,
        Users: Users(DBConnection),
        OauthAccessTokens: OauthAccessTokens(DBConnection),
        OauthClients: OauthClients(DBConnection),
        OauthScopes: OauthScopes(DBConnection),
        RefreshTokens: RefreshTokens(DBConnection)
    };
};

export default CollectionModels;

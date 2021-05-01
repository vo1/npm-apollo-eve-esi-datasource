import { Response, ValueOrPromise } from 'apollo-server-env';
import { RequestOptions, RESTDataSource } from 'apollo-datasource-rest';
export interface AuthToken {
    accessToken?: string;
    tokenType?: string;
    expiresIn?: number;
    refreshToken?: string;
    expires?: string;
}
export interface ESIContext {
    dataSources: {
        source: ESIDataSource;
    };
    ESI: {
        clientId: string;
        clientSecret: string;
        scopes: string[];
    };
    token: string;
}
export declare class ESIDataSource extends RESTDataSource<ESIContext> {
    protected token: AuthToken;
    private oneTimeAuthorizationToken;
    private API;
    private ESILoginUrl;
    private ESITokenUrl;
    private ESIVerifyUrl;
    getSSOLoginURL(callbackUri: string, state?: string): string;
    verifyToken(): Promise<number>;
    getAuthorizationToken(code: string): Promise<AuthToken>;
    willSendRequest(request: RequestOptions): ValueOrPromise<void>;
    parseBody(response: Response): Promise<object | string>;
    protected query<TResult = any>(path: string, id?: number, fieldName?: string): Promise<TResult>;
}

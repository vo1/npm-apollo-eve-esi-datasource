"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ESIDataSource = void 0;
const apollo_datasource_rest_1 = require("apollo-datasource-rest");
const humps_1 = __importDefault(require("humps"));
const url_1 = require("url");
const base64 = require('base-64');
class ESIDataSource extends apollo_datasource_rest_1.RESTDataSource {
    constructor() {
        super(...arguments);
        this.token = {};
        this.me = {};
        this.oneTimeAuthorizationToken = '';
        this.API = 'https://esi.evetech.net/latest/';
        this.ESILoginUrl = 'https://login.eveonline.com/v2/oauth/authorize?response_type=code&redirect_uri={{redirect_uri}}&client_id={{client_id}}&scope={{scopes}}&state={{state}}';
        this.ESITokenUrl = 'https://login.eveonline.com/v2/oauth/token';
        this.ESIVerifyUrl = 'https://login.eveonline.com/oauth/verify';
    }
    getScopes() {
        let result = { _: 0 };
        return new Promise((r) => r(result));
    }
    getSSOLoginURL(callbackUri, state, scopes) {
        let _state = state || 'esi-gql-data-source', _scopes = this.context.ESI.scopes;
        if (typeof (scopes) !== 'undefined') {
            _scopes = [..._scopes, ...scopes];
        }
        return encodeURI(this.ESILoginUrl
            .replace('{{client_id}}', this.context.ESI.clientId)
            .replace('{{scopes}}', _scopes.join(' '))
            .replace('{{redirect_uri}}', callbackUri)
            .replace('{{state}}', _state));
    }
    getSelf() {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof (this.me.id) === 'undefined') {
                this.me = (yield this.query(`characters/:id`, yield this.verifyToken()));
            }
            return this.me;
        });
    }
    verifyToken() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.get(this.ESIVerifyUrl)).characterID;
        });
    }
    getAuthorizationToken(code) {
        return __awaiter(this, void 0, void 0, function* () {
            this.oneTimeAuthorizationToken = 'Basic ' + base64.encode(this.context.ESI.clientId + ':' + this.context.ESI.clientSecret);
            return this.post(this.ESITokenUrl, new url_1.URLSearchParams({ grant_type: "authorization_code", code: code }).toString(), { headers: { "content-type": "application/x-www-form-urlencoded" } });
        });
    }
    willSendRequest(request) {
        if (typeof (request.headers.get('content-type')) === 'undefined') {
            request.headers.set('content-type', 'application/json');
        }
        if (typeof (request.headers.get('accept')) === 'undefined') {
            request.headers.set('accept', 'application/json');
        }
        if (this.context.token.length > 0) {
            request.headers.set('Authorization', this.context.token);
        }
        ;
        if (this.oneTimeAuthorizationToken.length > 0) {
            request.headers.set('Authorization', this.oneTimeAuthorizationToken);
            this.oneTimeAuthorizationToken = '';
        }
        request.body = humps_1.default.decamelizeKeys(request.body);
    }
    parseBody(response) {
        const _super = Object.create(null, {
            parseBody: { get: () => super.parseBody }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const parsedResponse = yield _super.parseBody.call(this, response);
            if (typeof parsedResponse === 'string') {
                return parsedResponse;
            }
            return humps_1.default.camelizeKeys(parsedResponse);
        });
    }
    query(path, id, fieldName) {
        return __awaiter(this, void 0, void 0, function* () {
            let url = this.API + path;
            if (typeof (id) !== 'undefined') {
                url = url.replace(':id', id.toString());
            }
            if (typeof (fieldName) === 'undefined') {
                fieldName = 'id';
            }
            let response = yield this.get(url);
            if (typeof (response) === 'object') {
                response[fieldName] = id;
            }
            ;
            return response;
        });
    }
}
exports.ESIDataSource = ESIDataSource;

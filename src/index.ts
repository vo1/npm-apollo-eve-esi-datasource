import { Request, Response, ValueOrPromise } from 'apollo-server-env'
import { RequestOptions, RESTDataSource } from 'apollo-datasource-rest'
import humps from 'humps';
const base64 = require('base-64');

export interface AuthToken
{
	accessToken?: string;
	tokenType?: string;
	expiresIn?: number;
	refreshToken?: string;
	expires?: string;
}

export interface ESIContext
{
    dataSources: {
        source: ESIDataSource
    },
    ESI: {
        clientId: string,
        clientSecret: string,
        scopes: string[],
    },
    token: string,
}

export interface ScopesType
{
	_: number;
}

export interface Character
{
	id: number;
	allianceId: number;
	ancestryId: number;
	birthday: string;
	bloodlineId: number;
	corporationId: number;
	description: string;
	factionId: number;
	gender: string;
	name: string;
	raceId: number;
	securityStatus: number;
	title: string;
}

export class ESIDataSource extends RESTDataSource<ESIContext>
{
	protected token:AuthToken = {};
	protected me: Character = <Character>{};
	
	private oneTimeAuthorizationToken: string = '';
	private API:string = 'https://esi.evetech.net/latest/';
	private ESILoginUrl = 'https://login.eveonline.com/v2/oauth/authorize?response_type=code&redirect_uri={{redirect_uri}}&client_id={{client_id}}&scope={{scopes}}&state={{state}}';
	private ESITokenUrl = 'https://login.eveonline.com/v2/oauth/token';
	private ESIVerifyUrl = 'https://login.eveonline.com/oauth/verify';

	getScopes(): Promise<ScopesType>
	{
		let result: ScopesType = { _: 0 };
		return new Promise((r) => r(result));
	}

	getSSOLoginURL(callbackUri: string, state?: string, scopes?: string[]): string
	{
		let _state: string = state || 'esi-gql-data-source',
			_scopes = this.context.ESI.scopes;
		if (typeof(scopes) !== 'undefined') {
			_scopes = [ ..._scopes, ...scopes ];
		}
		return encodeURI(
			this.ESILoginUrl
				.replace('{{client_id}}', this.context.ESI.clientId)
				.replace('{{scopes}}', _scopes.join(' '))
				.replace('{{redirect_uri}}', callbackUri)
				.replace('{{state}}', _state)
		);
	}

	async getSelf(): Promise<Character>
	{
		if (typeof(this.me.id) === 'undefined') {
			this.me = <Character>(await this.query(`characters/:id`, await this.verifyToken()));
		}
		return this.me;
	}
	
	async verifyToken(): Promise<number>
	{
		return (await this.get(this.ESIVerifyUrl)).characterID;
	}

	async getAuthorizationToken(code: string): Promise<AuthToken>
	{
		this.oneTimeAuthorizationToken = 'Basic ' + base64.encode(this.context.ESI.clientId + ':' + this.context.ESI.clientSecret);
		return this.post<AuthToken>(this.ESITokenUrl, JSON.stringify({grant_type: "authorization_code", code: code}));
	}

	willSendRequest(request: RequestOptions): ValueOrPromise<void>
	{
		request.headers.set('accept', 'application/json');
		request.headers.set('content-type', 'application/json');
		if (this.context.token.length > 0) {
			request.headers.set('Authorization', this.context.token);
		};
		if (this.oneTimeAuthorizationToken.length > 0) {
			request.headers.set('Authorization', this.oneTimeAuthorizationToken);
			this.oneTimeAuthorizationToken = '';
		}
		request.body = humps.decamelizeKeys(request.body as Record<string, any>) as any;
	}

	async parseBody(response: Response): Promise<object | string>
	{
		const parsedResponse = await super.parseBody(response);
		if (typeof parsedResponse === 'string') {
			return parsedResponse;
		}
		return humps.camelizeKeys(parsedResponse);
	}

	protected async query<TResult = any>(path: string, id?: number, fieldName?: string): Promise<TResult>
	{
		let url:string = this.API + path;
		if (typeof(id) !== 'undefined') {
			url = url.replace(':id', id.toString());
		}
		if (typeof(fieldName) === 'undefined') {
			fieldName = 'id';
		}
		let response = await this.get(url);
		if (typeof(response) === 'object') {
			response[fieldName] = id;
		};
		return response;
	}
}

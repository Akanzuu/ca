import * as fun from 'funcaptcha';

export interface Env {
	API_KEY: string
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		let key = request.headers.get("api-key");
		if(key !== env.API_KEY) return new Response("Invalid API key");
		return new Response("hello")
	},
};
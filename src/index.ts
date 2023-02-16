import * as fun from 'funcaptcha';

export interface Env {
	API_KEY: string,
	username: string,
	password: string
}

const CAPTCHA_KEY = "476068BF-9607-4799-B53D-966BE98E2B81";

async function login(username: string, password: string, csrfToken?: string, captchaId?: string, captchaToken?: string) {
	return await fetch("https://auth.roblox.com/v2/login", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/109.0",
			"X-CSRF-TOKEN": csrfToken || "",
		},
		body: JSON.stringify({
			"ctype": "Username",
			"cvalue": username,
			"password": password,
			"captchaId": captchaId || "",
			"captchaToken": captchaToken || ""
		})
	});
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		try {
			let key = request.headers.get("api-key");
			if(key !== env.API_KEY) return new Response("Invalid API key");
			let res = await login(env.username, env.password);
			let resText = await res.text();
			while(true) {
				let csrfToken = res.headers.get("x-csrf-token");
				res = await login(env.username, env.password, csrfToken);
				resText = await res.text();
				let resJSON = JSON.parse(resText);
				if(resJSON.errors[0].message !== "Token Validation Failed") break;
			}
			let fieldData = JSON.parse(JSON.parse(resText).errors[0].fieldData);
			console.log(fieldData);
			return new Response("Testing complete");
		} catch(e) {
			return new Response(`Something went wrong: ${e}. Please report this on the Github`)
		}
	},
};
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

async function doPostToken(env: Env, csrfToken: string, captchaID: string, captchaToken: string) {
	
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		try {
			let key = request.headers.get("api-key");
			if(key !== env.API_KEY) return new Response("Invalid API key", {status: 403});
			if(request.headers.get("csrfToken")) {
				let cookie = await doPostToken(env, request.headers.get("csrfToken"), request.headers.get("captchaID"), request.headers.get("captchaToken"));
			}
			let res = await login(env.username, env.password);
			let resText = await res.text();
			let csrfToken;
			while(true) {
				csrfToken = res.headers.get("x-csrf-token");
				res = await login(env.username, env.password, csrfToken);
				resText = await res.text();
				let resJSON = JSON.parse(resText);
				if(resJSON.errors[0].message !== "Token Validation Failed") break;
			}
			let fieldData = JSON.parse(JSON.parse(resText).errors[0].fieldData);
			if(!fieldData) return new Response(`A response that wasn't a captcha response was recieved. The API response is below\n\n${resText}`, {status: 403});
			let captchaID = fieldData.unifiedCaptchaId;
			let dataBlob = fieldData.dxBlob
			let captchaToken = await fun.getToken({
				pkey: CAPTCHA_KEY,
				surl: "https://roblox-api.arkoselabs.com",
				data: {
					blob: dataBlob
				},
				headers: {
					"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/109.0"
				},
				site: "https://www.roblox.com"
			});
			let session = new fun.Session(captchaToken, {
				userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/109.0"
			})
			let response = JSON.stringify({
				htmlFileContent: `<iframe src="${session.getEmbedUrl()}" height="200" width="300" title="Captcha"></iframe>`,
				csrfToken: csrfToken,
				captchaID: captchaID,
				captchaToken: captchaToken.token
			});
			return new Response(response);
		} catch(e) {
			return new Response(`Something went wrong: ${e}. Please report this on the Github`, {status: 500})
		}
	},
};
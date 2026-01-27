import { Configuration, PopupRequest } from "@azure/msal-browser";

export const msalConfig: Configuration = {
	auth: {
		clientId: process.env.AZURE_AD_CLIENT_ID || "",
		authority: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}`,
		redirectUri: process.env.AZURE_AD_REDIRECT_URI || window.location.origin,
	},
	cache: {
		cacheLocation: "sessionStorage",
	},
};

export const loginRequest: PopupRequest = {
	scopes: ["User.Read"],
};

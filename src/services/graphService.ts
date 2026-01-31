import { IPublicClientApplication, AccountInfo } from '@azure/msal-browser';
import { loginRequest } from '../config/authConfig';

export interface GraphGroup {
	id: string;
	displayName: string;
	description?: string;
}

export const fetchUserGroups = async (instance: IPublicClientApplication, account: AccountInfo): Promise<GraphGroup[]> => {
	try {
		const response = await instance.acquireTokenSilent({
			...loginRequest,
			account: account
		});

		const headers = new Headers();
		const bearer = `Bearer ${response.accessToken}`;
		headers.append('Authorization', bearer);

		const options = {
			method: 'GET',
			headers: headers
		};

		const graphResponse = await fetch(
			'https://graph.microsoft.com/v1.0/me/transitiveMemberOf/microsoft.graph.group?\$select=id,displayName,description',
			options
		);

		if (!graphResponse.ok) {
			throw new Error(`Graph API error: ${graphResponse.statusText}`);
		}

		const data = await graphResponse.json();
		return data.value || [];

	} catch (err) {
		console.error('Failed to fetch user groups from Graph:', err);
		throw err;
	}
};
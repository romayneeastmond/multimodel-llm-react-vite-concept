import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App';
import './index.css';
import { PublicClientApplication, EventType } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./src/config/authConfig";

const rootElement = document.getElementById('root');
if (!rootElement) {
	throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

const useMsal = process.env.USE_MSAL === 'true';

if (useMsal) {
	const msalInstance = new PublicClientApplication(msalConfig);

	msalInstance.initialize().then(() => {
		if (!msalInstance.getActiveAccount() && msalInstance.getAllAccounts().length > 0) {
			msalInstance.setActiveAccount(msalInstance.getAllAccounts()[0]);
		}

		msalInstance.addEventCallback((event) => {
			if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
				const account = (event.payload as any).account;
				msalInstance.setActiveAccount(account);
			}
		});

		root.render(
			<React.StrictMode>
				<MsalProvider instance={msalInstance}>
					<App />
				</MsalProvider>
			</React.StrictMode>
		);
	}).catch(e => {
		console.error("MSAL Initialization Failed:", e);

		root.render(
			<div>Authentication Configuration Error: {e.message}</div>
		);
	});
} else {
	root.render(
		<React.StrictMode>
			<App />
		</React.StrictMode>
	);
}

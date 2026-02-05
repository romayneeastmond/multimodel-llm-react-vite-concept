import React, { useState } from 'react';
import { A2UIBlueprint } from '../types/a2ui';
import { A2UIProvider } from './a2ui/A2UIContext';
import A2UIRenderer from './a2ui/A2UIRenderer';
import { Send, Search, Calendar } from 'lucide-react';
import { showToast } from './ToastManager';

const MOCK_BLUEPRINTS: Record<string, A2UIBlueprint> = {
	vacation: {
		"rootId": "v_form",
		"components": [
			{ "id": "v_form", "type": "Form", "props": { "title": "Vacation Request" }, "children": ["s1", "e1", "r1", "sub1"] },
			{ "id": "s1", "type": "DatePicker", "props": { "label": "Start Date", "name": "start_date" } },
			{ "id": "e1", "type": "DatePicker", "props": { "label": "End Date", "name": "end_date" } },
			{ "id": "r1", "type": "TextArea", "props": { "label": "Reason", "name": "reason" } },
			{ "id": "sub1", "type": "Button", "props": { "label": "Submit Request", "action": "submit_vacation" } }
		]
	},
	matter_search: {
		"rootId": "matter_form_root",
		"components": [
			{
				"id": "matter_form_root",
				"type": "Form",
				"props": { "title": "Advanced Matter Search" },
				"children": ["row1", "row2", "row3", "sub_btn"]
			},
			{ "id": "row1", "type": "LayoutRow", "children": ["c_name", "m_num"] },
			{ "id": "c_name", "type": "TextField", "props": { "label": "Client Name", "name": "client_name" } },
			{ "id": "m_num", "type": "TextField", "props": { "label": "Matter #", "name": "matter_number" } },
			{ "id": "row2", "type": "LayoutRow", "children": ["p_area", "m_status"] },
			{
				"id": "p_area", "type": "Select", "props": {
					"label": "Practice Area",
					"name": "practice_area",
					"options": ["Litigation", "Corporate", "IP", "Real Estate"]
				}
			},
			{
				"id": "m_status", "type": "Select", "props": {
					"label": "Status",
					"name": "status",
					"options": ["Active", "Closed", "Archived"]
				}
			},
			{ "id": "row3", "type": "DatePicker", "props": { "label": "Opened After", "name": "open_date_start" } },
			{ "id": "sub_btn", "type": "Button", "props": { "label": "Execute Search", "action": "submit_matter" } }
		]
	},
	outlook: {
		"rootId": "o_form",
		"components": [
			{ "id": "o_form", "type": "Form", "props": { "title": "New Outlook Event" }, "children": ["t1", "a1", "sub3"] },
			{ "id": "t1", "type": "TextField", "props": { "label": "Subject", "name": "subject" } },
			{ "id": "a1", "type": "MultiSelect", "props": { "label": "Attendees", "name": "attendees", "options": ["Admin", "Legal Team", "HR", "External Counsel"] } },
			{ "id": "sub3", "type": "Button", "props": { "label": "Book Meeting", "action": "submit_outlook" } }
		]
	},
	expense: {
		"rootId": "exp_form",
		"components": [
			{ "id": "exp_form", "type": "Form", "props": { "title": "Expense Report" }, "children": ["d1", "a1", "c1", "r1", "sub_exp"] },
			{ "id": "d1", "type": "DatePicker", "props": { "label": "Expense Date", "name": "expense_date" } },
			{ "id": "a1", "type": "TextField", "props": { "label": "Amount", "name": "amount" } },
			{ "id": "c1", "type": "Select", "props": { "label": "Category", "name": "category", "options": ["Travel", "Meals", "Supplies", "Other"] } },
			{ "id": "r1", "type": "TextArea", "props": { "label": "Description", "name": "description" } },
			{ "id": "sub_exp", "type": "Button", "props": { "label": "Submit Expense", "action": "submit_expense" } }
		]
	},
	service: {
		"rootId": "sd_form",
		"components": [
			{ "id": "sd_form", "type": "Form", "props": { "title": "Service Desk Ticket" }, "children": ["cat1", "pri1", "desc1", "sub_sd"] },
			{ "id": "cat1", "type": "Select", "props": { "label": "Category", "name": "category", "options": ["Hardware", "Software", "Access", "Other"] } },
			{ "id": "pri1", "type": "Select", "props": { "label": "Priority", "name": "priority", "options": ["Low", "Medium", "High"] } },
			{ "id": "desc1", "type": "TextArea", "props": { "label": "Description", "name": "description" } },
			{ "id": "sub_sd", "type": "Button", "props": { "label": "Submit Ticket", "action": "submit_service_desk" } }
		]
	}
};

const MENU_ITEMS = [
	{ id: 'vacation', label: 'Vacation Request', icon: Send, desc: 'Simple form with dates' },
	{ id: 'matter_search', label: 'Matter Search', icon: Search, desc: 'Complex layout with rows' },
	{ id: 'outlook', label: 'Outlook Event', icon: Calendar, desc: 'Multi-select example' },
	{ id: 'expense', label: 'Expense Report', icon: Calendar, desc: 'Simple form with fields' },
	{ id: 'service', label: 'Service Desk Ticket', icon: Calendar, desc: 'Simple form with selects' },
];

const A2UICatalog = ({ onClose }: { onClose: () => void }) => {
	const [activeId, setActiveId] = useState<string>('vacation');
	const [lastSubmission, setLastSubmission] = useState<{ action: string, data: any } | null>(null);

	const activeBlueprint = MOCK_BLUEPRINTS[activeId];

	const handleSubmit = (action: string, values: any) => {
		setLastSubmission({ action, data: values });
		showToast({
			title: 'Form Submitted',
			message: `Action: ${action}`
		});
	};

	return (
		<div className="flex h-screen bg-app overflow-hidden">
			<div className="w-64 border-r border-border bg-panel flex flex-col">
				<div className="flex-1 overflow-y-auto p-2 pt-4 space-y-1">
					{MENU_ITEMS.map((item) => (
						<button
							key={item.id}
							onClick={() => {
								setActiveId(item.id);
								setLastSubmission(null);
							}}
							className={`w-full text-left px-3 py-3 rounded-lg flex items-start gap-3 transition-colors ${activeId === item.id ? 'bg-accent/10 text-accent' : 'text-primary hover:bg-card-hover'
								}`}
						>
							<item.icon className={`w-5 h-5 mt-0.5 ${activeId === item.id ? 'text-accent' : 'text-secondary'}`} />
							<div>
								<div className="font-medium text-sm">{item.label}</div>
								<div className="text-xs text-secondary opacity-80">{item.desc}</div>
							</div>
						</button>
					))}
				</div>
			</div>
			<div className="flex-1 overflow-y-auto p-8 flex flex-col items-center">
				<div className="w-full max-w-2xl space-y-8">

					<div className="text-center space-y-2">
						<h1 className="text-lg font-bold text-primary">Preview: {MOCK_BLUEPRINTS[activeId].components[0].props?.title}</h1>
						<p className="text-secondary">Rendered dynamically from JSON schema</p>
					</div>

					<div>
						<A2UIProvider
							key={activeId}
							componentsList={activeBlueprint.components}
							onSubmit={handleSubmit}
						>
							<A2UIRenderer componentId={activeBlueprint.rootId} />
						</A2UIProvider>
					</div>

					{lastSubmission && (
						<div className="bg-card border border-border rounded-xl p-6 shadow-sm max-w-2xl mx-auto space-y-6">
							<h3 className="text-sm font-semibold text-accent mb-2 flex items-center gap-2">
								<Send className="w-4 h-4" />
								Last Submission Payload
							</h3>
							<pre className="text-xs text-content bg-input p-3 rounded overflow-auto font-mono">
								{JSON.stringify(lastSubmission, null, 2)}
							</pre>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default A2UICatalog;

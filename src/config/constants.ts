import { MultiModel, MCPServer, ChatSession, Persona, LibraryPrompt, Workflow, DatabaseSource } from '../types';
import { getTime } from '../utils/dateUtils';
import { calculateCsvRows } from '../utils/csvUtils';

// @ts-ignore
import csvKaggleContracts from '../data/database-kaggle-contracts.csv?raw';
// @ts-ignore
import csvOpenAiEmployees from '../data/database-openai-employees.csv?raw';

export const AVAILABLE_MODELS = [
	{ id: MultiModel.FLASH_3, name: 'Gemini 3 Flash', description: 'Fast, efficient for everyday tasks' },
	{ id: MultiModel.PRO_3, name: 'Gemini 3 Pro', description: 'High reasoning & complex coding' },
	{ id: MultiModel.FLASH_2_5_LITE, name: 'Gemini 2.5 Flash Lite', description: 'Ultra-low latency reasoning' },
	{ id: MultiModel.AZURE_GPT_35, name: 'Azure GPT-35-turbo', description: 'Azure OpenAI GPT-3.5 model' },
	{ id: MultiModel.AZURE_GPT_4, name: 'Azure GPT-4', description: 'Azure OpenAI GPT-4 model' },
	{ id: MultiModel.AZURE_GPT_4_O, name: 'Azure GPT-4o', description: 'Azure OpenAI GPT-4 Omni model' },
	{ id: MultiModel.AZURE_GPT_5_M, name: 'Azure GPT-5-mini', description: 'Azure OpenAI GPT-5 Mini model' },
	{ id: MultiModel.AZURE_DALL_E_3, name: 'Azure DALL-E-3', description: 'Azure OpenAI DALL-E 3 model' },
	{ id: MultiModel.AZURE_TEXT_EMBED_2, name: 'Azure Text Embedding', description: 'Azure OpenAI Text Embedding model' },
	{ id: MultiModel.CLAUDE_4_5_SONNET, name: 'Claude 4.5 Sonnet', description: 'Anthropic Claude 4.5 Sonnet model' },
	{ id: MultiModel.CLAUDE_4_5_OPUS, name: 'Claude 4.5 Opus', description: 'Anthropic Claude 4.5 Opus model' }
];

// @ts-ignore
export const MCP_SERVER_CONFIGS: MCPServer[] = JSON.parse(process.env.MCP_SERVER_CONFIGS || '[]');

// Example MCP Server Config
// export const MCP_SERVER_CONFIGS: MCPServer[] = [
// 	{
// 		id: 'python-mcp-example',
// 		name: 'Python MCP Example',
// 		url: 'https://YOUR_SERVER_ENDPOINT/mcp',
// 		tools: [],
// 	}
// ];

export const DEFAULT_PERSONAS: Persona[] = [
	{
		id: 'p-marketing',
		name: 'Marketing Specialist',
		description: 'Expert in brand strategy and market analysis.',
		systemInstruction: 'You are a Senior Marketing Specialist. You provide insightful, creative, and data-backed advice on brand positioning, advertising, and customer engagement.',
		multiStepInstruction: 'Tell me about your product and target audience.'
	},
	{
		id: 'p-architect',
		name: 'System Architect',
		description: 'Specialist in cloud infrastructure and software design.',
		systemInstruction: 'You are a Senior System Architect. You focus on scalability, reliability, and modern architectural patterns. Your advice is technical, precise, and practical.'
	}
];

export const DEFAULT_LIBRARY_PROMPTS: LibraryPrompt[] = [
	{
		id: 'lp-explain',
		title: 'Explain Like I\'m 5',
		content: 'Explain the following concept to me as if I were 5 years old, using simple analogies: ',
		category: 'Learning',
		isDefault: true
	},
	{
		id: 'lp-code-review',
		title: 'Code Review',
		content: 'Please review the following code for bugs, performance issues, and adherence to best practices:\n\n',
		category: 'Coding',
		isDefault: true,
		multiStepInstruction: 'Paste the code you want reviewed.'
	},
	{
		id: 'lp-summarize',
		title: 'Summarize Text',
		content: 'Summarize the text below into 3 key bullet points:\n\n',
		category: 'Writing',
		isDefault: true
	},
	{
		id: 'lp-email',
		title: 'Professional Email',
		content: 'Draft a professional email to [recipient] regarding [subject]. Keep the tone polite but direct.\n\nKey points to include:\n- ',
		category: 'Business',
		isDefault: true,
		multiStepInstruction: 'Who is the email for and what are the key points?'
	}
];

export const MOCK_WORKFLOWS: Workflow[] = [
	{
		id: 'wf-na-countries',
		name: 'North American Countries',
		description: 'A comprehensive study of North American countries, regions, and their national anthems.',
		steps: [
			{
				id: 'na-step-1',
				type: 'prompt',
				prompt: 'What are the countries in North America? List this information in table format.',
				model: MultiModel.FLASH_3,
				multiStepInstruction: 'Confirm if to exclude Central America and the Caribbean?'
			},
			{
				id: 'na-step-2',
				type: 'prompt',
				prompt: 'What is the first verse of the national anthem of each country in the table above? If the country has multiple official languages, show the first verse in all languages.',
				model: MultiModel.PRO_3
			}
		]
	},
	{
		id: 'wf-code-audit',
		name: 'Advanced Security Audit',
		description: 'A systematic workflow for analyzing source code for security vulnerabilities and performance bottlenecks.',
		steps: [
			{
				id: 'ca-step-1',
				type: 'file_upload',
				fileRequirement: 'Please upload the source code files (JS, TS, or Python) you wish to have audited.'
			},
			{
				id: 'ca-step-2',
				type: 'prompt',
				prompt: 'Analyze the provided code files for security risks such as SQL injection, XSS, and insecure dependencies. Provide a detailed report of vulnerabilities.',
				model: MultiModel.PRO_3
			},
			{
				id: 'ca-step-3',
				type: 'export',
				exportFormat: 'doc'
			}
		]
	},
	{
		id: 'wf-brand-strategy',
		name: 'Brand Launch Strategy',
		description: 'Develop a complete brand identity and 30-day social media launch plan.',
		steps: [
			{
				id: 'bs-step-1',
				type: 'persona',
				personaId: 'p-marketing'
			},
			{
				id: 'bs-step-2',
				type: 'prompt',
				prompt: 'Help me define the core brand identity and value proposition for my new product.',
				multiStepInstruction: 'What is your product name and what makes it unique?'
			},
			{
				id: 'bs-step-3',
				type: 'prompt',
				prompt: 'Based on the brand identity, create a 30-day social media content calendar for a successful launch.',
				model: MultiModel.FLASH_3
			}
		]
	}
];

export const MOCK_CHAT_HISTORY: ChatSession[] = [
	{
		id: 'chat-timeline-demo',
		title: 'Full Stack App Plan',
		timestamp: Date.now() - 1000 * 60 * 60 * 2,
		messages: [
			{
				id: getTime(2.8),
				role: 'user',
				content: 'I want to build a todo app with React and Node. Can you help me plan the stack?'
			},
			{
				id: getTime(2.7),
				role: 'assistant',
				content: '',
				responses: { [MultiModel.FLASH_3]: { model: MultiModel.FLASH_3, text: "Here is a recommended stack:\n\n* **Frontend**: React + Vite + Tailwind CSS\n* **Backend**: Node.js + Express\n* **Database**: PostgreSQL with Prisma ORM", status: 'success' } }
			},
			{
				id: getTime(2.6),
				role: 'user',
				content: 'Can you outline the database schema for users and todos?'
			},
			{
				id: getTime(2.5),
				role: 'assistant',
				content: '',
				responses: { [MultiModel.FLASH_3]: { model: MultiModel.FLASH_3, text: "```prisma\nmodel User {\n  id    Int     @id @default(autoincrement())\n  email String  @unique\n  todos Todo[]\n}\n\nmodel Todo {\n  id        Int     @id @default(autoincrement())\n  title     String\n  done      Boolean @default(false)\n  authorId  Int\n  author    User    @relation(fields: [authorId], references: [id])\n}```", status: 'success' } }
			},
			{
				id: getTime(2.4),
				role: 'user',
				content: 'Create the Express API endpoints for this.'
			},
			{
				id: getTime(2.3),
				role: 'assistant',
				content: '',
				responses: { [MultiModel.FLASH_3]: { model: MultiModel.FLASH_3, text: "I'll generate the router code for `GET /todos` and `POST /todos` using Express.", status: 'success' } }
			},
			{
				id: getTime(2.2),
				role: 'user',
				content: 'Now show me the React component for the Todo Item.'
			},
			{
				id: getTime(2.1),
				role: 'assistant',
				content: '',
				responses: { [MultiModel.FLASH_3]: { model: MultiModel.FLASH_3, text: "Here is a component that takes a `todo` prop and renders a checkbox.", status: 'success' } }
			},
			{
				id: getTime(2.0),
				role: 'user',
				content: 'Add a feature to filter by status (active/completed).'
			},
			{
				id: getTime(1.9),
				role: 'assistant',
				content: '',
				responses: { [MultiModel.FLASH_3]: { model: MultiModel.FLASH_3, text: "You can use `useState` to track the filter state and `useMemo` to derive the visible todos.", status: 'success' } }
			},
			{
				id: getTime(1.8),
				role: 'user',
				content: 'How can I style the todo list items using Tailwind CSS to look modern?'
			},
			{
				id: getTime(1.7),
				role: 'assistant',
				content: '',
				responses: { [MultiModel.FLASH_3]: { model: MultiModel.FLASH_3, text: "You can use utility classes like `flex`, `justify-between`, `p-4`, `bg-white`, `rounded-lg`, and `shadow`.\n\n```jsx\n<li className=\"flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow\">\n  {/* content */}\n</li>\n```", status: 'success' } }
			},
			{
				id: getTime(1.6),
				role: 'user',
				content: 'Finally, how do I deploy this full stack application?'
			},
			{
				id: getTime(1.5),
				role: 'assistant',
				content: '',
				responses: { [MultiModel.FLASH_3]: { model: MultiModel.FLASH_3, text: "For deployment, I recommend:\n\n1.  **Frontend (Vercel)**: Connect your GitHub repo and point to the client directory.\n2.  **Backend (Render/Railway)**: Deploy the server as a Node.js web service.\n3.  **Database (Neon/Supabase)**: Use a managed PostgreSQL instance.", status: 'success' } }
			}
		]
	},
	{
		id: 'chat-2',
		title: 'Python Script for CSV',
		timestamp: Date.now() - 1000 * 60 * 60 * 24,
		messages: [
			{
				id: getTime(24.1),
				role: 'user',
				content: 'Write a python script to parse a CSV and calculate the average of column "price".'
			},
			{
				id: getTime(24),
				role: 'assistant',
				content: '',
				responses: {
					[MultiModel.PRO_3]: {
						model: MultiModel.PRO_3,
						text: "Here is a script using pandas:\n\n```python\nimport pandas as pd\n\ndef calculate_average_price(file_path):\n    try:\n        df = pd.read_csv(file_path)\n        return df['price'].mean() if 'price' in df.columns else None\n    except Exception as e:\n        return str(e)\n```",
						status: 'success'
					}
				}
			}
		]
	},
	{
		id: 'chat-3',
		title: 'Design System Architecture',
		timestamp: Date.now() - 1000 * 60 * 60 * 129,
		messages: [
			{
				id: getTime(48.1),
				role: 'user',
				content: 'What are the key components of a modern design system?'
			},
			{
				id: getTime(48),
				role: 'assistant',
				content: '',
				responses: {
					[MultiModel.FLASH_3]: {
						model: MultiModel.FLASH_3,
						text: "A modern design system typically includes:\n\n*   **Design Tokens**: Values for colors, spacing, typography.\n*   **Component Library**: Reusable UI elements (buttons, inputs).\n*   **Pattern Library**: Combinations of components (forms, cards).\n*   **Documentation**: Usage guidelines and principles.",
						status: 'success'
					}
				}
			}
		]
	},
	{
		id: 'chat-4',
		title: 'AI Implications on Business',
		timestamp: Date.now() - 1000 * 60 * 60 * 130,
		messages: [
			{
				id: getTime(28.1),
				role: 'user',
				content: 'How would you describe your implications on business and managers?'
			},
			{
				id: getTime(29.1),
				role: 'assistant',
				content: '',
				responses: {
					[MultiModel.FLASH_3]: {
						model: MultiModel.FLASH_3,
						text: "As an AI language model, my implications on business and managers are multifaceted:\n\n1. Efficiency and Productivity: I can assist with various tasks, such as generating reports, analyzing data, drafting documents, and answering queries, which can enhance efficiency and productivity within a business environment. Managers can leverage my capabilities to streamline workflows and accomplish tasks more quickly.\n\n2. Decision Support: I can provide insights and recommendations based on available data and information, aiding managers in making informed decisions across different aspects of their business operations. This can range from strategic planning to operational optimization.\n\n3. Innovation and Creativity: My ability to generate novel ideas and creative solutions can stimulate innovation within organizations. Managers can use my suggestions to explore new opportunities, improve existing processes, or develop unique products and services.\n\n4. Customer Interaction and Engagement: Through natural language processing, I can assist with customer inquiries, feedback analysis, and even generate personalized responses. This can enhance customer satisfaction and engagement, ultimately benefiting the business.\n\n5. Risk Management and Compliance: By analyzing vast amounts of data, I can help identify potential risks and ensure regulatory compliance within an organization. Managers can rely on me to flag potential issues and recommend appropriate actions to mitigate risks and maintain compliance.\n\n6. Skill Augmentation and Training: I can serve as a tool for skill augmentation and training, providing employees with access to a vast knowledge base and assisting in learning new concepts or skills relevant to their roles.\n\n7. Cost Savings: Utilizing AI like me can lead to cost savings for businesses by automating repetitive tasks, reducing the need for manual labor, and improving overall operational efficiency.\n\nHowever, it's crucial to recognize that while AI can offer numerous benefits, it also poses challenges such as data privacy concerns, ethical considerations, and the potential for job displacement. Therefore, managers need to approach AI implementation thoughtfully, ensuring alignment with organizational goals and values while considering the broader societal implications. Additionally, maintaining human oversight and intervention is essential to leverage AI effectively while mitigating potential risks.",
						status: 'success'
					}
				}
			}
		]
	}
];

export const LANGUAGE_EXTENSIONS: Record<string, string> = {
	javascript: 'js',
	typescript: 'ts',
	python: 'py',
	html: 'html',
	css: 'css',
	json: 'json',
	sql: 'sql',
	bash: 'sh',
	shell: 'sh',
	go: 'go',
	rust: 'rs',
	java: 'java',
	c: 'c',
	cpp: 'cpp',
	text: 'txt'
};

export const MOCK_DATABASE_SOURCES: DatabaseSource[] = [
	{
		id: 'db-kaggle-contracts',
		name: 'Kaggle Contracts Database',
		type: 'csv_upload',
		content: csvKaggleContracts,
		rowCount: calculateCsvRows(csvKaggleContracts),
		fileName: 'database-kaggle-contracts.csv',
		createdAt: Date.now()
	},
	{
		id: 'db-openai-employees',
		name: 'OpenAI Employees Database',
		type: 'csv_upload',
		content: csvOpenAiEmployees,
		rowCount: calculateCsvRows(csvOpenAiEmployees),
		fileName: 'database-openai-employees.csv',
		createdAt: Date.now()
	}
];

export const SUGGESTIONS = [
	{
		text: "Provide an explanation for the concepts that make up the SOLID principle in programming. I'm curious since I'm learning to code.",
		label: "Explain SOLID Principles",
		guided: false
	},
	{
		text: "Summarize the key details of a court case; include the parties involved, the court and jurisdiction, the main issues, facts, and decision.",
		label: "Summarize Court Case",
		guided: false
	},
	{
		text: "I found this interesting website that might be useful. I would love to send my team a summary. Please help with drafting the email.",
		label: "Draft Email from URL",
		guided: true,
		instruction: "Before continuing provide the URL(s) for any site you are interested in."
	}
];
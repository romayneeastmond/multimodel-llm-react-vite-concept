# Multi-Model Orchestrator

> A next-generation AI interface that goes beyond simple chat — orchestrate multiple AI models, build workflows, analyze documents, and collaborate in real-time.
>
> **Built with AI-Assisted Development:** Complex projects like this can be built efficiently with proper planning and vibe coding. The UI was designed with **Google AI Studio**, and all features and functionality were developed using **Google Antigravity IDE** — proving that AI pair programming can deliver production-ready applications.
>
> **Fully AI-Generated Ecosystem:** Not just the main app — the supporting **Azure Python serverless functions** (document processing), **Python MCP server**, **Anthropic Claude proxy server**, and even **this README** were all created through vibe coding. All source code is available across linked repositories, demonstrating end-to-end AI-assisted development.

[![Built with React](https://img.shields.io/badge/React-19.2-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg)](https://tailwindcss.com/)

---
## Welcome Page Multi-Model Select

<img alt="Image" src="https://github.com/user-attachments/assets/01d67794-0880-4134-8293-38e743dfe231" />

### Additional Screenshots
Additional screnshots found here, [Screenshots](https://github.com/romayneeastmond/multimodel-llm-react-vite-concept/issues/1)

## 🚀 Getting Started

### **Prerequisites**
- Node.js 20.x or higher
- npm 10.x or higher
- At least one AI API key (Gemini, Azure OpenAI, or Claude)
- Azure Cosmos DB account (for conversation persistence)

### **Quick Demo (Minimal Setup)**
Want to try it out quickly? You can run with just a Gemini API key:

```bash
# 1. Clone the repository
git clone https://github.com/romayneeastmond/multimodel-llm-react-vite-concept.git
cd multimodel-llm-react-vite-concept

# 2. Install dependencies
npm install

# 3. Create minimal .env.local file
echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env.local

# 4. Start the dev server
npm run dev
```
Visit `http://localhost:3000` and start chatting with Gemini models!

> ⚠️ **Note:** Without Azure Cosmos DB configured, conversations won't persist and some features (collaboration, workflows) will be limited.

---

### **Full Setup (All Features)**

For the complete experience with all features enabled:

#### **Step 1: Install Dependencies**
```bash
npm install
```

#### **Step 2: Configure Environment Variables**

Create a `.env.local` file in the project root:

```env
# ============================================
# REQUIRED - AI Models (at least one)
# ============================================
# Google Gemini (Free tier available)
GEMINI_API_KEY=your_gemini_key

# Azure OpenAI (Paid)
AZURE_API_KEY=your_azure_key
AZURE_ENDPOINT=https://your-endpoint.openai.azure.com

# Anthropic Claude (Paid, requires proxy)
CLAUDE_ENDPOINT=your_claude_proxy

# ============================================
# REQUIRED - Database (for persistence)
# ============================================
AZURE_COSMOS_ENDPOINT=https://your-cosmos.documents.azure.com:443/
AZURE_COSMOS_KEY=your_cosmos_key
AZURE_COSMOS_DB_ID=ConversationDB

# ============================================
# OPTIONAL - Document Processing
# ============================================
WEB_SCRAPER_ENDPOINT=your_scraper_endpoint
CONTENT_COMPARISON_ENDPOINT=your_comparison_endpoint
CONTENT_EXTRACTOR_ENDPOINT=your_extractor_endpoint
CONTENT_RESULTS_ENDPOINT=your_results_endpoint
CONTENT_RESULTS_CLAUSES_ENDPOINT=your_clauses_endpoint
CONTENT_RESULTS_EXTRACTIONS_ENDPOINT=your_extractions_endpoint
CONTENT_SUMMARIZATION_ENDPOINT=your_summarization_endpoint
CONTENT_TRANSLATION_ENDPOINT=your_translation_endpoint
AZURE_CACHE_ENDPOINT=your_cache_endpoint

# ============================================
# OPTIONAL - MSAL Authentication
# ============================================
# Enable Microsoft Entra ID (Azure AD) authentication
USE_MSAL=false
AZURE_AD_CLIENT_ID=your_application_client_id
AZURE_AD_TENANT_ID=your_tenant_id
AZURE_AD_REDIRECT_URI=http://localhost:3000

# ============================================
# OPTIONAL - MCP Server Configuration
# ============================================
MCP_SERVER_CONFIGS=your_mcp_server_configs_json

# ============================================
# OPTIONAL - SERP Api Configuration
# ============================================
SERP_API_KEY=your_serp_api_key_here
```

#### **Step 2.5: (Optional) Enable MSAL Authentication**

To enable Microsoft Entra ID (formerly Azure Active Directory) authentication:

**1. Register Application in Azure Portal:**

1. Go to [Azure Portal](https://portal.azure.com) → **Microsoft Entra ID** → **App registrations**
2. Click **New registration**
3. Configure:
   - **Name**: Multi-Model Orchestrator (or your preferred name)
   - **Supported account types**: Choose based on your needs
     - *Accounts in this organizational directory only* (Single tenant)
     - *Accounts in any organizational directory* (Multi-tenant)
     - *Accounts in any organizational directory and personal Microsoft accounts*
   - **Redirect URI**: 
     - Platform: **Single-page application (SPA)**
     - URI: `http://localhost:3000` (development) or your production URL
4. Click **Register**

**2. Configure Application Settings:**

After registration, navigate to your app's page:

1. **Overview** → Copy the **Application (client) ID**
2. **Overview** → Copy the **Directory (tenant) ID**
3. **Authentication**:
   - Under **Single-page application**, ensure your redirect URI is listed
   - Add additional redirect URIs for production (e.g., `https://yourdomain.com`)
   - Under **Implicit grant and hybrid flows**: Leave unchecked (not needed for SPA)
   - Under **Advanced settings** → **Allow public client flows**: No
4. **API permissions** (optional):
   - The default `User.Read` permission is sufficient for basic authentication
   - Add additional permissions if needed for your use case

**3. Update Environment Variables:**

Add these to your `.env.local` file:

```env
USE_MSAL=true
AZURE_AD_CLIENT_ID=your_application_client_id_from_step_2
AZURE_AD_TENANT_ID=your_tenant_id_from_step_2
AZURE_AD_REDIRECT_URI=http://localhost:3000
```

**4. Update Vite Configuration:**

The application is already configured to expose MSAL environment variables. No changes needed to `vite.config.ts` unless you want to customize.

**5. Restart Development Server:**

```bash
npm run dev
```

**What Changes with MSAL Enabled:**

✅ **User Authentication**: Users must sign in with Microsoft credentials  
✅ **Data Isolation**: Each user's conversations, workflows, and settings are scoped to their account  
✅ **Logout Button**: "Log Out" button appears in the sidebar footer  
✅ **No Default User**: The `default_user` account is automatically disabled  
✅ **Persistent Sessions**: User identity persists across browser refreshes
✅ **Workflow Access Control**: System workflows can be restricted to specific Entra AD Security Groups (Admin only)

**Important Notes:**

- When `USE_MSAL=true`, unauthenticated users will see a sign-in screen
- User data is partitioned by their Microsoft account name in Cosmos DB
- For production, update `AZURE_AD_REDIRECT_URI` to match your domain
- Multi-tenant apps require admin consent for certain permissions


#### **Step 3: Set Up Azure Cosmos DB**

**Option A: Use Terraform (Recommended)**
```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your Azure credentials
terraform init
terraform apply
```

**Option B: Manual Setup**
1. Create an Azure Cosmos DB account
2. Create a database named `ConversationDB`
3. Create these containers:
   - `Chats` (partition key: `/userId`)
   - `Workflows` (partition key: `/userId`)
   - `Personas` (partition key: `/userId`)
   - `PromptLibrary` (partition key: `/userId`)
   - `DatabaseSources` (partition key: `/userId`)
   - `SharedGroups` (partition key: `/groupId`)

See [terraform/README.md](terraform/README.md) for detailed instructions.

#### **Step 3.5: Configure Models and MCP Servers** (Optional but Recommended)

Before running the application, you may want to customize the available AI models and MCP server configurations.

**Edit `src/config/constants.ts`:**

**1. Customize Available Models**

The `AVAILABLE_MODELS` array defines which models appear in the UI. Each model references a `MultiModel` enum value defined in `src/types/index.ts`.

```typescript
export const AVAILABLE_MODELS = [
  { 
    id: MultiModel.FLASH_3, 
    name: 'Gemini 3 Flash', 
    description: 'Fast, efficient for everyday tasks' 
  },
  { 
    id: MultiModel.PRO_3, 
    name: 'Gemini 3 Pro', 
    description: 'High reasoning & complex coding' 
  },
  { 
    id: MultiModel.AZURE_GPT_4_O, 
    name: 'Azure GPT-4o', 
    description: 'Azure OpenAI GPT-4 Omni model' 
  },
  // Add or remove models as needed
];
```

**Model ID Format:**  
Model IDs in the `MultiModel` enum must follow provider-specific naming:
- **Gemini models**: Use `gemini-` prefix (e.g., `gemini-3-flash-preview`)
- **Azure models**: Use `azure-` prefix (e.g., `azure-gpt-4o`)
- **Claude models**: Use `claude-` prefix (e.g., `claude-sonnet-4-5-20250929`)

**To add a new model:**

1. Add the enum value in `src/types/index.ts`:
   ```typescript
   export enum MultiModel {
     // ... existing models
     AZURE_GPT_O1 = 'azure-gpt-o1',
   }
   ```

2. Add the model to `AVAILABLE_MODELS` in `src/config/constants.ts`:
   ```typescript
   { 
     id: MultiModel.AZURE_GPT_O1, 
     name: 'Azure GPT-O1', 
     description: 'New reasoning model' 
   },
   ```

**2. Configure MCP Servers**

MCP (Model Context Protocol) servers extend the application with custom tools and functionality.

```typescript
// Default: Load from environment variable
export const MCP_SERVER_CONFIGS: MCPServer[] = 
  JSON.parse(process.env.MCP_SERVER_CONFIGS || '[]');

// Example: Hardcode MCP servers (for development)
export const MCP_SERVER_CONFIGS: MCPServer[] = [
  {
    id: 'python-mcp-example',
    name: 'Python MCP Example',
    url: 'https://your-server.azurewebsites.net/mcp',
    tools: [], // Tools are auto-discovered at runtime
  },
  {
    id: 'weather-mcp',
    name: 'Weather Data Server',
    url: 'https://your-weather-mcp.com/api',
    tools: [],
  }
];
```

**MCP Server Configuration Options:**

- **Via Environment Variable** (Recommended for production):
  ```env
  MCP_SERVER_CONFIGS=[{"id":"mcp-1","name":"My Server","url":"https://...","tools":[]}]
  ```

- **Via Constants File** (Easier for development):
  Uncomment and modify the example in `constants.ts`

**Important Notes:**

✅ **Model Display Names**: The `name` field in `AVAILABLE_MODELS` is user-facing  
✅ **Model IDs**: Must match actual API model names used in backend calls  
✅ **MCP Tools**: The `tools` array is usually empty initially; tools are discovered dynamically when the app connects to the MCP server  
✅ **Provider Prefixes**: Required for the app to route requests to the correct AI provider

#### **Step 4: (Optional) Deploy Supporting Services**

**Document Processing Functions:**
Deploy Azure Python serverless functions from:  
[azure-python-serverless-functions](https://github.com/romayneeastmond/azure-python-serverless-functions)

**Claude Proxy Server:**
Deploy the Anthropic Claude proxy from:  
[anthropic-express-proxy-server](https://github.com/romayneeastmond/anthropic-express-proxy-server)

**MCP Server:**
Deploy the Python MCP server from:  
[azure-python-mcp-hello-world](https://github.com/romayneeastmond/azure-python-mcp-hello-world)

#### **Step 5: Run the Application**

```bash
npm run dev
```

Visit `http://localhost:3000` and enjoy all features! 🎉

---

### **What Works With Minimal Setup?**

| Feature | Gemini Only | + Azure Cosmos | + Azure OpenAI | + All Services |
|---------|-------------|----------------|----------------|----------------|
| Chat with AI | ✅ | ✅ | ✅ | ✅ |
| Multi-model comparison | ❌ | ❌ | ✅ | ✅ |
| Conversation persistence | ❌ | ✅ | ✅ | ✅ |
| Workflows | ❌ | ✅ | ✅ | ✅ |
| Collaboration | ❌ | ✅ | ✅ | ✅ |
| Document Briefcase | ❌ | ❌ | ❌ | ✅ |
| Database search | ❌ | ✅ | ✅ | ✅ |
| Canvas Editor | ✅ | ✅ | ✅ | ✅ |

---

## ✨ Features Overview 
For upcoming and future plans, check [FUTURE-PLANS.md](FUTURE-PLANS.md)

### 🎯 **Core Capabilities**

#### **1. Multi-Model Orchestration** ⚡
Compare responses from multiple AI models simultaneously in a single conversation.

**Supported Models:**
- **Google Gemini**: Flash 3, Pro 3, Flash 2.5 Lite
- **Azure OpenAI**: GPT-3.5 Turbo, GPT-4, GPT-4o, GPT-5 Mini, DALL-E 3, Text Embedding
- **Anthropic Claude**: Claude 4.5 Sonnet, Claude 4.5 Opus

**Unique Features:**
- ✅ Side-by-side model comparison
- ✅ Full Compare View for detailed analysis
- ✅ Response versioning (retry, expand, concise)
- ✅ Per-model conversation branching

---

#### **2. Workflow Builder** 🔄
Create multi-step AI workflows without code.

**Step Types:**
- **Prompt**: Ask AI a question
- **File Upload**: Require documents at specific steps
- **Export**: Generate reports (Text, Word, PDF, Excel, PowerPoint)
- **Persona Switch**: Change AI personality mid-workflow
- **Database Search**: Query CSV or Azure AI Search
- **Vector Search**: Semantic search with embeddings
- **Web Scraper**: Extract content from URLs
- **SerpApi**: Execute Google searches and extract results

**Example Workflow:**
```
1. Upload contract document
2. Analyze for legal risks (GPT-4)
3. Summarize key clauses (Claude)
4. Export to PDF
```

**Innovative Features:**
- ✅ **Guided Prompts**: Interactive step-by-step execution
- ✅ **Branching**: Start new conversations from any workflow step
- ✅ **Templates**: Pre-built workflows (Code Audit, Brand Strategy, etc.)
- ✅ **Multi-Step Instructions**: Dynamic user inputs between steps

---

#### **3. Document Briefcase** 📁
Enterprise-grade document analysis suite.

**Tools:**
1. **Summarization**: Condense documents to key points
2. **Extraction**: Pull specific data with custom queries or preset extractors:
   - **Default Vectorized Search**: General semantic search
   - **Natural Language Search**: Topic-based extraction
   - **PII (Personally Identifiable Information)**: Names, phone numbers, emails, addresses
   - **Date Ranges & Timelines**: Time-based events and deadlines
   - **Monetary Values**: Financial figures and currency amounts
3. **Clause Analysis**: Identify legal/contractual clauses
4. **Comparison**: Diff multiple documents
5. **Translation**: Multi-language support
6. **Database Search**: Query uploaded CSV or connected databases

**Unique Capabilities:**
- ✅ Handles large documents (10,000+ words) with smart caching
- ✅ Batch processing of multiple files
- ✅ Results exported to conversation or separate analysis
- ✅ Integration with Azure AI Search for vector search

---

#### **4. Real-Time Collaboration** 👥
Work together on AI conversations.

**Features:**
- **Shared Groups**: Create collaborative workspaces
- **Shared Sessions**: Read-only conversation sharing
- **User Identification**: Display names for each participant
- **Live Updates**: Real-time message synchronization
- **Invite Links**: One-click group joining

**Innovative:**
- ✅ Polling-based sync (no WebSockets required)
- ✅ Partition by group for data isolation
- ✅ Works with Azure Cosmos DB for global scale

---

#### **5. Canvas Editor** 🎨
WYSIWYG editor for crafting polished content with AI assistance.

**Features:**
- Rich text editing (bold, italic, lists, headings)
- AI-powered text generation
- Multiple canvas blocks
- Export to Word documents

**Unique "Red-Lining" Feature:**
- ✅ Select text and trigger AI rewrite
- ✅ Original text marked in red (struck through)
- ✅ AI suggestions in blue
- ✅ Accept/reject changes inline

---

#### **6. Persona System** 🎭
Customize AI personality and expertise.

**Pre-built Personas:**
- Marketing Specialist
- System Architect

**Custom Personas:**
- Define system instructions
- Set multi-step conversation patterns
- Reusable across sessions

**Innovative:**
- ✅ **Quick Persona Switch**: Change mid-conversation
- ✅ **Workflow Integration**: Auto-switch personas in workflows
- ✅ **Persistent**: Saved to database

---

#### **7. Prompt Library** 📚
Save and reuse common prompts.

**Categories:**
- Learning
- Coding
- Writing
- Business

**Features:**
- ✅ Multi-step prompts with guided inputs
- ✅ Favorites system
- ✅ Searchable and filterable
- ✅ Cloud-synced

---

#### **8. Database Integration** 🗄️
Connect to structured data sources.

**Source Types:**
1. **CSV Upload**: Drag-and-drop spreadsheets
2. **Manual Entry**: Define custom schemas
3. **Azure AI Search**: Vector search with embeddings

**Query Types:**
- Phrase search
- Semantic (vector) search
- SQL-style queries (via AI interpretation)

**Innovative:**
- ✅ Auto-preview with row counts
- ✅ Inline search in Document Briefcase
- ✅ Embedding generation with Azure models

---

#### **9. MCP Server Integration & A2UI Forms** 🔌
Connect to Model Context Protocol servers for extended functionality and interactive UI.

**Pre-configured Servers:**
- Hello World (Example)

**MCP Capabilities:**
- ✅ Dynamic tool discovery
- ✅ Tool execution in conversation
- ✅ JSON-RPC 2.0 support
- ✅ SSE (Server-Sent Events) streaming
- ✅ Multiple sequential tool calls from a single prompt

**A2UI (Adaptive AI User Interface):**
- ✅ **Interactive Forms**: MCP tools can return UI blueprints (JSON) that render as native React components
- ✅ **Seamless Submission**: Form data is submitted back to the LLM as a tool call request
- ✅ **Full Cycle**:
  1. User requests actions (e.g. "Book vacation")
  2. MCP tool returns A2UI blueprint
  3. App renders interactive form (DatePickers, Selects, etc.)
  4. User submits form → App sends tool call request to LLM
  5. LLM executes tool and returns final result
- ✅ **Read-only Support**: Forms are automatically disabled in shared/readonly views

## 🐍 Azure Python MCP Server

The Hello World example to test the Azure MCP Server can be deployed to your instance own from: [azure-python-mcp-hello-world](https://github.com/romayneeastmond/azure-python-mcp-hello-world)

---

#### **10. Progressive Web App (PWA)** 📱
Run the application as a standalone mobile app on iOS and Android devices.

**Features:**
- ✅ **Install to Home Screen**: Add app icon to device home screen
- ✅ **Standalone Mode**: Runs in full-screen without browser UI
- ✅ **Offline Support**: Service worker caching for offline access
- ✅ **Auto-Updates**: Automatic updates when new versions are deployed
- ✅ **Native Feel**: Behaves like a native mobile app
- ✅ **Cross-Platform**: Works on iOS, Android, and Desktop

**Caching Strategy:**
- Static assets (HTML, CSS, JS) precached for instant loading
- Google Fonts cached for 365 days
- External modules cached for 30 days
- Configurable cache size limit (default 5MB per file)

For detailed setup instructions, see [PWA-SETUP.md](PWA-SETUP.md)

---

#### **11. Conversation Management** 💬

**Sidebar Features:**
- **Folders**: Organize conversations
- **Search**: Find past chats
- **Sorting**: By date (Today, Yesterday, Last Week, etc.)
- **Outline View**: Jump to specific messages in long threads

**Session Features:**
- ✅ Automatic title generation
- ✅ Session export (JSON)
- ✅ Branching from any message
- ✅ Version history for responses

---

#### **12. Data Visualization** 📊
Integrated React Charts for data visualization directly within chat responses.

**Features:**
- ✅ **Automatic Rendering**: Models can generate charts based on data
- ✅ **Interactive**: Tooltips and hover effects
- ✅ **Customizable**: Models can specify chart types (Bar, Line, Pie, etc.)

---

## 🎨 UI/UX Innovations

### **Smart Features:**

1. **Idle Animation**: Textarea glows after 30 seconds of inactivity
2. **Responsive Design**: Desktop, tablet, and mobile optimized
3. **Dark/Light Mode**: Automatic system preference detection
4. **Keyboard Shortcuts**: Power user optimizations
5. **Scroll-to-Bottom**: Smart scroll detection
6. **Loading States**: AI-themed animations

### **Accessibility:**
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader support

---

## 🏗️ Technical Architecture

### **Frontend:**
- **React 19.2** with TypeScript
- **Vite 6.2** for blazing-fast builds
- **Lucide React** for icons
- **React Markdown** with syntax highlighting

### **State Management:**
- Custom React hooks
- Local storage for persistence
- Azure Cosmos DB for cloud sync

### **Backend Integration:**
- **Google Gemini API** (native SDK)
- **Azure OpenAI** (REST API)
- **Anthropic Claude** (proxy endpoint)
- **Azure Cosmos DB** (NoSQL database)
- **Azure AI Search** (vector search)

### **Testing:**
- **Playwright** for E2E testing
- Test coverage for chat, workflows, collaboration, and briefcase

---

## 🛠️ Supporting Services

This application integrates with several optional Azure services to extend functionality.

### **Azure Python Serverless Functions** 🐍
Powers the Document Briefcase features (summarization, extraction, comparison, etc.).

**Deploy your own instance:**  
[azure-python-serverless-functions](https://github.com/romayneeastmond/azure-python-serverless-functions)

**Endpoints provided:**
- Web Scraper
- Content Comparison
- Content Extractor
- Content Summarization
- Content Translation
- Clause Analysis

### **Anthropic Claude Proxy Server** 🔌
Required to use Claude models (bypasses CORS restrictions).

**Deploy your own instance:**  
[anthropic-express-proxy-server](https://github.com/romayneeastmond/anthropic-express-proxy-server)

### **Azure Python MCP Server** 🐍
Model Context Protocol server for extended tool functionality.

**Deploy your own instance:**  
[azure-python-mcp-hello-world](https://github.com/romayneeastmond/azure-python-mcp-hello-world)

> 💡 **Tip:** All environment variables and setup instructions are in the [Getting Started](#-getting-started) section above.

---

## 📦 Project Structure

```
multi-model-orchestrator/
├── src/
│   ├── App.tsx                     # Main application
│   ├── config/
│   │   └── constants.ts            # App configuration
│   ├── types/
│   │   └── index.ts                # TypeScript interfaces
│   ├── components/                 # React components
│   │   ├── Admin.tsx
│   │   ├── BriefcasePanel.tsx
│   │   ├── CanvasEditor.tsx
│   │   ├── WorkflowBuilderModal.tsx
│   │   └── ... (15+ components)
│   ├── hooks/                      # Custom React hooks
│   │   ├── useBriefcase.ts
│   │   ├── useWorkflowBuilder.ts
│   │   ├── useCanvas.ts
│   │   └── ...
│   ├── services/                   # API services
│   │   ├── multiModelService.ts
│   │   ├── cosmosService.ts
│   │   └── conversationalModelService.ts
│   ├── utils/                      # Utilities
│   └── data/                       # Sample data
├── e2e/                            # Playwright tests
├── terraform/                      # Infrastructure as Code
│   ├── main.tf                     # Cosmos DB resources
│   ├── terraform.tfvars.example    # Configuration example
│   └── README.md                   # Deployment guide
├── index.tsx                       # Entry point
└── vite.config.ts                  # Vite configuration
```

---

## 🧪 Testing

### **Run E2E Tests:**

```bash
# Interactive UI (recommended)
npm run test:e2e:ui

# Headless mode
npm run test:e2e

# Debug mode
npm run test:e2e:debug
```

**Test Coverage:**
- ✅ Chat functionality
- ✅ Multi-model selection
- ✅ File uploads
- ✅ Workflow execution
- ✅ Collaboration features
- ✅ Document briefcase tools

---

## 🚀 Deployment

### **Build for Production:**

```bash
npm run build
```

Output: `dist/` folder ready for static hosting

### **Recommended Platforms:**
- **Vercel**: Zero-config deployment
- **Netlify**: Continuous deployment from Git
- **Azure Static Web Apps**: Native Azure integration

---

## 🆚 What Makes This Different?

### **vs. ChatGPT:**
- ✅ **Multi-model comparison** in real-time
- ✅ **Workflow automation** without code
- ✅ **Enterprise document analysis** suite
- ✅ **Real-time collaboration**
- ✅ **Self-hosted** option

### **vs. Claude Projects:**
- ✅ **Multiple AI providers** in one interface
- ✅ **Structured workflows** vs. single prompts
- ✅ **Database integration**
- ✅ **Canvas editor** with red-lining

### **vs. Google AI Studio:**
- ✅ **Collaboration features**
- ✅ **Workflow builder**
- ✅ **Document briefcase**
- ✅ **Conversation branching**

---

## 🎯 Use Cases

### **Business:**
- Contract analysis and summarization
- Multi-document comparison
- Brand strategy development
- Legal clause extraction

### **Development:**
- Code review with multiple models
- Architecture design validation
- Documentation generation
- Security audits

### **Research:**
- Literature review workflows
- Data extraction from papers
- Multi-model consensus checking
- Translation and summarization

### **Education:**
- Interactive learning workflows
- Assignment analysis
- Multi-perspective explanations
- Study guide generation

---

## 💰 Cost Analysis

Real-world costs from development and testing of this application.

### **Cost Summary**

| Category | Component | Cost |Description |
|----------|-----------|------|------------|
| **Development (One-Time)**  | | |
| | Microsoft Foundry Models | $0.38 | Used for testing of creating conversations and workflows. |
| | Anthropic Claude API | $0.05 | Same as above, bought the $5 minimum credits but only ever used $0.05. |
| | Google Gemini API | $0.00 (free) | Very generous API, free credits hardly ever hit limits. |
| | Google Antigravity IDE Pro | $30.00 (optional) | Used for development of the application, could realistically just wait out the 5 hour reset. |
| | **Total Development** | **$30.43** |
| | | |
| **Infrastructure (Monthly)** | | |
| | **With Free Tier** | |
| | Azure Cosmos DB | $0.00 |
| | Azure Functions | $0.00 | Python Serverless functions were built 3 years ago and updated to use chunking and other foundry calls.
| | Azure Static Web Apps | $0.00 |
| | **Total Free Tier** | **$0/month** |
| | | |
| | **Production (No Free Tier)** | |
| | Azure Cosmos DB | $24-48 |
| | Azure Functions | $0-5 |
| | Azure Static Web Apps | $0-9 |
| | AI API Usage | Variable |
| | **Total Production** | **$25-70/month** |

### **Development Costs**

**AI Model Usage During Testing:**
- **Microsoft Foundry Models**: $0.38 (GPT-5, GPT-4, GPT-3.5, DALL-E, embeddings)
- **Anthropic Claude**: $0.05 (Claude 4.5 Sonnet/Opus)
- **Google Gemini**: $0.00 (free within API limits)

**Total AI API Costs**: ~$0.43 for full development and testing

**Development Environment:**
- **Google Antigravity IDE**: Free for first month
  - Eventually upgraded to Pro ($30) to bypass 5-hour session refresh limit
  - *Entire application coded within the free month*
  
**Total Development Cost**: $30 (optional upgrade, not required)

### **Infrastructure Costs**

**Current Hosting:**
- **Azure Resources**: $0.00/month (using free monthly Azure credits)
  - Cosmos DB (free tier: 1000 RU/s, 25 GB)
  - Python serverless functions (free tier: 1M executions)
  - Static web app hosting (free tier)

**Estimated Production Costs** (without free tier):
- **Azure Cosmos DB**: ~$24-48/month (4000 RU/s autoscale)
- **Azure Functions**: ~$0-5/month (consumption plan)
- **Azure Static Web Apps**: ~$0-9/month
- **AI API Usage**: Variable based on usage
  - Gemini: Free tier covers most use cases
  - Azure OpenAI: ~$0.002-0.03 per request (model dependent)
  - Claude: ~$0.003-0.015 per request

**Total Estimated Production**: $25-70/month (excluding API usage)

### **Known Limitations (Laziness)**

⚠️ **Large Document Processing**: Documents with 500+ pages may trigger HTTP 429 errors due to hitting rate limits of the models in Microsoft Foundry. There is a chunking algorithm in place, but throttling is not currently implemented. Very easy to fix, but sometimes it's even easier to be lazy.

### **Bottom Line**

**To Build This App**: $0.43 in API costs + $30 optional IDE upgrade  
**To Run in Production**: $0-70/month depending on scale and free tier eligibility  
**Developer Time**: ~20-30 hours (with AI assistance)

*All costs based on January 2026 pricing. Your actual costs may vary based on usage patterns and region.*

---

## 🌱 Future Plans

See [FUTURE-PLANS.md](FUTURE-PLANS.md) for upcoming features and roadmap.

---

## 📝 License

**Non-Commercial Source Available License v1.0**

- ✅ Free for personal, educational, and non-commercial use
- ✅ Fork and modify allowed
- ❌ Commercial use requires a separate license

For commercial licensing inquiries, contact: [Your Email Here]

See [LICENSE](LICENSE) file for full details.

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Submit a pull request

---

## 📧 Support

For issues or questions, please open an issue on GitHub.

---

**Built with ❤️ and vibes by [Romayne Eastmond](https://github.com/romayneeastmond) who believes AI should be flexible, collaborative, and powerful.**

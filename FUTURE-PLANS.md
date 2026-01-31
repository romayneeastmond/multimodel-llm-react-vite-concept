# Future Plans & Roadmap

This document outlines planned features, improvements, and ideas for the Multi-Model Orchestrator project.

---

## Upcoming Tasks

| Name | Description |
| --- | --- |
| ✅ Multiple MCP Tools Per Prompt | Call multiple tools from different MCP servers per a single prompt. |
| ☐ PDF Document Range Selection | These documents are parsed on a per page basis and page ranges should be selectable 💡. |
| ☐ Infinite Context Window | Smaller models require context management and a sliding context window is helpful ⭐. |
| ✅ PDF and PowerPoint Export | Finish the actual PDF export and create a PowerPoint export. |
| ☐ Additional Database Sources | Manual, CSV, Azure AI Search are currently supported, needs more sources. |
| ✅ Search Document Briefcase | Unlimited number of documents per conversation needs a way to filter by document name. |
| ☐ Resource File Support | Remove all hard coded output and move to resource files for i18n. |
| ✅ MSAL Support | Currently only a single user application (except with group conversations), needs SSO support. |
| ✅ Microsft Entra Integration | Add permission sets to limit workflows to particular groups. | 
| ☐ Annotation Inside Group Conversations | Allow comments to be added to group conversations, i.e. forum style. |
| ✅ PWA Creation | Add manifest and service worker for Progressive Web App support. |
| ☐ Delete Replies and Prompts | Although branching exists, user might want to delete parts of a converation |
| ☐ Merge Multi-Model Responses | Although the Canvas view exists, it might also be useful to merge within the conversation. |
| ✅ Microsoft Teams Integration | Allow for integration with Microsoft Teams to allow for sharing of conversations 💬. |

💡 PDF documents are parsed on a per page basis and page ranges should be selectable. This will allow for more efficient document processing and analysis. A feature that I added to a previous project [azure-openai-angular](https://github.com/romayneeastmond/azure-openai-angular). During my MBA program I could upload entire textbooks (aproximately 500+ pages) and select ranges, i.e. page 80 to 100, to vectorize and use cosine similarity to find the most similar pages. This made outlining essays and citations very efficient. 

⭐ Infinite context window is a feature that I added to a previous project [azure-openai-angular](https://github.com/romayneeastmond/azure-openai-angular). Years ago, with only access to GTP 35-Turbo 16k, I found that it was helpful to have a sliding context window. Essentially every n messages, remove x number of system messages, and every n1 messages, remove x1 number of user messages. This allowed for a sliding context window that was helpful for long conversations. Worked well with interrogating large documents, i.e. textbooks, and outlining essays.

💬 Microsoft Teams Integration is a feature that I added to to this project [multimodel-llm-react-vite-team](https://github.com/romayneeastmond/multimodel-llm-react-vite-teams). However, I do not believe that it brings any actual value to Teams. Tab applications are not persistent and the context is lost when the user navigates away from the tab. Therefore this is strictly for vanity reasons more than anything else.

## Continual UI Improvements

Generally add innovative features to the user interface and experience as other providers make their own improvements.

---

**Built with ❤️ and vibes by [Romayne Eastmond](https://github.com/romayneeastmond) who believes AI should be flexible, collaborative, and powerful.**

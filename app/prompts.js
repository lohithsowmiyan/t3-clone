import { ChatPromptTemplate, MessagesPlaceholder, SystemMessagePromptTemplate, HumanMessagePromptTemplate } from "@langchain/core/prompts";

// System message instructing assistant to use Markdown
const systemMessageChat = SystemMessagePromptTemplate.fromTemplate(`
You are a helpful AI assistant named T3 Chat.
Please format all responses using Markdown:
- Use **bold**, *italics*, bullet points, and headings
- Wrap code with triple backticks, e.g. \`\`\`js
- Do not use HTML unless explicitly asked
- Use Lines to separate sections

When analyzing files:
- For images: Describe what you see, identify objects, text, scenes, etc.
- For PDFs: Extract and analyze the text content, structure, and key information
- Always provide detailed insights about the uploaded content
`);
const systemMessageTitle = SystemMessagePromptTemplate.fromTemplate(`
    You are a helpful AI Assitant. Summarize this user prompt in no more than 15 characters:
    `)

// Main prompt template
export const chatPrompt = ChatPromptTemplate.fromMessages([
  systemMessageChat,
  new MessagesPlaceholder("history"), // Past messages
  HumanMessagePromptTemplate.fromTemplate("{input}") // Latest user message
]);

export const titlePrompt = ChatPromptTemplate.fromMessages([
 systemMessageTitle,
 HumanMessagePromptTemplate.fromTemplate("{input}")
])






import { chatPrompt, titlePrompt } from "./prompts"
export const MODEL_OPTIONS = [
  { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash", provider: "google" },
  { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro", provider: "google" },
  { id: "gpt-4o", label: "GPT-4o", provider: "openai" },
  { id: "claude-3-opus", label: "Claude 3 Opus", provider: "anthropic" }
];


import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";

import { HumanMessage, AIMessage } from "@langchain/core/messages";

// /**
//  * Converts custom chat history to Langchain messages.
//  * @param history Array of { isUser: boolean, message: string }
//  * @returns Langchain-compatible message array
//  */
export function convertToLangchainMessages(history) {
  return history.map((msg) =>
    msg.isUser
      ? new HumanMessage(msg.message)
      : new AIMessage(msg.message)
  );
}


// export async function fetchModelResponse({ modelId, provider, prompt, messages, api, additional_context}) {
//   let text = "Error: Unsupported model";
// //   console.log(messages)
//   let new_history = convertToLangchainMessages(messages)

  
//   try {
//     let llm;

//     if (provider === "google") {
//       llm = new ChatGoogleGenerativeAI({
//         apiKey: api,
//         temperature: 0.7,
//         model: modelId,
//       });
//     } else if (provider === "openai") {
//       llm = new ChatOpenAI({
//         model: modelId,
//         temperature: 0.7,
//         openAIApiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || api,
//       });
//     } else if (provider === "anthropic") {
//       llm = new ChatAnthropic({
//         model: modelId,
//         temperature: 0.7,
//         apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || api,
//       });
//     }



//     if (!llm) throw new Error("Invalid provider");

//     const formattedMessages = await chatPrompt.formatMessages({
//     history: new_history,
//     input: prompt
//     });

//     console.log(formattedMessages)
//     const res = await llm.call(formattedMessages);
//     text = res.content;

//   } catch (err) {
//     console.error("Model fetch error:", err);
//     text = "Error generating response.";
//   }

//   return text;
// }


export async function getTitleFromBot({ modelId, provider, prompt}){
    let text = "New Chat";
    try {
    let llm;
    console.log({modelId,provider,prompt})
    if (provider === "google") {
      llm = new ChatGoogleGenerativeAI({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
        temperature: 0.7,
        model: modelId,
      });
    } else if (provider === "openai") {
      llm = new ChatOpenAI({
        model: modelId,
        temperature: 0.7,
        openAIApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      });
    } else if (provider === "anthropic") {
      llm = new ChatAnthropic({
        model: modelId,
        temperature: 0.7,
        apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
      });
    }



    if (!llm) throw new Error("Invalid provider");

    const formattedMessages = await titlePrompt.formatMessages({
    input: prompt
    });

    console.log(formattedMessages)
    const res = await llm.call(formattedMessages);
    text = res.content;
    console.log(text)

  } catch (err) {
    console.error("Model fetch error:", err);
    text = "Error generating response.";
  }

  return text;
}

function createMessageWithFile(prompt, fileContext) {
  if (!fileContext || !fileContext.type || !fileContext.data) {
    return { type: "text", text: prompt };
  }

  const { type: fileType, data: fileData } = fileContext;

  if (fileType.startsWith('image/')) {
    // For images, create multimodal message
    return {
      type: "text",
      text: prompt,
      images: [fileData] // Base64 data URL
    };
  } else if (fileType === 'application/pdf') {
    // For PDFs, we need to extract text first (you'll need a PDF parser)
    // For now, we'll include the base64 data and let the model handle it
    return {
      type: "text",
      text: `${prompt}\n\n[PDF file uploaded - base64 data: ${fileData}]`
    };
  }

  return { type: "text", text: prompt };
}

/**
 * Creates HumanMessage with file support
 * @param {string} prompt - User's text prompt  
 * @param {Object} fileContext - File context with type and data
 * @returns {HumanMessage} LangChain HumanMessage
 */
function createHumanMessageWithFile(prompt, fileContext) {
  console.log(fileContext)
  if (!fileContext.fileType){
    return new HumanMessage(prompt);
  }
  if (fileContext.fileType.startsWith('image/')) {
    // Create multimodal message for images
    console.log('yes it is there')
    return new HumanMessage({
      content: [
        {
          type: "text",
          text: prompt
        },
        {
          type: "image_url",
          image_url: {
            url: fileContext.data // Base64 data URL
          }
        }
      ]
    });
  } else if (fileContext.fileType.startsWith('application/pdf')) {
    // For PDFs, include in text (you might want to extract text first)
    return new HumanMessage(`${prompt}\n\n[PDF Document Uploaded - Please analyze the content]`);
  }

  return new HumanMessage(prompt);
}

export async function fetchModelResponse({ 
  modelId, 
  provider, 
  prompt, 
  messages, 
  api, 
  fileContext 
}) {
  
  let text = "Error: Unsupported model";
  let new_history = convertToLangchainMessages(messages);

  try {
    let llm;
    
    if (provider === "google") {
      llm = new ChatGoogleGenerativeAI({
        apiKey: api,
        temperature: 0.7,
        model: modelId,
      });
    } else if (provider === "openai") {
      llm = new ChatOpenAI({
        model: modelId,
        temperature: 0.7,
        openAIApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || api,
      });
    } else if (provider === "anthropic") {
      llm = new ChatAnthropic({
        model: modelId,
        temperature: 0.7,
        apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || api,
      });
    }

    if (!llm) throw new Error("Invalid provider");

    // Create the user message with file support
    const userMessage = createHumanMessageWithFile(prompt, fileContext);
    
    // Add file context to prompt if available
    let enhancedPrompt = prompt;
    if (fileContext && fileContext.type) {
      if (fileContext.type.startsWith('image/')) {
        enhancedPrompt = `${prompt}\n\n[Image uploaded - Please analyze the image and respond accordingly]`;
      } else if (fileContext.type === 'application/pdf') {
        enhancedPrompt = `${prompt}\n\n[PDF document uploaded - Please analyze the document content]`;
      }
    }

    const formattedMessages = await chatPrompt.formatMessages({
      history: new_history,
      input: enhancedPrompt
    });

    // Replace the last message with our multimodal message if we have a file
    if (fileContext) {
        console.log('yes')
      formattedMessages[formattedMessages.length - 1] = userMessage;
    }

    console.log('Formatted messages:', formattedMessages);

    const res = await llm.invoke(formattedMessages);
    text = res.content;
    
  } catch (err) {
    console.error("Model fetch error:", err);
    text = "Error generating response: " + err.message;
  }

  return text;
}

// Helper function to extract text from PDF (you'll need to implement this)
// You might want to use libraries like pdf-parse or pdf2pic
export async function extractTextFromPDF(base64Data) {
  // This is a placeholder - implement PDF text extraction
  // You could use pdf-parse, PDF.js, or send to a service
  try {
    // Remove the data URL prefix to get just the base64 data
    const base64Content = base64Data.replace(/^data:application\/pdf;base64,/, '');
    
    // You would implement actual PDF parsing here
    // For now, return a placeholder
    return "[PDF content extraction not implemented - please implement PDF parsing]";
  } catch (error) {
    console.error("PDF extraction error:", error);
    return "[Error extracting PDF content]";
  }
}



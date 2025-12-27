
'use server';
/**
 * @fileOverview A conversational AI flow for the Assetta chatbot.
 *
 * - chat - A function that handles a conversational turn.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { listTenants, listProperties, getTenantByName } from '../tools/assetta-tools';
import { generate } from 'genkit';

const MessageSchema = z.object({
  role: z.enum(['user', 'model', 'tool']),
  content: z.string(),
});

const ChatInputSchema = z.object({
  history: z.array(MessageSchema).describe('The conversation history.'),
  message: z.string().describe('The latest user message.'),
  uid: z.string().describe("The user's unique ID."),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.string().describe("The model's response.");
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function chat(input: ChatInput): Promise<ChatOutput> {
  return chatFlow(input);
}

const promptTemplate = `You are Assetta, a friendly and helpful AI assistant for landlords using the Assetta property management app.

Your goal is to answer questions and help users manage their properties. You can list tenants, filter them by status, and list properties. Be concise and professional. When presenting lists, use formatting like bullet points. When you use a tool, do not just repeat the tool's output. Instead, summarize it in a friendly and helpful way.

Here is the conversation history:
{{#each history}}
- {{role}}: {{{content}}}
{{/each}}

Here is the user's latest message:
- user: {{{message}}}`;

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    // Genkit automatically maps the `uid` from the flow's input to the tool's input.
    const response = await generate({
      model: 'gemini-2.5-flash',
      tools: [listTenants, listProperties, getTenantByName],
      prompt: promptTemplate,
      history: input.history,
      input: {
        message: input.message,
        uid: input.uid,
      },
    });

    return response.text;
  }
);

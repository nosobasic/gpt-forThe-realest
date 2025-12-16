/**
 * OpenAI ChatGPT API Integration
 * 
 * IMPORTANT: Set your OpenAI API key using one of these methods:
 * 
 * Method 1 (Recommended - Environment Variable):
 * - Create a .env file in the root directory
 * - Add: VITE_OPENAI_API_KEY=your_actual_key_here
 * - The app will automatically use this value
 * 
 * Method 2 (Direct - For testing only):
 * - Replace 'YOUR_API_KEY_HERE' below with your actual API key
 * - Note: This is less secure and not recommended for production
 * 
 * Get your API key from: https://platform.openai.com/api-keys
 */

// Try to get API key from environment variable first, fallback to direct value
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY || 'YOUR_API_KEY_HERE';
const API_URL = 'https://api.openai.com/v1/chat/completions';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
  error?: {
    message: string;
  };
}

/**
 * Sends a message to OpenAI ChatGPT API and returns the assistant's response
 * @param messages - Array of conversation messages (maintains context)
 * @returns Promise with the assistant's response text
 */
export async function sendMessage(messages: Message[]): Promise<string> {
  // Check if API key is set
  if (API_KEY === 'YOUR_API_KEY_HERE') {
    throw new Error(
      'Please set your OpenAI API key in src/utils/api.ts. ' +
      'Get your key from https://platform.openai.com/api-keys'
    );
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // You can change this to 'gpt-4' if you have access
        messages: messages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || 
        `API request failed with status ${response.status}`
      );
    }

    const data: ChatResponse = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from API');
    }

    return data.choices[0].message.content;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to communicate with OpenAI API');
  }
}


/**
 * Backend API Integration
 * 
 * This app connects to the backend deployed on Render.com
 * The backend handles OpenAI API communication securely
 */

// Backend API URL
const API_URL = 'https://gpt-forthe-realest.onrender.com';

export interface Attachment {
  type: 'image';
  data: string; // base64 encoded or URL
  mimeType: string;
  name?: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: Attachment[];
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
 * Sends a message to the backend API and returns the assistant's response
 * @param messages - Array of conversation messages (maintains context)
 * @returns Promise with the assistant's response text
 */
export async function sendMessage(messages: Message[]): Promise<string> {
  try {
    // Try common backend endpoints - adjust based on your backend structure
    const endpoints = ['/chat', '/api/chat', '/'];
    
    let lastError: Error | null = null;
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${API_URL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: messages.map(msg => ({
              role: msg.role,
              content: msg.content,
              attachments: msg.attachments || [],
            })),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error?.message || 
            errorData.message ||
            `API request failed with status ${response.status}`
          );
        }

        const data = await response.json();
        
        // Handle different possible response formats
        if (data.error) {
          throw new Error(data.error.message || data.error);
        }

        // Try different response formats
        if (data.response) {
          return data.response;
        }
        
        if (data.message) {
          return data.message;
        }
        
        if (data.choices && data.choices.length > 0) {
          return data.choices[0].message?.content || data.choices[0].message;
        }
        
        if (typeof data === 'string') {
          return data;
        }

        throw new Error('Unexpected response format from backend');
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        // If this is the last endpoint, throw the error
        if (endpoint === endpoints[endpoints.length - 1]) {
          throw lastError;
        }
        // Otherwise, try the next endpoint
        continue;
      }
    }
    
    throw lastError || new Error('Failed to communicate with backend API');
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to communicate with backend API');
  }
}


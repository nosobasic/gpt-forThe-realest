const API_URL = '';

export interface Attachment {
  type: 'image';
  data: string;
  mimeType: string;
  name?: string;
}

export interface Message {
  id?: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: Attachment[];
  created_at?: string;
}

export interface Conversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

export interface Memory {
  id: number;
  content: string;
  created_at: string;
}

function getHeaders(userId: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-User-Id': userId,
  };
}

export async function listConversations(userId: string): Promise<Conversation[]> {
  const response = await fetch(`${API_URL}/api/conversations`, {
    headers: getHeaders(userId),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch conversations');
  }
  return response.json();
}

export async function createConversation(userId: string, title?: string): Promise<Conversation> {
  const response = await fetch(`${API_URL}/api/conversations`, {
    method: 'POST',
    headers: getHeaders(userId),
    body: JSON.stringify({ title }),
  });
  if (!response.ok) {
    throw new Error('Failed to create conversation');
  }
  return response.json();
}

export async function getConversation(userId: string, conversationId: number): Promise<Conversation & { messages: Message[] }> {
  const response = await fetch(`${API_URL}/api/conversations/${conversationId}`, {
    headers: getHeaders(userId),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch conversation');
  }
  return response.json();
}

export async function updateConversation(userId: string, conversationId: number, title: string): Promise<Conversation> {
  const response = await fetch(`${API_URL}/api/conversations/${conversationId}`, {
    method: 'PUT',
    headers: getHeaders(userId),
    body: JSON.stringify({ title }),
  });
  if (!response.ok) {
    throw new Error('Failed to update conversation');
  }
  return response.json();
}

export async function deleteConversation(userId: string, conversationId: number): Promise<void> {
  const response = await fetch(`${API_URL}/api/conversations/${conversationId}`, {
    method: 'DELETE',
    headers: getHeaders(userId),
  });
  if (!response.ok) {
    throw new Error('Failed to delete conversation');
  }
}

export async function sendMessageToConversation(userId: string, conversationId: number, content: string): Promise<string> {
  const response = await fetch(`${API_URL}/api/conversations/${conversationId}/chat`, {
    method: 'POST',
    headers: getHeaders(userId),
    body: JSON.stringify({ content }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.message || data.error || 'Failed to send message');
  }
  
  return data.response || data.message;
}

export async function listMemories(userId: string): Promise<Memory[]> {
  const response = await fetch(`${API_URL}/api/memories`, {
    headers: getHeaders(userId),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch memories');
  }
  return response.json();
}

export async function addMemory(userId: string, content: string): Promise<Memory> {
  const response = await fetch(`${API_URL}/api/memories`, {
    method: 'POST',
    headers: getHeaders(userId),
    body: JSON.stringify({ content }),
  });
  if (!response.ok) {
    throw new Error('Failed to add memory');
  }
  return response.json();
}

export async function deleteMemory(userId: string, memoryId: number): Promise<void> {
  const response = await fetch(`${API_URL}/api/memories/${memoryId}`, {
    method: 'DELETE',
    headers: getHeaders(userId),
  });
  if (!response.ok) {
    throw new Error('Failed to delete memory');
  }
}

export async function sendMessage(messages: Message[]): Promise<string> {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });
  
  const data = await response.json();
  
  if (!response.ok || data.error) {
    throw new Error(data.error?.message || data.error || 'Failed to send message');
  }
  
  return data.response || data.message;
}

# GPT 4 Real - ChatGPT Clone

## Overview
A full-featured ChatGPT clone with multiple chat conversations, persistent memory, and Clerk authentication. Uses OpenAI API for AI responses and PostgreSQL for data storage.

## Project Architecture

### Frontend (React + Vite + TypeScript)
- **Port**: 5000
- **Framework**: React 19 with Vite 7
- **Authentication**: Clerk
- **Location**: `src/` directory

### Backend (Python Flask)
- **Port**: 3000 (internal, proxied through Vite)
- **Database**: PostgreSQL
- **API Endpoints**:
  - `GET /` - Health check
  - `GET /api/conversations` - List user's conversations
  - `POST /api/conversations` - Create new conversation
  - `GET /api/conversations/:id` - Get conversation with messages
  - `PUT /api/conversations/:id` - Update conversation title
  - `DELETE /api/conversations/:id` - Delete conversation
  - `POST /api/conversations/:id/chat` - Send message and get AI response
  - `GET /api/memories` - List user's memories
  - `POST /api/memories` - Add memory
  - `DELETE /api/memories/:id` - Delete memory

### Database Schema
- **users**: User accounts (id, email, created_at)
- **conversations**: Chat sessions (id, user_id, title, timestamps)
- **messages**: Individual messages (id, conversation_id, role, content, created_at)
- **memories**: Persistent user facts (id, user_id, content, created_at)

## Features
- Multiple chat conversations with history
- Chat sidebar to switch between conversations
- Automatic chat title generation from first message
- Memory system that extracts and stores key facts about the user
- Memories are injected into AI context for personalized responses
- Clerk authentication integration

## Environment Variables

### Required Secrets
- `OPENAI_API_KEY` - OpenAI API key for chat functionality
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk publishable key for authentication

### Database (Auto-configured)
- `DATABASE_URL` - PostgreSQL connection string

## Running the Application
1. Frontend workflow runs `npm run dev` on port 5000
2. Backend workflow runs `python app.py` on port 3000
3. Vite proxies `/api/*` and `/chat` requests to the backend

## Recent Changes
- 2026-02-01: Added full ChatGPT clone features
  - PostgreSQL database with conversation and memory storage
  - Chat sidebar with conversation list
  - Memory tab showing stored facts about user
  - Auto-extraction of user facts during conversations
  - Personalized AI responses using stored memories

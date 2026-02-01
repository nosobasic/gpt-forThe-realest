# GPT 4 Real - ChatGPT Clone

## Overview
A ChatGPT clone application with a React/Vite frontend and Python Flask backend. Uses Clerk for authentication and OpenAI API for chat functionality.

## Project Architecture

### Frontend (React + Vite + TypeScript)
- **Port**: 5000
- **Framework**: React 19 with Vite 7
- **Authentication**: Clerk
- **Location**: `src/` directory

### Backend (Python Flask)
- **Port**: 3000 (internal, proxied through Vite)
- **API Endpoints**:
  - `GET /` - Health check
  - `POST /chat` or `POST /api/chat` - Chat with OpenAI

## Environment Variables

### Required Secrets
- `OPENAI_API_KEY` - OpenAI API key for chat functionality
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk publishable key for authentication

## Running the Application
1. Frontend workflow runs `npm run dev` on port 5000
2. Backend workflow runs `python app.py` on port 3000
3. Vite proxies `/api/*` and `/chat` requests to the backend

## Recent Changes
- 2026-02-01: Configured for Replit environment
  - Updated vite.config.ts for host 0.0.0.0:5000 with allowedHosts
  - Added proxy configuration for backend API calls
  - Updated backend to use port 3000
  - Set up environment variables

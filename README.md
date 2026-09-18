# ItWield

An AI-powered workflow automation and agent orchestration platform.

## Overview

ItWield allows you to build, manage, and execute automated workflows visually. It connects multiple services (like Google Sheets, Slack, Discord, and Email), triggers actions via schedules or webhooks, and seamlessly embeds AI agents to intelligently transform, analyze, and route your data. 

## Features

- **Visual Workflow Builder:** Drag-and-drop canvas to design automations.
- **AI Workflow Generation:** Prompt-to-workflow generation using OpenAI.
- **Agentic Orchestration:** Integrate AI agents directly into workflows.
- **Integration Ecosystem:** Native actions for Google Sheets, Slack, Discord, Resend, and standard HTTP requests.
- **Authentication & Multi-tenancy:** Secure Workspaces backed by Supabase Auth and Row-Level Security (RLS).
- **Execution History:** Detailed run logs with pause, resume, and step-level retry capabilities.

## Tech Stack

- **Frontend:** React, Vite, TailwindCSS, React Flow
- **Backend:** Node.js, Express, TypeScript, node-cron
- **Database:** Supabase (PostgreSQL), pgvector for AI memory
- **AI Integration:** OpenAI API, Tavily (Web Search)

## Project Structure

- `/frontend` - The React application and UI canvas.
- `/backend` - The Node.js automation engine and API server.
- `/supabase/migrations` - Complete PostgreSQL database schema and security policies.

## Requirements

- Node.js v18+
- npm or yarn
- A Supabase Project
- OpenAI API Key

## Installation

```bash
git clone https://github.com/manjunathannigeri120-glitch/ItWield.git
cd ItWield

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## Environment Variables

You must create local environment files before running the application.

1. **Backend:** Copy `backend/.env.example` to `backend/.env` and fill in your Supabase and OpenAI keys.
2. **Frontend:** Copy `frontend/.env.example` to `frontend/.env` and fill in your public Supabase URL and Anon key.

> **IMPORTANT:** Never commit your `.env` files to Git. The `.gitignore` is pre-configured to exclude them.

## Development

Run both the frontend and backend servers simultaneously.

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

The application will be accessible at `http://localhost:5173`.

## Build

To create a production build:

```bash
# Build backend
cd backend
npm run build

# Build frontend
cd frontend
npm run build
```

## Deployment

- **Database:** Hosted on Supabase.
- **Backend:** Can be deployed to Render, Railway, or AWS. Set the root directory to `backend`, use `npm install && npm run build`, and run `npm start`.
- **Frontend:** Optimized for Vercel or Netlify. Set the root directory to `frontend` and the framework to Vite. 

Ensure you duplicate your `.env` variables into the respective hosting platform's environment configuration.

## Security

- All API keys and the Supabase `SERVICE_ROLE_KEY` must remain strictly in the backend.
- The `ENCRYPTION_KEY` is required to securely encrypt 3rd-party OAuth credentials in the database. If this key is lost, connected integrations will require re-authentication.

## Status
- Core Automation Engine: Implemented
- AI Workflow Generator: Implemented
- Third-party Integrations: Implemented

# Fokus RAG Frontend

React.js frontend for the Fokus RAG document assistant. Built with Vite, Tailwind CSS, and Clerk authentication.

## Tech Stack

- **React 18** - Component library
- **Vite** - Build tool (lightning-fast dev server)
- **Tailwind CSS** - Styling
- **Clerk** - Authentication
- **Lucide Icons** - UI icons

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Features

- Real-time streaming chat
- PDF document upload
- Language toggle (English/German)
- Session management
- User authentication

## Environment Variables

Create `.env.local`:

```
VITE_CLERK_PUBLISHABLE_KEY=your_key
VITE_API_URL=http://localhost:8000
```

## Streaming Chat

The frontend handles streaming responses from the backend:

- Creates empty message placeholder
- Opens ReadableStream from response
- Appends characters to message in real-time
- Updates sources on completion

See [STREAMING_IMPLEMENTATION_GUIDE.md](../STREAMING_IMPLEMENTATION_GUIDE.md) for technical details.

## Project Structure

```
src/
├── App.jsx              # Main component + streaming handler
├── components/          # React components
│   ├── MessageInput.jsx
│   ├── MessageList.jsx
│   ├── Sidebar.jsx
│   ├── SettingsHub.jsx
│   └── DocumentHub.jsx
├── utils/               # Helper functions
│   └── streamingHandler.js
├── App.css
├── index.css
└── main.jsx
```

## Building

```bash
npm run build
```

Outputs to `dist/` directory, ready for deployment to Vercel.

## Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

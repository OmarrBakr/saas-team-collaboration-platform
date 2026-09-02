# Flowvia

Flowvia is a full-stack team collaboration platform for organizing work in shared workspaces and boards. Teams can create lists and cards, assign work, manage members, and receive real-time updates and notifications.

## Features

- Registration, login, email verification, password reset, and Google OAuth
- Secure HttpOnly access and refresh-token cookies
- CSRF protection, CORS, Helmet security headers, and rate limiting
- Workspaces with member roles and invitations
- Boards with lists, cards, labels, assignees, due dates, and attachments
- Drag-and-drop card and list organization
- Real-time board updates, notifications, and presence with Socket.IO
- Cloudinary uploads and email notifications
- Redis-backed rate limiting, caching, presence, and Socket.IO synchronization

## Technology

React, Vite, React Router, Node.js, Express, MongoDB, Mongoose, Redis, Socket.IO, JWT, bcryptjs, Cloudinary, Nodemailer, Docker, GitHub Actions, Jest, Supertest, Vitest, React Testing Library, and MSW.

## Project structure

```text
client/                  React frontend
server/                  Express backend
  src/controllers/       Request handlers
  src/middleware/        Security and request middleware
  src/models/            Mongoose models
  src/realtime/          Socket.IO setup and events
  src/services/          Application services
  tests/                 Backend tests
.github/workflows/       GitHub Actions workflows
docker-compose.yml       Local MongoDB, Redis, and server services
```

## Requirements

- Node.js 22 or later
- npm
- Docker Desktop (recommended)

## Environment variables

Create `server/.env` with backend configuration. Never commit this file.

```env
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://localhost:27017/flowvia
REDIS_URL=redis://localhost:6379
CLIENT_ORIGIN=http://localhost:5173
JWT_SECRET=replace-with-a-long-random-secret
JWT_LIFETIME=15m
REFRESH_TOKEN_SECRET=replace-with-another-long-random-secret
REFRESH_TOKEN_LIFETIME=7d
CSRF_SECRET=replace-with-a-long-random-secret
COOKIE_SAME_SITE=lax
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback
NODEMAILER_HOST=smtp.gmail.com
NODEMAILER_PORT=587
NODEMAILER_SECURE=false
NODEMAILER_USER=your-email@example.com
NODEMAILER_PASS=your-google-app-password
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Create `client/.env`:

```env
VITE_BACKEND_URL=http://localhost:3000
```

Frontend variables are public and included in the browser bundle. Never put secrets in `client/.env`.

## Run with Docker

Docker Compose starts MongoDB, Redis, and the backend:

```bash
docker compose up -d --build
```

Start the frontend separately:

```bash
cd client
npm ci
npm run dev
```

The application is available at `http://localhost:5173`.

Stop the services with:

```bash
docker compose down
```

## Run without Docker

Run MongoDB and Redis locally, then start the backend and frontend in separate terminals:

```bash
cd server
npm ci
npm run dev
```

```bash
cd client
npm ci
npm run dev
```
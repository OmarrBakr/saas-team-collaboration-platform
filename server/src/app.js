const express = require('express');
const http = require('http');
require('dotenv').config();
require('express-async-errors');
const cookieParser = require('cookie-parser');

const connectDB = require('./db/connect');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

// routers
const authRouter = require('./routes/auth');
const userRouter = require('./routes/user');
const workspaceRouter = require('./routes/workspace');
const boardRouter = require('./routes/board');
const notificationRouter = require('./routes/notifications');

// middleware
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');
const authenticationMiddleware = require('./middleware/authentication');
const setupSocket = require('./realtime/socket');

// routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', authenticationMiddleware, userRouter);
app.use('/api/v1/workspaces', authenticationMiddleware, workspaceRouter);
app.use('/api/v1/workspaces/:workspaceId/boards', authenticationMiddleware, boardRouter);
app.use('/api/v1/notifications', authenticationMiddleware, notificationRouter);

//error handler
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const startServer = async () => {
  await connectDB();

  const httpServer = http.createServer(app);
  const io = setupSocket(httpServer);
  app.set('io', io);

  httpServer.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
};

startServer();

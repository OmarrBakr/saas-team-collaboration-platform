const express = require('express');
const http = require('http');
require('dotenv').config();
require('express-async-errors');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const { doubleCsrfProtection } = require('./middleware/csrf');

const connectDB = require('./db/connect');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN,
    credentials: true,
  })
);
app.use(doubleCsrfProtection);


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
const { apiLimiter } = require('./middleware/rate-limit');
const logger = require('./utils/logger');

process.on('uncaughtException', (error) => {
  logger.error('process.uncaught_exception', { error: logger.serializeError(error) });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  logger.error('process.unhandled_rejection', { error: logger.serializeError(error) });
});

// routes
app.use('/api/v1', apiLimiter);
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
  const io = await setupSocket(httpServer);
  app.set('io', io);

  httpServer.listen(port, () => {
    logger.info('server.started', { port });
  });
};

if (require.main === module) {
  startServer();
}

module.exports = app;

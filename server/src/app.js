const express = require('express');
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

// middleware
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');
const authenticationMiddleware = require('./middleware/authentication');

// routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', authenticationMiddleware, userRouter);
app.use('/api/v1/workspaces', authenticationMiddleware, workspaceRouter);

//error handler
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const startServer = async () => {
  await connectDB();

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
};

startServer();

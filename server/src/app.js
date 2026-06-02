const express = require('express');
require('dotenv').config();
const cookieParser = require('cookie-parser');

const connectDB = require('./db/connect');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

// routers
const authRouter = require('./routes/auth');

// middleware
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');

// routes
app.use('/api/v1/auth', authRouter);

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

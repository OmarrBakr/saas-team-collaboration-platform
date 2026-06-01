const express = require('express');
require('dotenv').config();

const connectDB = require('./db/connect');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const startServer = async () => {
  await connectDB();

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
};

startServer();

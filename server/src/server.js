// src/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const alumniRoutes = require('./routes/alumni.routes');
const { logger } = require('./middlewares/logger.middleware');
const { errorMiddleware } = require('./middlewares/error.middleware');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(logger);

app.get('/', (req, res) => {
  res.status(200).json({
    projeto: 'Portal Alumni',
    status: 'Online',
    timestamp: new Date().toISOString(),
  });
});

app.use('/alunos', alumniRoutes);

app.use(errorMiddleware);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server ON: http://localhost:${PORT}`);
});

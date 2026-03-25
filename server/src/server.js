const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Importação das rotas
const alumniRoutes = require('./routes/alumni.routes');
const authRoutes = require('./routes/auth.routes');
const meRoutes = require('./routes/me.routes');
const { errorMiddleware } = require('./middlewares/error.middleware');
const { logger } = require('./middlewares/logger.middleware');

const app = express();

const allowedOrigins = [
  'http://localhost:3001',
  'http://localhost:5173',
  'http://localhost:5174',
  'https://alumniime.com.br',
  'https://portal.alumniime.com.br',
];

// --- 1. LOGGER DE EMERGÊNCIA (DEVE SER O PRIMEIRO) ---
app.use((req, res, next) => {
  console.log(
    `[DEBUG] Chamada: ${req.method} ${req.url} - Origin: ${req.headers.origin}`,
  );
  next();
});

// --- 2. HELMET (CONFIGURADO PARA NÃO BARRAR LOCALHOST) ---
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

// --- 3. CONFIGURAÇÃO DO CORS ---
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.includes(origin);
    const isVercelPreview =
      origin.includes('portal-alumni') && origin.endsWith('.vercel.app');

    if (isAllowed || isVercelPreview) {
      return callback(null, true);
    } else {
      console.error(`[CORS BLOQUEOU]: ${origin}`);
      return callback(new Error('CORS Not Allowed'), false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// --- 4. TRATAMENTO EXPLÍCITO DE PREFLIGHT (OPTIONS) ---
// Isso garante que o navegador receba um OK antes de tentar o envio pesado da foto
app.options('*', cors(corsOptions));

// --- 5. PARSERS E OUTROS MIDDLEWARES ---
app.use(express.json());
app.use(logger);

// --- 6. ROTAS ---
// --- 6. ROTAS ---
app.use('/alumni', alumniRoutes);
app.use('/auth', authRoutes);
app.use('/me', meRoutes);

app.get('/', (req, res) => {
  res.status(200).json({ status: 'Online' });
});

// --- 7. ERROS ---
app.use(errorMiddleware);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

module.exports = app;

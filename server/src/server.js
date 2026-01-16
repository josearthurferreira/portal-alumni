const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const alumniRoutes = require('./routes/alumni.routes');
const { errorMiddleware } = require('./middlewares/error.middleware');
const { logger } = require('./middlewares/logger.middleware');
const authRoutes = require('./routes/auth.routes');
const meRoutes = require('./routes/me.routes');

const allowedOrigins = [
  'http://localhost:3001',
  'http://localhost:5173', // Porta padrão do Vite
  'https://portal-alumni-ruddy.vercel.app/'
];

require('dotenv').config();

// Importação das rotas (as que você criou na pasta routes)
// const alumniRoutes = require('./routes/alumni.routes');

const app = express();

// --- Middlewares Globais ---
app.use(helmet()); // Proteção de cabeçalhos HTTP
app.use(cors({
  origin: function (origin, callback) {
    // Permite requisições sem origin (como mobile apps ou curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'A política CORS para este site não permite acesso do domínio: ' + origin;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json()); // Permite que o servidor entenda JSON
app.use(logger);
app.use('/alumni', alumniRoutes);
app.use('/auth', authRoutes);
app.use('/me', meRoutes);

// --- Rota de Teste (Health Check) ---
app.get('/', (req, res) => {
  res.status(200).json({
    projeto: 'Portal Alumni',
    status: 'Online',
    timestamp: new Date().toISOString(),
  });
});

// --- Configuração de Rotas Futuras ---
// app.use('/alumni', alumniRoutes);

// --- Middleware de Erro (DEVE ser o último antes do export/listen) ---
app.use(errorMiddleware);

// --- Inicialização do Servidor (Local) ---
const PORT = process.env.PORT || 3001;

// Na Vercel, o 'listen' não é estritamente necessário,
// mas mantemos para você rodar localmente com 'npm run dev'
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor voando em http://localhost:${PORT}`);
  });
}

// --- ESSENCIAL PARA VERCEL ---
module.exports = app;

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const alumniRoutes = require('./routes/alumni.routes');
const { errorMiddleware } = require('./middlewares/error.middleware');
const { logger } = require('./middlewares/logger.middleware');
const authRoutes = require('./routes/auth.routes');
const meRoutes = require('./routes/me.routes');

require('dotenv').config();

// Importação das rotas (as que você criou na pasta routes)
// const alumniRoutes = require('./routes/alumni.routes');

const app = express();

// --- Middlewares Globais ---
app.use(helmet()); // Proteção de cabeçalhos HTTP
app.use(cors()); // Libera acesso para o Front-end
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

// --- Inicialização do Servidor ---
const PORT = process.env.PORT || 3001;
app.use(errorMiddleware);
app.listen(PORT, () => {
  console.log(`
  🚀 Servidor voando!
  📡 URL: http://localhost:${PORT}
  🛠️  Ambiente pronto para JA, TD e F.
  `);
});

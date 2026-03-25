const nodemailer = require('nodemailer');

// 1. Configura o "SmtpClient" do Node.js
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true, // true para porta 465, false para outras portas (ex: 587)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// 2. Função Base para enviar e-mails
async function sendEmail(to, subject, htmlBody) {
  try {
    const mailOptions = {
      from: `"Portal Alumni" <${process.env.SMTP_USER}>`, // Remetente
      to,                                               // Destinatário
      subject,                                          // Assunto
      html: htmlBody,                                   // Corpo em HTML
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[E-mail Enviado] ${subject} para ${to}. ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[Erro E-mail] Falha ao enviar e-mail para ${to}:`, error.message);
    throw new Error('Não foi possível enviar o e-mail.');
  }
}

// 3. Casos de Uso Específicos

// E-mail de Confirmação de Cadastro
async function sendConfirmationEmail(userEmail, userName, token) {
  // Monta o link que o usuário vai clicar para confirmar
  const confirmationLink = `${process.env.FRONTEND_URL}/confirm-email?token=${token}`;

  const subject = 'Confirme seu cadastro no Portal Alumni';
  const htmlBody = `
    <h2>Olá, ${userName}!</h2>
    <p>Obrigado por se cadastrar no Portal Alumni. Para ativar sua conta, por favor confirme seu e-mail clicando no link abaixo:</p>
    <a href="${confirmationLink}" style="padding: 10px 15px; background-color: #cc4b00; color: white; text-decoration: none; border-radius: 5px;">Confirmar meu e-mail</a>
    <p>Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
    <p>${confirmationLink}</p>
    <p>Se você não solicitou este cadastro, ignore este e-mail.</p>
  `;

  return sendEmail(userEmail, subject, htmlBody);
}

// E-mail de Redefinição de Senha
async function sendPasswordResetEmail(userEmail, userName, token) {
  // Monta o link para redefinir a senha
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const subject = 'Redefinição de Senha - Portal Alumni';
  const htmlBody = `
    <h2>Olá, ${userName}!</h2>
    <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
    <a href="${resetLink}" style="padding: 10px 15px; background-color: #0056b3; color: white; text-decoration: none; border-radius: 5px;">Redefinir Senha</a>
    <p>Este link é válido por 1 hora.</p>
    <p>Se você não solicitou a redefinição de senha, apenas ignore este e-mail. Nenhuma alteração será feita.</p>
  `;

  return sendEmail(userEmail, subject, htmlBody);
}

module.exports = {
  sendConfirmationEmail,
  sendPasswordResetEmail
};
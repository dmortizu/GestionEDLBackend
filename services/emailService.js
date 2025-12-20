import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Configurar transporter de nodemailer
const createTransporter = () => {
  // Si hay configuración SMTP personalizada, usarla
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros puertos
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Si no hay configuración, usar Gmail (requiere contraseña de aplicación)
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
  }

  // Para desarrollo: usar Ethereal Email (genera credenciales temporales)
  // En producción, esto no funcionará, necesitas configurar SMTP real
  return null;
};

// Plantilla de email para restablecimiento de contraseña
const getResetPasswordEmailTemplate = (resetLink, username) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f9f9f9;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: white;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: linear-gradient(90deg, #667eea, #764ba2);
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      color: #666;
      font-size: 12px;
    }
    .warning {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Sistema EDL</h1>
      <p>Sistema de Evaluación de Desempeño Laboral</p>
    </div>
    <div class="content">
      <h2>Restablecimiento de Contraseña</h2>
      <p>Hola <strong>${username}</strong>,</p>
      <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en el Sistema de Evaluación de Desempeño Laboral.</p>
      <p>Para restablecer tu contraseña, haz clic en el siguiente enlace:</p>
      <p style="text-align: center;">
        <a href="${resetLink}" class="button">Restablecer Contraseña</a>
      </p>
      <p>O copia y pega este enlace en tu navegador:</p>
      <p style="word-break: break-all; color: #667eea;">${resetLink}</p>
      <div class="warning">
        <strong>⚠️ Importante:</strong>
        <ul>
          <li>Este enlace expirará en <strong>15 minutos</strong></li>
          <li>Si no solicitaste este restablecimiento, ignora este correo</li>
          <li>Por seguridad, no compartas este enlace con nadie</li>
        </ul>
      </div>
      <p>Si tienes problemas, contacta al administrador del sistema.</p>
    </div>
    <div class="footer">
      <p>© 2025 Medicina Legal. Todos los derechos reservados.</p>
      <p>Este es un correo automático, por favor no respondas.</p>
    </div>
  </div>
</body>
</html>
  `;
};

// Enviar email de restablecimiento de contraseña
export const sendPasswordResetEmail = async (email, username, resetLink) => {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      // En desarrollo, si no hay configuración, mostrar el enlace en consola
      console.log('\n=== EMAIL DE RESTABLECIMIENTO (NO CONFIGURADO) ===');
      console.log(`Para: ${email}`);
      console.log(`Usuario: ${username}`);
      console.log(`Enlace: ${resetLink}`);
      console.log('==================================================\n');
      console.log('⚠️  Para enviar emails reales, configura las variables de entorno:');
      console.log('   - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
      console.log('   O');
      console.log('   - GMAIL_USER, GMAIL_APP_PASSWORD\n');
      return { success: false, message: 'Email no configurado - ver consola' };
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.GMAIL_USER,
      to: email,
      subject: 'Restablecimiento de Contraseña - Sistema EDL',
      html: getResetPasswordEmailTemplate(resetLink, username),
      text: `Hola ${username},\n\nHemos recibido una solicitud para restablecer tu contraseña.\n\nHaz clic en el siguiente enlace para restablecer tu contraseña:\n${resetLink}\n\nEste enlace expirará en 15 minutos.\n\nSi no solicitaste este restablecimiento, ignora este correo.\n\n© 2025 Medicina Legal.`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email enviado exitosamente:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error al enviar email:', error);
    return { success: false, error: error.message };
  }
};

// Verificar configuración de email
export const checkEmailConfig = () => {
  const hasSMTP = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
  const hasGmail = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD;
  
  return {
    configured: hasSMTP || hasGmail,
    method: hasSMTP ? 'SMTP' : hasGmail ? 'Gmail' : 'Ninguno'
  };
};


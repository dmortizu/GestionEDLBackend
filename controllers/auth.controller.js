import pool from '../db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { sendPasswordResetEmail, checkEmailConfig } from '../services/emailService.js';
dotenv.config();

export const login = async (req, res) => {
  const { username, password } = req.body;
  
  // Validar que se envíen los campos requeridos
  if (!username || !password) {
    return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
  }

  try {
    // Verificar conexión a la base de datos
    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
      console.error('Variables de entorno de BD no configuradas');
      return res.status(500).json({ message: 'Error de configuración de la base de datos' });
    }

    const [rows] = await pool.query('SELECT * FROM usuarios WHERE username = ?', [username]);
    
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }

    const usuario = rows[0];
    
    // Verificar que el usuario tenga una contraseña
    if (!usuario.password) {
      return res.status(500).json({ message: 'Error en la configuración del usuario' });
    }

    // Detectar si la contraseña está hasheada (bcrypt siempre empieza con $2a$, $2b$ o $2y$)
    const isHashed = usuario.password.startsWith('$2a$') || 
                     usuario.password.startsWith('$2b$') || 
                     usuario.password.startsWith('$2y$');

    let valido = false;

    if (isHashed) {
      // Contraseña hasheada: comparar con bcrypt
      valido = await bcrypt.compare(password, usuario.password);
    } else {
      // Contraseña en texto plano: comparar directamente (migración)
      valido = usuario.password === password;
      
      // Si la contraseña es correcta y está en texto plano, hashearla y actualizarla
      if (valido) {
        const passwordHash = await bcrypt.hash(password, 10);
        await pool.query('UPDATE usuarios SET password = ? WHERE id = ?', [passwordHash, usuario.id]);
        console.log(`Contraseña hasheada automáticamente para usuario: ${username}`);
      }
    }
    
    if (!valido) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }

    // Generar token
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Error de configuración del servidor' });
    }

    const token = jwt.sign(
      { id: usuario.id, username: usuario.username },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    
    res.json({
      token,
      usuario: {
        id: usuario.id,
        username: usuario.username,
        nombres_apellidos: usuario.nombres_apellidos
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    // Proporcionar más información sobre el error para debugging
    const errorMessage = error.message || 'Error desconocido';
    console.error('Detalles del error:', {
      message: errorMessage,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    // En desarrollo, mostrar el error completo para debugging
    const isDevelopment = process.env.NODE_ENV !== 'production';
    res.status(500).json({ 
      message: 'Error del servidor',
      ...(isDevelopment && { 
        error: errorMessage,
        details: {
          code: error.code,
          sqlState: error.sqlState,
          sqlMessage: error.sqlMessage
        }
      })
    });
  }
};

// Validar complejidad de contraseña
const validatePasswordComplexity = (password) => {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  return {
    valid: Object.values(requirements).every(req => req === true),
    requirements
  };
};

// Solicitar restablecimiento de contraseña
export const forgotPassword = async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ message: 'El nombre de usuario es requerido' });
  }

  try {
    // Buscar usuario
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE username = ?', [username]);
    
    if (rows.length === 0) {
      // Por seguridad, no revelamos si el usuario existe o no
      return res.json({ 
        message: 'Si el usuario existe, se ha enviado un enlace de restablecimiento a su correo electrónico.' 
      });
    }

    const usuario = rows[0];

    // Generar token único y seguro
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Fecha de expiración: 15 minutos
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Guardar token en la base de datos
    // Primero, eliminar tokens anteriores del usuario
    await pool.query('DELETE FROM password_reset_tokens WHERE usuario_id = ?', [usuario.id]);
    
    // Insertar nuevo token
    await pool.query(
      'INSERT INTO password_reset_tokens (usuario_id, token, expires_at) VALUES (?, ?, ?)',
      [usuario.id, hashedToken, expiresAt]
    );

    // Generar enlace de restablecimiento
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/forgot-password?token=${resetToken}`;

    // Intentar enviar email
    // Nota: Si la tabla usuarios no tiene campo email, se puede usar un campo alternativo
    // o configurar un email por defecto. Por ahora, intentamos obtener email si existe.
    const userEmail = usuario.email || usuario.correo || null;
    
    if (userEmail) {
      const emailResult = await sendPasswordResetEmail(
        userEmail,
        usuario.username || usuario.nombres_apellidos || 'Usuario',
        resetLink
      );

      if (emailResult.success) {
        console.log(`✅ Email de restablecimiento enviado a: ${userEmail}`);
      } else {
        console.warn(`⚠️ No se pudo enviar el email a ${userEmail}:`, emailResult.error || emailResult.message);
        // En desarrollo, mostrar el enlace en consola como respaldo
        if (process.env.NODE_ENV !== 'production') {
          console.log('\n=== ENLACE DE RESTABLECIMIENTO (RESPALDO) ===');
          console.log(`Usuario: ${username}`);
          console.log(`Email: ${userEmail}`);
          console.log(`Enlace: ${resetLink}`);
          console.log('==================================================\n');
        }
      }
    } else {
      // Si no hay email configurado, mostrar en consola (solo desarrollo)
      console.log('\n=== ENLACE DE RESTABLECIMIENTO (NO HAY EMAIL CONFIGURADO) ===');
      console.log(`Usuario: ${username}`);
      console.log(`Enlace: ${resetLink}`);
      console.log('⚠️  El usuario no tiene email configurado en la base de datos.');
      console.log('    Agrega un campo "email" o "correo" a la tabla usuarios.');
      console.log('==================================================\n');
    }

    // Verificar configuración de email
    const emailConfig = checkEmailConfig();
    if (!emailConfig.configured && process.env.NODE_ENV === 'production') {
      console.warn('⚠️  ADVERTENCIA: Email no configurado en producción. Configura SMTP o Gmail.');
    }

    res.json({ 
      message: 'Si el usuario existe, se ha enviado un enlace de restablecimiento a su correo electrónico.',
      // Solo en desarrollo y si no se pudo enviar el email
      ...(process.env.NODE_ENV !== 'production' && (!userEmail || !checkEmailConfig().configured) && { resetLink })
    });
  } catch (error) {
    console.error('Error en forgotPassword:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// Restablecer contraseña con token
export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token y nueva contraseña son requeridos' });
  }

  try {
    // Validar complejidad de contraseña
    const passwordValidation = validatePasswordComplexity(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ 
        message: 'La contraseña no cumple con los requisitos de seguridad',
        requirements: passwordValidation.requirements
      });
    }

    // Hashear el token recibido para compararlo con el de la BD
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Buscar token válido
    const [tokenRows] = await pool.query(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > NOW() AND used = 0',
      [hashedToken]
    );

    if (tokenRows.length === 0) {
      return res.status(400).json({ 
        message: 'Token inválido o expirado. Por favor, solicite un nuevo enlace de restablecimiento.' 
      });
    }

    const tokenData = tokenRows[0];

    // Obtener usuario
    const [userRows] = await pool.query('SELECT * FROM usuarios WHERE id = ?', [tokenData.usuario_id]);
    if (userRows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const usuario = userRows[0];

    // Verificar que la nueva contraseña no sea igual a la anterior
    const isHashed = usuario.password.startsWith('$2a$') || 
                     usuario.password.startsWith('$2b$') || 
                     usuario.password.startsWith('$2y$');

    if (isHashed) {
      const isSamePassword = await bcrypt.compare(newPassword, usuario.password);
      if (isSamePassword) {
        return res.status(400).json({ 
          message: 'La nueva contraseña no puede ser igual a la contraseña anterior' 
        });
      }
    } else {
      // Si está en texto plano (migración)
      if (usuario.password === newPassword) {
        return res.status(400).json({ 
          message: 'La nueva contraseña no puede ser igual a la contraseña anterior' 
        });
      }
    }

    // Hashear nueva contraseña
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña del usuario
    await pool.query('UPDATE usuarios SET password = ? WHERE id = ?', [passwordHash, usuario.id]);

    // Marcar token como usado
    await pool.query('UPDATE password_reset_tokens SET used = 1 WHERE id = ?', [tokenData.id]);

    res.json({ message: 'Contraseña restablecida exitosamente' });
  } catch (error) {
    console.error('Error en resetPassword:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};
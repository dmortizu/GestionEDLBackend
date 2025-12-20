import pool from '../db.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

async function testLogin() {
  try {
    const username = 'admin';
    const password = 'admin123';
    
    console.log('🔍 Probando login con usuario:', username);
    console.log('📝 Contraseña:', password);
    console.log('---');
    
    // Buscar el usuario
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE username = ?', [username]);
    
    if (rows.length === 0) {
      console.error('❌ Usuario no encontrado');
      process.exit(1);
    }

    const usuario = rows[0];
    console.log('✅ Usuario encontrado');
    console.log('   ID:', usuario.id);
    console.log('   Nombre:', usuario.nombres_apellidos);
    console.log('   Contraseña actual (primeros 20 chars):', usuario.password.substring(0, 20) + '...');
    
    // Detectar si la contraseña está hasheada
    const isHashed = usuario.password.startsWith('$2a$') || 
                     usuario.password.startsWith('$2b$') || 
                     usuario.password.startsWith('$2y$');
    
    console.log('🔐 Contraseña hasheada:', isHashed ? 'Sí' : 'No (texto plano)');
    console.log('---');
    
    let valido = false;

    if (isHashed) {
      console.log('🔄 Comparando con bcrypt...');
      valido = await bcrypt.compare(password, usuario.password);
    } else {
      console.log('🔄 Comparando texto plano...');
      valido = usuario.password === password;
      
      if (valido) {
        console.log('✅ Contraseña correcta (texto plano)');
        console.log('🔐 Hasheando contraseña automáticamente...');
        const passwordHash = await bcrypt.hash(password, 10);
        await pool.query('UPDATE usuarios SET password = ? WHERE id = ?', [passwordHash, usuario.id]);
        console.log('✅ Contraseña hasheada y actualizada en la base de datos');
        console.log('   Nuevo hash (primeros 20 chars):', passwordHash.substring(0, 20) + '...');
      }
    }
    
    if (valido) {
      console.log('---');
      console.log('✅ LOGIN EXITOSO');
      if (!isHashed) {
        console.log('✨ La contraseña fue hasheada automáticamente');
      }
    } else {
      console.log('---');
      console.log('❌ LOGIN FALLIDO - Contraseña incorrecta');
      process.exit(1);
    }
    
    // Verificar que ahora está hasheada
    const [updatedRows] = await pool.query('SELECT password FROM usuarios WHERE id = ?', [usuario.id]);
    const updatedPassword = updatedRows[0].password;
    const nowHashed = updatedPassword.startsWith('$2a$') || 
                      updatedPassword.startsWith('$2b$') || 
                      updatedPassword.startsWith('$2y$');
    
    console.log('---');
    console.log('🔍 Verificación final:');
    console.log('   Contraseña ahora está hasheada:', nowHashed ? 'Sí ✅' : 'No ❌');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testLogin();


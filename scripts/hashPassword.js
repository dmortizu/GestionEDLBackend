import pool from '../db.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

async function hashUserPassword(username, newPassword) {
  try {
    // Buscar el usuario
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE username = ?', [username]);
    
    if (rows.length === 0) {
      console.error(`Usuario "${username}" no encontrado`);
      process.exit(1);
    }

    const usuario = rows[0];
    
    // Hashear la nueva contraseña
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    // Actualizar en la base de datos
    await pool.query('UPDATE usuarios SET password = ? WHERE id = ?', [passwordHash, usuario.id]);
    
    console.log(`✓ Contraseña actualizada para el usuario "${username}"`);
    console.log(`  Nueva contraseña hasheada: ${passwordHash.substring(0, 20)}...`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Obtener argumentos de la línea de comandos
const args = process.argv.slice(2);
const username = args[0];
const newPassword = args[1];

if (!username || !newPassword) {
  console.log('Uso: node scripts/hashPassword.js <username> <nueva_contraseña>');
  console.log('Ejemplo: node scripts/hashPassword.js admin nuevaPassword123');
  process.exit(1);
}

hashUserPassword(username, newPassword);


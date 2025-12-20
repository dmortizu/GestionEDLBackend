// controllers/usuarios.controller.js
import pool from '../db.js';
import bcrypt from 'bcrypt';

export const getUsuarios = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.*, c.nombre as cargo, d.nombre as dependencia 
      FROM usuarios u 
      LEFT JOIN cargos c ON u.cargo_id = c.id 
      LEFT JOIN dependencias d ON u.dependencia_id = d.id
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createUsuario = async (req, res) => {
  const { documento, lugar_expedicion, nombres_apellidos, fecha_ingreso, cargo_id, dependencia_id, nombramiento, username, password } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const [result] = await pool.query(
      'INSERT INTO usuarios (documento, lugar_expedicion, nombres_apellidos, fecha_ingreso, cargo_id, dependencia_id, nombramiento, username, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [documento, lugar_expedicion, nombres_apellidos, fecha_ingreso, cargo_id || null, dependencia_id || null, nombramiento, username, passwordHash]
    );
    res.json({ id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUsuario = async (req, res) => {
  const { id } = req.params;
  const { documento, lugar_expedicion, nombres_apellidos, fecha_ingreso, cargo_id, dependencia_id, nombramiento, username, password } = req.body;
  try {
    let query = 'UPDATE usuarios SET documento = ?, lugar_expedicion = ?, nombres_apellidos = ?, fecha_ingreso = ?, cargo_id = ?, dependencia_id = ?, nombramiento = ?, username = ?';
    let params = [documento, lugar_expedicion, nombres_apellidos, fecha_ingreso, cargo_id || null, dependencia_id || null, nombramiento, username];
    
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      query += ', password = ?';
      params.push(passwordHash);
    }
    
    query += ' WHERE id = ?';
    params.push(id);
    
    await pool.query(query, params);
    res.json({ message: 'Usuario actualizado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
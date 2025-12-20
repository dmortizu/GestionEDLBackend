import pool from '../db.js';

export const getCargos = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM cargos');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createCargo = async (req, res) => {
  const { nombre, cargo, grado, competencia, nivel_directivo, estado } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO cargos (nombre, cargo, grado, competencia, nivel_directivo, estado) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, cargo, grado, competencia, nivel_directivo || 0, estado || 'Activo']
    );
    res.json({ id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCargo = async (req, res) => {
  const { id } = req.params;
  const { nombre, cargo, grado, competencia, nivel_directivo, estado } = req.body;
  try {
    await pool.query(
      'UPDATE cargos SET nombre = ?, cargo = ?, grado = ?, competencia = ?, nivel_directivo = ?, estado = ? WHERE id = ?',
      [nombre, cargo, grado, competencia, nivel_directivo, estado, id]
    );
    res.json({ message: 'Cargo actualizado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteCargo = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM cargos WHERE id = ?', [id]);
    res.json({ message: 'Cargo eliminado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
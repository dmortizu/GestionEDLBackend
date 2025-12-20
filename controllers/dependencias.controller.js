import pool from '../db.js';

export const getDependencias = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM dependencias');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createDependencia = async (req, res) => {
  const { codigo_id, nombre } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO dependencias (codigo_id, nombre) VALUES (?, ?)',
      [codigo_id, nombre]
    );
    res.json({ id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateDependencia = async (req, res) => {
  const { id } = req.params;
  const { codigo_id, nombre } = req.body;
  try {
    await pool.query(
      'UPDATE dependencias SET codigo_id = ?, nombre = ? WHERE id = ?',
      [codigo_id, nombre, id]
    );
    res.json({ message: 'Dependencia actualizada' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteDependencia = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM dependencias WHERE id = ?', [id]);
    res.json({ message: 'Dependencia eliminada' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
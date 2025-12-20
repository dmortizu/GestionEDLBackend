import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import usuarioRoutes from './routes/usuarios.routes.js';
import dependenciaRoutes from './routes/dependencias.routes.js';
import cargoRoutes from './routes/cargos.routes.js';
import { verificarToken } from './middleware/auth.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', verificarToken, usuarioRoutes);
app.use('/api/dependencias', verificarToken, dependenciaRoutes);
app.use('/api/cargos', verificarToken, cargoRoutes);

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Backend corriendo en puerto ${PORT}`));
import { Router } from 'express';
import { getDependencias, createDependencia, updateDependencia, deleteDependencia } from '../controllers/dependencias.controller.js';

const router = Router();

router.get('/', getDependencias);
router.post('/', createDependencia);
router.put('/:id', updateDependencia);
router.delete('/:id', deleteDependencia);

export default router;
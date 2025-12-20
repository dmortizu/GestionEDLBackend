import { Router } from 'express';
import { getCargos, createCargo, updateCargo, deleteCargo } from '../controllers/cargos.controller.js';

const router = Router();

router.get('/', getCargos);
router.post('/', createCargo);
router.put('/:id', updateCargo);
router.delete('/:id', deleteCargo);

export default router;
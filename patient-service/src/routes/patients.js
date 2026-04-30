import { Router } from 'express';
import {
  createPatient,
  listPatients,
  getPatient,
  updatePatient,
  deletePatient,
} from '../controllers/patientController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', listPatients);
router.get('/:id', getPatient);
router.post('/', createPatient);
router.put('/:id', updatePatient);
router.delete('/:id', requireRole('admin'), deletePatient);

export default router;

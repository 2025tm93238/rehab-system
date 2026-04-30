import { Router } from 'express';
import { getPatientProgressTimeline } from '../controllers/progressController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

router.get('/:patientId/progress', getPatientProgressTimeline);

export default router;

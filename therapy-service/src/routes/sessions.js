import { Router } from 'express';
import {
  createSession,
  listSessions,
  getSession,
  updateSession,
} from '../controllers/sessionController.js';
import {
  createProgress,
  getProgress,
  updateProgress,
} from '../controllers/progressController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', listSessions);
router.get('/:id', getSession);
router.post('/', createSession);
router.put('/:id', updateSession);

router.get('/:id/progress', getProgress);
router.post('/:id/progress', createProgress);
router.put('/:id/progress', updateProgress);

export default router;

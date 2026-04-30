import { Router } from 'express';
import {
  createSession,
  listSessions,
  getSession,
  updateSession,
} from '../controllers/sessionController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', listSessions);
router.get('/:id', getSession);
router.post('/', createSession);
router.put('/:id', updateSession);

export default router;

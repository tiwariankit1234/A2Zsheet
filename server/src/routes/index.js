import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import * as sheet from '../controllers/sheetController.js';
import * as progress from '../controllers/progressController.js';
import * as auth from '../controllers/authController.js';

const router = Router();

router.get('/health', sheet.health);
router.get('/meta', sheet.meta);
router.get('/topics', sheet.topics);

// "/search" must be registered before "/:id".
router.get('/problems/search', optionalAuth, sheet.search);
router.get('/problems', optionalAuth, sheet.problems);
router.get('/problems/:id', optionalAuth, sheet.problemById);

router.get('/progress', requireAuth, progress.getProgress);
router.put('/progress/:problemId', requireAuth, progress.putProgress);
router.get('/bookmarks', requireAuth, progress.getBookmarks);
router.put('/bookmarks/:problemId', requireAuth, progress.putBookmark);

router.post('/auth/guest', auth.guest);
router.post('/auth/register', optionalAuth, auth.register);
router.post('/auth/login', optionalAuth, auth.login);
router.get('/auth/me', requireAuth, auth.me);

export default router;

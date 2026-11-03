import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import * as sheet from '../controllers/sheetController.js';
import * as progress from '../controllers/progressController.js';
import * as auth from '../controllers/authController.js';
import { apiLimiter, authLimiter, guestLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.use(apiLimiter);

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

router.post('/auth/guest', guestLimiter, auth.guest);
router.post('/auth/register', authLimiter, optionalAuth, auth.register);
router.post('/auth/login', authLimiter, optionalAuth, auth.login);
router.get('/auth/me', requireAuth, auth.me);

export default router;

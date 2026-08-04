const express = require('express');
const authController = require('../controllers/auth.controller');
const { auth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiters');
const { validate } = require('../utils/validation');
const s = require('../schemas/auth.schemas');

const router = express.Router();

// Sem autocadastro: contas nascem em POST /api/admin/users.
router.post('/login', authLimiter, validate(s.loginSchema), authController.login);
router.post('/logout', authController.logout);
router.get('/me', auth, authController.me);
router.patch('/me', auth, validate(s.updateProfileSchema), authController.updateProfile);
router.post('/change-password', auth, validate(s.changePasswordSchema), authController.changePassword);
router.post('/forgot-password', authLimiter, validate(s.forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(s.resetPasswordSchema), authController.resetPassword);

module.exports = router;

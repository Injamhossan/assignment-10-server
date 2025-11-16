const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');


router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getProfile);
router.put('/me', authMiddleware, authController.updateProfile);
router.delete('/me', authMiddleware, authController.deleteProfile);
router.post('/request/send/:partnerId', authMiddleware, authController.sendRequest);
router.delete('/request/cancel/:partnerId', authMiddleware, authController.cancelRequest);
router.get('/requests', authMiddleware, authController.getRequests);
module.exports = router;
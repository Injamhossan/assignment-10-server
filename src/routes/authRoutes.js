const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');


router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', protect, authController.getProfile);
router.put('/me', protect, authController.updateProfile);
router.delete('/me', protect, authController.deleteProfile);
router.post('/request/send/:partnerId', protect, authController.sendRequest);
router.delete('/request/cancel/:partnerId', protect, authController.cancelRequest);
router.get('/requests', protect, authController.getRequests);
module.exports = router;
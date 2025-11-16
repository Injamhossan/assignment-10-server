const express = require('express');
const router = express.Router();
const partnersController = require('../controllers/partnersController');
const authMiddleware = require('../middlewares/authMiddleware'); // Middleware import korun

router.get('/', partnersController.getAllPartners);
router.get('/:id', partnersController.getPartnerById);
router.post('/', partnersController.createPartner);
router.put('/:id', authMiddleware, partnersController.updatePartner);

module.exports = router;
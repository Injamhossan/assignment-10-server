const express = require('express');
const router = express.Router();
const partnersController = require('../controllers/partnersController');
const { protect } = require('../middlewares/authMiddleware'); 

router.get('/', partnersController.getAllPartners);
router.get('/:id', partnersController.getPartnerById);
router.post('/', partnersController.createPartner);
router.put('/:id', protect, partnersController.updatePartner);

module.exports = router;
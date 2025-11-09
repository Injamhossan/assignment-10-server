const express = require('express');
const router = express.Router();
const partnersController = require('../controllers/partnersController');

// GET all partners
router.get('/', partnersController.getAllPartners);

// GET single partner by ID
router.get('/:id', partnersController.getPartnerById);

// POST - Create a new partner
router.post('/', partnersController.createPartner);

module.exports = router;


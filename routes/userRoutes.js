const express = require('express');
const { getUserById } = require('../controllers/userController');
const router = express.Router();

router.get('/:uid', getUserById);

module.exports = router;

const express = require('express');
const auth = require('../../middelwares/auth');
const account = require('./meeting')

const router = express.Router();

module.exports = router
const { add, index, view } = require('./meeting');

router.get('/', auth, index);
router.get('/view/:id', auth, view);
router.post('/add', auth, add);


const express = require('express');
const router = express.Router();
const { search, advancedSearch } = require('../controllers/searchController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, search);
router.get('/advanced', protect, advancedSearch);

module.exports = router;

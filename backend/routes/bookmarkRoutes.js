const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createCollection,
  getCollections,
  togglePostInCollection,
  getCollectionDetail,
  deleteCollection,
} = require('../controllers/bookmarkController');

router.route('/collections').post(protect, createCollection).get(protect, getCollections);
router.route('/collections/:id').get(protect, getCollectionDetail).delete(protect, deleteCollection);
router.route('/collections/:id/toggle').post(protect, togglePostInCollection);

module.exports = router;

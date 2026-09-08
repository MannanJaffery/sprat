const { Router } = require('express');
const controller = require('../controllers/searchController');

const router = Router({ mergeParams: true });

// FR8: attribute-based search across goals and scenarios (read-only, all roles).
router.get('/', controller.search);

module.exports = router;

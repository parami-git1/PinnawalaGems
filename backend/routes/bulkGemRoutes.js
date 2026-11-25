const express = require('express');
const requireAdmin = require('../middleware/adminAuth');
const { routeError } = require('../utils/catalogData');
const bulk = require('../utils/bulkGems');
const router = express.Router();
router.use(requireAdmin);
router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
for (const action of ['preview', 'remove', 'restore']) router.post('/' + action, async (req, res) => {
  try {
    const body = req.body || {};
    const value = action === 'preview' ? body.ids : action === 'remove' ? body.reviewToken : body.restoreToken;
    res.json(await bulk[action](body.scope, value, req.admin.sub));
  } catch (error) { routeError(res, error); }
});
module.exports = router;

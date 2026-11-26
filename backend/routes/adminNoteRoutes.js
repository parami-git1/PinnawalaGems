const express = require('express');
const AdminNote = require('../models/AdminNote');
const requireAdmin = require('../middleware/adminAuth');
const { plannerPayload, plannerQuery } = require('../utils/plannerFields');
const { objectId, routeError } = require('../utils/catalogData');

const router = express.Router();

router.use(requireAdmin);

router.get('/', async (req, res) => {
  try {
    const query = plannerQuery(req.query, 'note');
    const notes = await AdminNote.find(query).sort({ isPinned: -1, updatedAt: -1 });
    res.json(notes);
  } catch (error) { routeError(res, error); }
});

router.post('/', async (req, res) => {
  try {
    const note = await AdminNote.create(plannerPayload(req.body, 'note'));
    res.status(201).json(note);
  } catch (error) { routeError(res, error); }
});

router.put('/:id', async (req, res) => {
  try {
    const note = await AdminNote.findByIdAndUpdate(objectId(req.params.id), { $set: plannerPayload(req.body, 'note') }, { new: true, runValidators: true });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json(note);
  } catch (error) { routeError(res, error); }
});

router.delete('/:id', async (req, res) => {
  try {
    const note = await AdminNote.findByIdAndDelete(objectId(req.params.id));
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json({ message: 'Note deleted successfully' });
  } catch (error) { routeError(res, error); }
});

module.exports = router;

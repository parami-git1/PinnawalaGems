const express = require('express');
const AdminNote = require('../models/AdminNote');
const requireAdmin = require('../middleware/adminAuth');

const router = express.Router();

router.use(requireAdmin);

router.get('/', async (req, res) => {
  try {
    const { search = '', category, archived } = req.query;
    const query = {};
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
      { customerName: { $regex: search, $options: 'i' } }
    ];
    if (category) query.category = category;
    if (archived !== undefined) query.isArchived = archived === 'true';
    const notes = await AdminNote.find(query).sort({ isPinned: -1, updatedAt: -1 });
    res.json(notes);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.post('/', async (req, res) => {
  try {
    const note = await AdminNote.create(req.body);
    res.status(201).json(note);
  } catch (error) { res.status(400).json({ message: error.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const note = await AdminNote.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json(note);
  } catch (error) { res.status(400).json({ message: error.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const note = await AdminNote.findByIdAndDelete(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json({ message: 'Note deleted successfully' });
  } catch (error) { res.status(400).json({ message: error.message }); }
});

module.exports = router;

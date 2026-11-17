const express = require('express');
const Appointment = require('../models/Appointment');
const requireAdmin = require('../middleware/adminAuth');

const router = express.Router();

router.use(requireAdmin);

router.get('/', async (req, res) => {
  try {
    const { search = '', status, from, to } = req.query;
    const query = {};
    if (search) query.$or = [
      { customerName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { purpose: { $regex: search, $options: 'i' } }
    ];
    if (status) query.status = status;
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(`${from}T00:00:00`);
      if (to) query.date.$lte = new Date(`${to}T23:59:59`);
    }
    const appointments = await Appointment.find(query).sort({ date: 1, time: 1 });
    res.json(appointments);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json(appointment);
  } catch (error) { res.status(400).json({ message: error.message }); }
});

router.post('/', async (req, res) => {
  try {
    const appointment = await Appointment.create(req.body);
    res.status(201).json(appointment);
  } catch (error) { res.status(400).json({ message: error.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json(appointment);
  } catch (error) { res.status(400).json({ message: error.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) { res.status(400).json({ message: error.message }); }
});

module.exports = router;

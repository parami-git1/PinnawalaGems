const express = require('express');
const Appointment = require('../models/Appointment');
const requireAdmin = require('../middleware/adminAuth');
const { plannerPayload, plannerQuery } = require('../utils/plannerFields');
const { objectId, routeError } = require('../utils/catalogData');

const router = express.Router();

router.use(requireAdmin);

router.get('/', async (req, res) => {
  try {
    const query = plannerQuery(req.query, 'appointment');
    const appointments = await Appointment.find(query).sort({ date: 1, time: 1 });
    res.json(appointments);
  } catch (error) { routeError(res, error); }
});

router.get('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(objectId(req.params.id));
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json(appointment);
  } catch (error) { routeError(res, error); }
});

router.post('/', async (req, res) => {
  try {
    const appointment = await Appointment.create(plannerPayload(req.body, 'appointment'));
    res.status(201).json(appointment);
  } catch (error) { routeError(res, error); }
});

router.put('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(objectId(req.params.id), { $set: plannerPayload(req.body, 'appointment') }, { new: true, runValidators: true });
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json(appointment);
  } catch (error) { routeError(res, error); }
});

router.delete('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(objectId(req.params.id));
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) { routeError(res, error); }
});

module.exports = router;

const express = require('express');
const Appointment = require('../models/Appointment');
const AdminNote = require('../models/AdminNote');
const requireAdmin = require('../middleware/adminAuth');

const router = express.Router();
router.use(requireAdmin);

router.get('/notifications', async (req, res) => {
  try {
    const now = new Date();
    // Sri Lanka uses UTC+05:30. Calendar windows must not depend on the host's
    // timezone (production hosts commonly use UTC).
    const dayMilliseconds = 24 * 60 * 60 * 1000;
    const sriLankaOffset = (5 * 60 + 30) * 60 * 1000;
    const sriLankaNow = new Date(now.getTime() + sriLankaOffset);
    const midnight = Date.UTC(sriLankaNow.getUTCFullYear(), sriLankaNow.getUTCMonth(), sriLankaNow.getUTCDate()) - sriLankaOffset;
    const startOfDay = new Date(midnight);
    const endOfDay = new Date(midnight + dayMilliseconds - 1);
    const nextWeek = new Date(endOfDay.getTime() + 7 * dayMilliseconds);

    const [todayAppointments, dueNotes, upcomingNotes] = await Promise.all([
      Appointment.find({ date: { $gte: startOfDay, $lte: endOfDay }, status: { $nin: ['Cancelled', 'No-show'] } }).sort({ time: 1 }),
      AdminNote.find({ isArchived: false, reminderAt: { $ne: null, $lte: endOfDay } }).sort({ reminderAt: 1 }),
      AdminNote.find({ isArchived: false, reminderAt: { $gt: endOfDay, $lte: nextWeek } }).sort({ reminderAt: 1 })
    ]);

    res.json({ todayAppointments, dueNotes, upcomingNotes, counts: { todayAppointments: todayAppointments.length, dueNotes: dueNotes.length, upcomingNotes: upcomingNotes.length } });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;

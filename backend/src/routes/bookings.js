const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// All booking routes require authentication
router.use(authMiddleware);

// POST /api/bookings — Reserve a ticket (any authenticated user: STUDENT, ORGANIZER, ADMIN)
router.post(
  '/',
  roleMiddleware('STUDENT', 'ORGANIZER', 'ADMIN'),
  bookingController.createBooking
);

// GET /api/bookings/my-bookings — Fetch all bookings for the logged-in user
router.get('/my-bookings', bookingController.getMyBookings);

// DELETE /api/bookings/:id — Cancel a booking (booking owner only)
router.delete('/:id', bookingController.cancelBooking);

// POST /api/bookings/verify — QR ticket verification (requires ORGANIZER or ADMIN role)
router.post(
  '/verify',
  roleMiddleware('ORGANIZER', 'ADMIN'),
  bookingController.verifyTicket
);

module.exports = router;

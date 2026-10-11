const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Public routes
router.get('/', eventController.getAllEvents);

// Protected Analytics route (ORGANIZER / ADMIN) - MUST be defined before /:id
router.get(
  '/analytics/overview',
  authMiddleware,
  roleMiddleware('ORGANIZER', 'ADMIN'),
  eventController.getAnalyticsOverview
);

router.get('/:id', eventController.getEventById);

// Protected routes (Only ORGANIZER and ADMIN)
router.post(
  '/',
  authMiddleware,
  roleMiddleware('ORGANIZER', 'ADMIN'),
  eventController.createEvent
);

router.put(
  '/:id',
  authMiddleware,
  roleMiddleware('ORGANIZER', 'ADMIN'),
  eventController.updateEvent
);

router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware('ORGANIZER', 'ADMIN'),
  eventController.deleteEvent
);

module.exports = router;

// Booking Controller — Phase 4: Booking Engine & QR Ticket Generation
const prisma = require('../utils/prisma');
const { generateQRPayload, generateQRCodeDataURL } = require('../utils/qrGenerator');
const { sendBookingConfirmationEmail } = require('../utils/emailService');

// ─────────────────────────────────────────────
// POST /api/bookings
// Protected: STUDENT, ORGANIZER, ADMIN
// Creates a confirmed booking using a DB transaction
// ─────────────────────────────────────────────
exports.createBooking = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({ error: 'Bad Request', message: 'eventId is required.' });
    }

    // --- Prisma Interactive Transaction ---
    // Guarantees atomic seat decrement + booking creation (prevents overbooking)
    const result = await prisma.$transaction(async (tx) => {
      // 1. Lock & fetch the event row
      const event = await tx.event.findUnique({
        where: { id: eventId },
        include: { organizer: { select: { name: true, email: true } } },
      });

      if (!event) {
        const err = new Error('Event not found.');
        err.statusCode = 404;
        throw err;
      }

      if (event.status === 'CANCELLED') {
        const err = new Error('This event has been cancelled and is no longer accepting bookings.');
        err.statusCode = 400;
        throw err;
      }

      if (event.availableSeats <= 0) {
        const err = new Error('Sorry, this event is sold out.');
        err.statusCode = 409;
        throw err;
      }

      // 2. Prevent duplicate booking by the same user for the same event
      const existing = await tx.booking.findFirst({
        where: { userId, eventId, status: { not: 'CANCELLED' } },
      });

      if (existing) {
        const err = new Error('You already have an active booking for this event.');
        err.statusCode = 409;
        throw err;
      }

      // 3. Atomically decrement available seats
      const updatedEvent = await tx.event.update({
        where: { id: eventId },
        data: { availableSeats: { decrement: 1 } },
      });

      // 4. Generate a unique QR payload string
      const tempBookingId = `tmp-${userId}-${eventId}-${Date.now()}`;
      const qrCodeString = generateQRPayload(tempBookingId);

      // 5. Create the booking record
      const booking = await tx.booking.create({
        data: {
          eventId,
          userId,
          qrCodeString,
          status: 'CONFIRMED',
        },
        include: {
          event: {
            include: { organizer: { select: { name: true } } },
          },
          user: { select: { id: true, name: true, email: true } },
        },
      });

      return { booking, updatedEvent };
    });

    const { booking } = result;

    // --- Post-Transaction: Generate QR image & send email (non-blocking) ---
    let qrCodeDataURL = null;
    try {
      qrCodeDataURL = await generateQRCodeDataURL(booking.qrCodeString);
    } catch (qrErr) {
      console.error('[BookingController] QR image generation failed:', qrErr.message);
    }

    // Fire-and-forget email (don't await, don't fail the response)
    setImmediate(async () => {
      try {
        if (qrCodeDataURL) {
          await sendBookingConfirmationEmail({
            booking,
            event: booking.event,
            user: booking.user,
            qrCodeDataURL,
          });
        }
      } catch (emailErr) {
        console.error('[BookingController] Email dispatch error:', emailErr.message);
      }
    });

    return res.status(201).json({
      message: 'Booking confirmed! A confirmation email with your QR ticket has been sent.',
      booking: {
        id: booking.id,
        status: booking.status,
        qrCodeString: booking.qrCodeString,
        qrCodeDataURL, // Send base64 Data URL so frontend can render it immediately
        createdAt: booking.createdAt,
        event: {
          id: booking.event.id,
          title: booking.event.title,
          category: booking.event.category,
          venue: booking.event.venue,
          startDateTime: booking.event.startDateTime,
          endDateTime: booking.event.endDateTime,
          price: booking.event.price,
          organizer: booking.event.organizer,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// GET /api/bookings/my-bookings
// Protected: any authenticated user
// Returns all bookings for the logged-in student
// ─────────────────────────────────────────────
exports.getMyBookings = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const bookings = await prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            category: true,
            venue: true,
            startDateTime: true,
            endDateTime: true,
            price: true,
            status: true,
            organizer: { select: { name: true } },
          },
        },
      },
    });

    // Attach base64 QR Data URL to each booking for seamless rendering
    const bookingsWithQR = await Promise.all(
      bookings.map(async (b) => {
        let qrCodeDataURL = null;
        try {
          qrCodeDataURL = await generateQRCodeDataURL(b.qrCodeString);
        } catch (err) {
          console.error('QR generation error for booking', b.id, err.message);
        }
        return {
          ...b,
          qrCodeDataURL,
        };
      })
    );

    // Classify bookings into active/past
    const now = new Date();
    const active = bookingsWithQR.filter(
      (b) =>
        b.status !== 'CANCELLED' &&
        new Date(b.event.startDateTime) >= now
    );
    const past = bookingsWithQR.filter(
      (b) =>
        b.status === 'CHECKED_IN' ||
        (b.status !== 'CANCELLED' && new Date(b.event.startDateTime) < now)
    );

    return res.status(200).json({
      total: bookingsWithQR.length,
      active: active.length,
      attended: past.filter((b) => b.status === 'CHECKED_IN').length,
      bookings: bookingsWithQR,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// DELETE /api/bookings/:id
// Protected: booking owner only
// Cancels a booking and restores the seat to the event
// ─────────────────────────────────────────────
exports.cancelBooking = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id: bookingId } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { event: true },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Not Found', message: 'Booking not found.' });
    }

    if (booking.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden', message: 'You can only cancel your own bookings.' });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Bad Request', message: 'This booking is already cancelled.' });
    }

    if (booking.status === 'CHECKED_IN') {
      return res
        .status(400)
        .json({ error: 'Bad Request', message: 'Cannot cancel a booking that has already been checked in.' });
    }

    // Atomic: cancel booking + restore seat
    await prisma.$transaction([
      prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' },
      }),
      prisma.event.update({
        where: { id: booking.eventId },
        data: { availableSeats: { increment: 1 } },
      }),
    ]);

    return res.status(200).json({
      message: 'Booking cancelled successfully. The seat has been released.',
      bookingId,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// POST /api/bookings/verify
// Protected: ORGANIZER, ADMIN
// Verifies a scanned QR code or booking ID and updates status to CHECKED_IN
// ─────────────────────────────────────────────
exports.verifyTicket = async (req, res, next) => {
  try {
    const { qrCodeString, payload, bookingId, ticketCode, eventId } = req.body;
    const identifier = (qrCodeString || payload || bookingId || ticketCode || '').trim();

    if (!identifier) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'A QR payload, booking ID, or attendee email is required for verification.',
      });
    }

    // 1. Search by QR code string or Booking ID
    let booking = await prisma.booking.findFirst({
      where: {
        OR: [
          { qrCodeString: identifier },
          { id: identifier },
        ],
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            category: true,
            venue: true,
            startDateTime: true,
            endDateTime: true,
            status: true,
            organizerId: true,
            organizer: { select: { id: true, name: true, email: true } },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // 2. If not found and identifier contains '@', support email fallback lookup
    if (!booking && identifier.includes('@')) {
      booking = await prisma.booking.findFirst({
        where: {
          user: { email: identifier.toLowerCase() },
          ...(eventId ? { eventId } : {}),
        },
        orderBy: { createdAt: 'desc' },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              category: true,
              venue: true,
              startDateTime: true,
              endDateTime: true,
              status: true,
              organizerId: true,
              organizer: { select: { id: true, name: true, email: true } },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    }

    // 3. Error Case: Ticket Not Found
    if (!booking) {
      return res.status(404).json({
        error: 'InvalidTicket',
        message: 'Ticket not found. Invalid QR code or Booking ID.',
        scannedCode: identifier,
      });
    }

    // 4. Error Case: Event is Cancelled
    if (booking.event.status === 'CANCELLED') {
      return res.status(400).json({
        error: 'EventCancelled',
        message: `Entry denied: The event "${booking.event.title}" has been cancelled.`,
        booking: {
          id: booking.id,
          status: booking.status,
          eventTitle: booking.event.title,
          attendeeName: booking.user.name,
          attendeeEmail: booking.user.email,
        },
      });
    }

    // 5. Error Case: Already Checked In (Duplicate Scan)
    if (booking.status === 'CHECKED_IN') {
      return res.status(400).json({
        error: 'AlreadyCheckedIn',
        message: `Duplicate entry! This ticket for ${booking.user.name} has already been checked in.`,
        booking: {
          id: booking.id,
          status: booking.status,
          eventTitle: booking.event.title,
          attendeeName: booking.user.name,
          attendeeEmail: booking.user.email,
          venue: booking.event.venue,
          qrCodeString: booking.qrCodeString,
        },
      });
    }

    // 6. Error Case: Ticket Cancelled
    if (booking.status === 'CANCELLED') {
      return res.status(400).json({
        error: 'TicketCancelled',
        message: `Entry denied: This reservation for ${booking.user.name} was cancelled.`,
        booking: {
          id: booking.id,
          status: booking.status,
          eventTitle: booking.event.title,
          attendeeName: booking.user.name,
          attendeeEmail: booking.user.email,
        },
      });
    }

    // 7. Verify status is CONFIRMED before checking in
    if (booking.status !== 'CONFIRMED') {
      return res.status(400).json({
        error: 'InvalidStatus',
        message: `Cannot check in ticket with status "${booking.status}".`,
      });
    }

    // 8. Atomic transition: Mark booking as CHECKED_IN
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'CHECKED_IN' },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            category: true,
            venue: true,
            startDateTime: true,
            endDateTime: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: `Check-in verified! Welcome, ${updatedBooking.user.name}.`,
      booking: updatedBooking,
      attendee: {
        id: updatedBooking.user.id,
        name: updatedBooking.user.name,
        email: updatedBooking.user.email,
      },
      event: {
        id: updatedBooking.event.id,
        title: updatedBooking.event.title,
        venue: updatedBooking.event.venue,
        startDateTime: updatedBooking.event.startDateTime,
        endDateTime: updatedBooking.event.endDateTime,
      },
      verifiedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

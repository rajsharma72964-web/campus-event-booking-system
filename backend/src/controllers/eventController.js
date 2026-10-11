const prisma = require('../utils/prisma');

// GET /api/events - Public list with search, category filtering & pagination
exports.getAllEvents = async (req, res, next) => {
  try {
    const { search, category, organizerId, status, page = 1, limit = 12 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const take = Math.max(1, Math.min(100, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * take;

    const where = {};

    // Filter by search query in title or description
    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search.trim() } },
        { description: { contains: search.trim() } },
        { venue: { contains: search.trim() } },
      ];
    }

    // Filter by category
    if (category && category !== 'All' && category !== 'all') {
      where.category = { equals: category.trim() };
    }

    // Filter by organizer (for organizer dashboard)
    if (organizerId) {
      where.organizerId = organizerId;
    }

    // Filter by status (default to PUBLISHED for public feed unless explicitly requested or querying by organizer)
    if (status) {
      where.status = status;
    } else if (!organizerId) {
      where.status = 'PUBLISHED';
    }

    const [total, events] = await Promise.all([
      prisma.event.count({ where }),
      prisma.event.findMany({
        where,
        skip,
        take,
        orderBy: { startDateTime: 'asc' },
        include: {
          organizer: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: { bookings: true }
          }
        }
      })
    ]);

    return res.status(200).json({
      events,
      pagination: {
        total,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/events/:id - Public event details
exports.getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: {
          select: { id: true, name: true, email: true }
        },
        reviews: {
          include: {
            user: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { bookings: true }
        }
      }
    });

    if (!event) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'The requested event does not exist.'
      });
    }

    return res.status(200).json({ event });
  } catch (error) {
    next(error);
  }
};

// POST /api/events - Protected (ORGANIZER / ADMIN)
exports.createEvent = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      venue,
      startDateTime,
      endDateTime,
      capacity,
      price = 0,
      status = 'PUBLISHED'
    } = req.body;

    // Field validations
    if (!title || !description || !category || !venue || !startDateTime || !endDateTime || capacity === undefined) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Missing required fields: title, description, category, venue, startDateTime, endDateTime, capacity.'
      });
    }

    const parsedCapacity = parseInt(capacity, 10);
    if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Capacity must be a positive number greater than 0.'
      });
    }

    const parsedStart = new Date(startDateTime);
    const parsedEnd = new Date(endDateTime);

    if (isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime())) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Invalid startDateTime or endDateTime format.'
      });
    }

    if (parsedEnd <= parsedStart) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'End date/time must be strictly after start date/time.'
      });
    }

    const parsedPrice = parseFloat(price) || 0.0;
    if (parsedPrice < 0) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Price cannot be negative.'
      });
    }

    // Default availableSeats matches total capacity
    const event = await prisma.event.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        venue: venue.trim(),
        startDateTime: parsedStart,
        endDateTime: parsedEnd,
        capacity: parsedCapacity,
        availableSeats: parsedCapacity,
        price: parsedPrice,
        status: status || 'PUBLISHED',
        organizerId: req.user.id
      },
      include: {
        organizer: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return res.status(201).json({
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/events/:id - Protected (ORGANIZER who owns event or ADMIN)
exports.updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingEvent = await prisma.event.findUnique({
      where: { id },
      include: {
        _count: { select: { bookings: true } }
      }
    });

    if (!existingEvent) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Event not found.'
      });
    }

    // Verify ownership or ADMIN role
    if (req.user.role !== 'ADMIN' && existingEvent.organizerId !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are not authorized to modify this event.'
      });
    }

    const {
      title,
      description,
      category,
      venue,
      startDateTime,
      endDateTime,
      capacity,
      price,
      status
    } = req.body;

    const updateData = {};

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (category !== undefined) updateData.category = category.trim();
    if (venue !== undefined) updateData.venue = venue.trim();
    if (status !== undefined) updateData.status = status;

    if (startDateTime !== undefined) {
      const parsedStart = new Date(startDateTime);
      if (isNaN(parsedStart.getTime())) {
        return res.status(400).json({ error: 'BadRequest', message: 'Invalid startDateTime.' });
      }
      updateData.startDateTime = parsedStart;
    }

    if (endDateTime !== undefined) {
      const parsedEnd = new Date(endDateTime);
      if (isNaN(parsedEnd.getTime())) {
        return res.status(400).json({ error: 'BadRequest', message: 'Invalid endDateTime.' });
      }
      updateData.endDateTime = parsedEnd;
    }

    // Check date consistency
    const effectiveStart = updateData.startDateTime || existingEvent.startDateTime;
    const effectiveEnd = updateData.endDateTime || existingEvent.endDateTime;
    if (effectiveEnd <= effectiveStart) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'End date/time must be strictly after start date/time.'
      });
    }

    if (price !== undefined) {
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({ error: 'BadRequest', message: 'Price must be 0 or a positive number.' });
      }
      updateData.price = parsedPrice;
    }

    // Handle capacity change & maintain availableSeats
    if (capacity !== undefined) {
      const newCapacity = parseInt(capacity, 10);
      if (isNaN(newCapacity) || newCapacity <= 0) {
        return res.status(400).json({ error: 'BadRequest', message: 'Capacity must be greater than 0.' });
      }

      const bookedCount = existingEvent.capacity - existingEvent.availableSeats;
      if (newCapacity < bookedCount) {
        return res.status(400).json({
          error: 'BadRequest',
          message: `Cannot reduce capacity to ${newCapacity}. There are already ${bookedCount} seats booked.`
        });
      }

      updateData.capacity = newCapacity;
      updateData.availableSeats = newCapacity - bookedCount;
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        organizer: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return res.status(200).json({
      message: 'Event updated successfully',
      event: updatedEvent
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/events/:id - Protected (ORGANIZER who owns event or ADMIN)
exports.deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingEvent = await prisma.event.findUnique({
      where: { id },
      include: {
        _count: { select: { bookings: true } }
      }
    });

    if (!existingEvent) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Event not found.'
      });
    }

    if (req.user.role !== 'ADMIN' && existingEvent.organizerId !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are not authorized to delete or cancel this event.'
      });
    }

    // If bookings already exist, soft-cancel to preserve audit trail
    if (existingEvent._count.bookings > 0) {
      const cancelledEvent = await prisma.event.update({
        where: { id },
        data: { status: 'CANCELLED' }
      });
      return res.status(200).json({
        message: 'Event has active bookings and has been marked as CANCELLED.',
        event: cancelledEvent
      });
    }

    // Otherwise, safely hard delete the unreserved event
    await prisma.event.delete({
      where: { id }
    });

    return res.status(200).json({
      message: 'Event deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// GET /api/events/analytics/overview
// Protected: ORGANIZER, ADMIN
// Aggregates sales, capacity, check-in conversion, and event performance breakdown
// ─────────────────────────────────────────────
exports.getAnalyticsOverview = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role === 'ADMIN';
    const filterOrganizerId = req.query.organizerId;

    // Admins can view all or filter by organizer; Organizers only view their own
    const where = {};
    if (!isSuperAdmin) {
      where.organizerId = req.user.id;
    } else if (filterOrganizerId) {
      where.organizerId = filterOrganizerId;
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { startDateTime: 'asc' },
      include: {
        bookings: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    let totalCapacity = 0;
    let totalTicketsSold = 0;
    let totalCheckedIn = 0;
    let totalConfirmed = 0;
    let totalCancelled = 0;
    let totalRevenue = 0;

    const categoryMap = {};

    const eventBreakdown = events.map((ev) => {
      const capacity = ev.capacity || 0;
      const available = ev.availableSeats || 0;
      const booked = Math.max(0, capacity - available);
      const price = ev.price || 0;

      let evCheckedIn = 0;
      let evConfirmed = 0;
      let evCancelled = 0;

      ev.bookings.forEach((b) => {
        if (b.status === 'CHECKED_IN') evCheckedIn++;
        else if (b.status === 'CONFIRMED') evConfirmed++;
        else if (b.status === 'CANCELLED') evCancelled++;
      });

      const activeBookings = evCheckedIn + evConfirmed;
      const occupancyRate = capacity > 0 ? Math.min(100, Math.round((booked / capacity) * 100)) : 0;
      const conversionRate = activeBookings > 0 ? Math.min(100, Math.round((evCheckedIn / activeBookings) * 100)) : 0;
      const revenue = booked * price;

      totalCapacity += capacity;
      totalTicketsSold += booked;
      totalCheckedIn += evCheckedIn;
      totalConfirmed += evConfirmed;
      totalCancelled += evCancelled;
      totalRevenue += revenue;

      // Group by category
      if (!categoryMap[ev.category]) {
        categoryMap[ev.category] = { category: ev.category, eventsCount: 0, ticketsSold: 0, revenue: 0 };
      }
      categoryMap[ev.category].eventsCount++;
      categoryMap[ev.category].ticketsSold += booked;
      categoryMap[ev.category].revenue += revenue;

      return {
        id: ev.id,
        title: ev.title,
        category: ev.category,
        venue: ev.venue,
        status: ev.status,
        startDateTime: ev.startDateTime,
        endDateTime: ev.endDateTime,
        capacity,
        availableSeats: available,
        price,
        ticketsSold: booked,
        checkedInCount: evCheckedIn,
        confirmedCount: evConfirmed,
        cancelledCount: evCancelled,
        occupancyRate,
        conversionRate,
        revenue,
      };
    });

    const activeTicketsTotal = totalCheckedIn + totalConfirmed;
    const overallCheckInRate =
      activeTicketsTotal > 0 ? Math.min(100, Math.round((totalCheckedIn / activeTicketsTotal) * 100)) : 0;
    const overallOccupancyRate =
      totalCapacity > 0 ? Math.min(100, Math.round((totalTicketsSold / totalCapacity) * 100)) : 0;

    // Format category distribution for charts
    const categoryDistribution = Object.values(categoryMap);

    // Format attendance comparison for bar/pie charts
    const attendanceSummary = [
      { name: 'Checked In', value: totalCheckedIn, color: '#10B981' },
      { name: 'Pending / Confirmed', value: totalConfirmed, color: '#6366F1' },
      { name: 'Cancelled', value: totalCancelled, color: '#64748B' },
    ];

    return res.status(200).json({
      summary: {
        totalEvents: events.length,
        totalCapacity,
        totalTicketsSold,
        totalCheckedIn,
        totalConfirmed,
        totalCancelled,
        totalRevenue,
        overallCheckInRate,
        overallOccupancyRate,
      },
      attendanceSummary,
      categoryDistribution,
      eventBreakdown,
    });
  } catch (error) {
    next(error);
  }
};


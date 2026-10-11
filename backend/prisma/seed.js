const bcrypt = require('bcryptjs');
const prisma = require('../src/utils/prisma');

async function main() {
  console.log('Seeding database with initial events and organizers...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Ensure Demo Organizer
  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@campus.edu' },
    update: {},
    create: {
      name: 'Campus Event Board',
      email: 'organizer@campus.edu',
      passwordHash,
      role: 'ORGANIZER'
    }
  });

  // 2. Ensure Demo Student
  await prisma.user.upsert({
    where: { email: 'student@campus.edu' },
    update: {},
    create: {
      name: 'Jordan Lee',
      email: 'student@campus.edu',
      passwordHash,
      role: 'STUDENT'
    }
  });

  const now = new Date();

  const eventsData = [
    {
      title: 'Annual Campus Hackathon: Build the Future with AI',
      description: 'Join over 100 students for 36 hours of rapid product design, live mentoring from tech leaders, free food, and $5,000 in grand prize awards.',
      category: 'Technology',
      venue: 'Computer Science Innovation Hub - Hall A',
      startDateTime: new Date(now.getTime() + 86400000 * 3), // 3 days from now
      endDateTime: new Date(now.getTime() + 86400000 * 5),
      capacity: 120,
      availableSeats: 94,
      price: 0.0,
      status: 'PUBLISHED',
      organizerId: organizer.id
    },
    {
      title: 'Spring Acoustic Festival & Artisan Market',
      description: 'An evening of live student band performances, local coffee roasters, food trucks, and artisan crafts under the starlit quad.',
      category: 'Cultural',
      venue: 'Main Campus Quad Amphitheater',
      startDateTime: new Date(now.getTime() + 86400000 * 7),
      endDateTime: new Date(now.getTime() + 86400000 * 7 + 21600000),
      capacity: 300,
      availableSeats: 180,
      price: 5.0,
      status: 'PUBLISHED',
      organizerId: organizer.id
    },
    {
      title: 'Inter-College Basketball Championship Finals',
      description: 'The biggest rivalry game of the semester. Cheer on the home team in the championship showdown with live half-time entertainment.',
      category: 'Sports',
      venue: 'University Athletic Arena',
      startDateTime: new Date(now.getTime() + 86400000 * 10),
      endDateTime: new Date(now.getTime() + 86400000 * 10 + 10800000),
      capacity: 500,
      availableSeats: 112,
      price: 8.0,
      status: 'PUBLISHED',
      organizerId: organizer.id
    },
    {
      title: 'Quantum Foundations & Deep Learning Colloquium',
      description: 'Guest lecture and panel discussion by visiting scientists on quantum hardware breakthroughs and modern transformer architectures.',
      category: 'Academic',
      venue: 'Science Complex - Auditorium 101',
      startDateTime: new Date(now.getTime() + 86400000 * 14),
      endDateTime: new Date(now.getTime() + 86400000 * 14 + 14400000),
      capacity: 90,
      availableSeats: 25,
      price: 0.0,
      status: 'PUBLISHED',
      organizerId: organizer.id
    },
    {
      title: 'Student Founders & Tech Venture Mixer',
      description: 'Connect with prospective co-founders, alumni angel investors, and venture scouts. Speed networking followed by open pitches.',
      category: 'Social',
      venue: 'Student Union Sky Lounge',
      startDateTime: new Date(now.getTime() + 86400000 * 18),
      endDateTime: new Date(now.getTime() + 86400000 * 18 + 10800000),
      capacity: 75,
      availableSeats: 18,
      price: 0.0,
      status: 'PUBLISHED',
      organizerId: organizer.id
    }
  ];

  for (const eventData of eventsData) {
    const existing = await prisma.event.findFirst({
      where: { title: eventData.title }
    });
    if (!existing) {
      await prisma.event.create({ data: eventData });
      console.log(`Created event: ${eventData.title}`);
    }
  }

  console.log('Seeding completed successfully.');
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { seedDatabase: main };

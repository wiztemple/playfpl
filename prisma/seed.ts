// /prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create sample leagues
  const league1 = await prisma.weeklyLeague.create({
    data: {
      name: 'Gameweek 30 Cash League',
      gameweek: 30,
      entryFee: 10,
      maxParticipants: 100,
      currentParticipants: 0,
      status: 'upcoming',
      startDate: new Date('2025-03-29T15:00:00Z'),
      endDate: new Date('2025-03-31T21:00:00Z'),
      platformFeePercentage: 10,
      minParticipantsRequired: 3,
      tiebreaker: 'goals_scored',
      prizeDistribution: {
        create: [
          { position: 1, percentageShare: 50 },
          { position: 2, percentageShare: 30 },
          { position: 3, percentageShare: 20 }
        ]
      }
    }
  });

  console.log('Seed data created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
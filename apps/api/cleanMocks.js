const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function cleanMockData() {
  console.log("Locating mock users to delete...");

  const mockUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { endsWith: "@example.com" } },
        { email: { endsWith: "@test.com" } },
      ],
    },
  });

  const userIds = mockUsers.map(u => u.id);

  if (userIds.length === 0) {
    console.log("No mock users found.");
    process.exit(0);
  }

  console.log(`Found ${userIds.length} mock users. Deleting associated records...`);

  await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.review.deleteMany({ where: { OR: [{ authorId: { in: userIds } }, { targetId: { in: userIds } }] } });
  await prisma.booking.deleteMany({ where: { OR: [{ hostId: { in: userIds } }, { guestId: { in: userIds } }] } });
  await prisma.message.deleteMany({ where: { senderId: { in: userIds } } });
  await prisma.userSkill.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.match.deleteMany({ where: { OR: [{ requestedById: { in: userIds } }, { requestedToId: { in: userIds } }] } });
  await prisma.refreshToken.deleteMany({ where: { userId: { in: userIds } } });

  await prisma.user.deleteMany({ where: { id: { in: userIds } } });

  console.log("Mock data successfully deleted.");
}

cleanMockData()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

import { PrismaClient, Role, SkillType, MatchStatus } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.message.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.review.deleteMany();
  await prisma.match.deleteMany();
  await prisma.userSkill.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 12);

  // 1. Create Skills
  const jsSkill = await prisma.skill.create({ data: { name: "JavaScript", category: "Programming" } });
  const reactSkill = await prisma.skill.create({ data: { name: "React", category: "Programming" } });
  const pythonSkill = await prisma.skill.create({ data: { name: "Python", category: "Programming" } });
  const spanishSkill = await prisma.skill.create({ data: { name: "Spanish", category: "Languages" } });
  const designSkill = await prisma.skill.create({ data: { name: "UI/UX Design", category: "Design" } });
  const guitarSkill = await prisma.skill.create({ data: { name: "Guitar", category: "Music" } });

  // 2. Create Users
  const alice = await prisma.user.create({
    data: {
      email: "alice@example.com",
      passwordHash,
      name: "Alice Johnson",
      bio: "Full-stack developer looking to learn Spanish and Guitar.",
      location: "San Francisco, CA",
      timezone: "UTC-8",
      isVerified: true,
      role: Role.USER,
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: "bob@example.com",
      passwordHash,
      name: "Bob Smith",
      bio: "Native Spanish speaker & guitarist. Wanting to learn React and Python.",
      location: "Austin, TX",
      timezone: "UTC-6",
      isVerified: true,
      role: Role.USER,
    },
  });

  const charlie = await prisma.user.create({
    data: {
      email: "charlie@example.com",
      passwordHash,
      name: "Charlie Davis",
      bio: "UI/UX Designer eager to master JavaScript.",
      location: "Seattle, WA",
      timezone: "UTC-8",
      isVerified: true,
      role: Role.USER,
    },
  });

  // 3. Assign User Skills
  // Alice teaches React & JS, wants to learn Spanish & Guitar
  await prisma.userSkill.create({ data: { userId: alice.id, skillId: reactSkill.id, type: SkillType.TEACH, level: 5 } });
  await prisma.userSkill.create({ data: { userId: alice.id, skillId: jsSkill.id, type: SkillType.TEACH, level: 4 } });
  await prisma.userSkill.create({ data: { userId: alice.id, skillId: spanishSkill.id, type: SkillType.LEARN } });
  await prisma.userSkill.create({ data: { userId: alice.id, skillId: guitarSkill.id, type: SkillType.LEARN } });

  // Bob teaches Spanish & Guitar, wants to learn React & Python
  await prisma.userSkill.create({ data: { userId: bob.id, skillId: spanishSkill.id, type: SkillType.TEACH, level: 5 } });
  await prisma.userSkill.create({ data: { userId: bob.id, skillId: guitarSkill.id, type: SkillType.TEACH, level: 4 } });
  await prisma.userSkill.create({ data: { userId: bob.id, skillId: reactSkill.id, type: SkillType.LEARN } });
  await prisma.userSkill.create({ data: { userId: bob.id, skillId: pythonSkill.id, type: SkillType.LEARN } });

  // Charlie teaches UI/UX Design, wants to learn JS
  await prisma.userSkill.create({ data: { userId: charlie.id, skillId: designSkill.id, type: SkillType.TEACH, level: 5 } });
  await prisma.userSkill.create({ data: { userId: charlie.id, skillId: jsSkill.id, type: SkillType.LEARN } });

  // 4. Create an ACCEPTED Match between Alice & Bob
  const matchAB = await prisma.match.create({
    data: {
      requestedById: alice.id,
      requestedToId: bob.id,
      status: MatchStatus.ACCEPTED,
      matchScore: 0.95,
    },
  });

  // 5. Seed Messages between Alice & Bob
  await prisma.message.create({
    data: {
      matchId: matchAB.id,
      senderId: alice.id,
      content: "Hi Bob! excited to exchange React for Spanish lessons!",
    },
  });

  await prisma.message.create({
    data: {
      matchId: matchAB.id,
      senderId: bob.id,
      content: "Hey Alice! That sounds great. When are you free to connect?",
    },
  });

  console.log("Database successfully seeded!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

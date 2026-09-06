# SkillBridge

SkillBridge is a peer-to-peer skill exchange platform where users can teach skills they know and learn skills they desire, fostering a community-driven learning environment.

## Local Setup

1. Clone the repository.
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Start the database and Redis:
   ```bash
   docker-compose up -d
   ```
4. Run Prisma migrations:
   ```bash
   cd apps/api
   npx prisma migrate dev --name init
   ```
5. Run the development servers:
   ```bash
   # In root
   pnpm dev
   ```

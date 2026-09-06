
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.booking.update({
  where: { id: '1582bcfe-9cd7-4c5b-858e-9d3ef6f284ed' },
  data: { status: 'COMPLETED' }
}).then(() => {
  console.log('OK');
  process.exit(0);
}).catch(console.error);


import { Queue, Worker } from "bullmq";
import { bookingsRepository } from "../modules/bookings/bookings.repository";
import { io } from "../sockets";

const redisConnection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
};

export const bookingQueue = new Queue("booking-auto-complete", {
  connection: redisConnection,
});

export const completeExpiredBookings = async () => {
  const confirmedBookings = await bookingsRepository.findConfirmedBookingsToComplete();
  const now = new Date();
  const completedBookings: any[] = [];

  for (const booking of confirmedBookings) {
    const scheduledAtTime = new Date(booking.scheduledAt).getTime();
    const durationMs = (booking.durationMin || 60) * 60 * 1000;
    const endTime = scheduledAtTime + durationMs;

    if (now.getTime() >= endTime) {
      const updated = await bookingsRepository.updateBookingStatus(booking.id, "COMPLETED");
      completedBookings.push(updated);

      if (io) {
        io.to(booking.hostId).to(booking.guestId).emit("booking:update", updated);
      }
    }
  }

  return completedBookings;
};

export const bookingWorker = new Worker(
  "booking-auto-complete",
  async () => {
    return completeExpiredBookings();
  },
  { connection: redisConnection }
);

export const initBookingAutoCompleteJob = async () => {
  try {
    await bookingQueue.add(
      "check-expired-bookings",
      {},
      {
        repeat: {
          every: 5 * 60 * 1000, // Every 5 minutes
        },
      }
    );
    console.log("BullMQ booking auto-complete job registered successfully.");
  } catch (err) {
    console.error("Failed to register BullMQ booking auto-complete job:", err);
  }
};

import { notificationsRepository } from "./notifications.repository";
import { io } from "../../sockets";
import { sendEmail } from "../../utils/email";

export const notificationsService = {
  createNotification: async (userId: string, type: "NEW_MATCH" | "NEW_MESSAGE" | "BOOKING_UPDATE" | "NEW_REVIEW", payload: any) => {
    const notification = await notificationsRepository.createNotification(userId, type, payload);

    // 1. Emit real-time notification socket event
    if (io) {
      io.to(userId).emit("notification:new", notification);
    }

    // 2. Send email notification where applicable
    try {
      const recipient = await notificationsRepository.findUserEmail(userId);
      if (recipient?.email) {
        if (type === "NEW_MATCH") {
          await sendEmail({
            to: recipient.email,
            subject: "New Match Request on SkillBridge!",
            html: `<h3>Hello ${recipient.name},</h3><p>You have received a new match request on SkillBridge!</p>`,
            text: `Hello ${recipient.name}, you have received a new match request on SkillBridge!`,
          });
        } else if (type === "BOOKING_UPDATE") {
          await sendEmail({
            to: recipient.email,
            subject: `Session Booking Update: ${payload.status || "Updated"}`,
            html: `<h3>Hello ${recipient.name},</h3><p>Your session booking status has been updated to: <strong>${payload.status}</strong>.</p>`,
            text: `Hello ${recipient.name}, your session booking status has been updated to: ${payload.status}.`,
          });
        }
      }
    } catch (err) {
      console.error("Email notification dispatch error:", err);
    }

    return notification;
  },

  getNotifications: (userId: string, limit = 20, offset = 0) =>
    notificationsRepository.getUserNotifications(userId, limit, offset),

  markAsRead: (id: string, userId: string) =>
    notificationsRepository.markAsRead(id, userId),

  markAllAsRead: (userId: string) =>
    notificationsRepository.markAllAsRead(userId),
};

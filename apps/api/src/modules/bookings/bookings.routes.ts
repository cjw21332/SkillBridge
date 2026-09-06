import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { bookingsController } from "./bookings.controller";
import { reviewsController } from "../reviews/reviews.controller";
import { validate } from "../../middleware/validate.middleware";
import { ProposeBookingSchema, UpdateBookingSchema } from "@skillbridge/shared-types";

const router = Router();

router.use(authenticate);

router.get("/", bookingsController.getBookings);
router.post("/", validate(ProposeBookingSchema), bookingsController.proposeBooking);
router.patch("/:id", validate(UpdateBookingSchema), bookingsController.updateBookingStatus);
router.post("/:id/review", reviewsController.createReview);

export default router;

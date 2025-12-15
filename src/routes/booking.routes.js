import { Router } from "express";
import { authUser } from "../middlewares/auth.middleware.js";
import {
  checkAvailabilityApi,
  createBooking,
  getHotelBookings,
  getUserBookings,
  stripePayment,
} from "../controllers/booking.controller.js";

const router = Router();

router.route("/check-availability").post(checkAvailabilityApi);
router.route("/book").post(authUser, createBooking);
router.route("/user").get(authUser, getUserBookings);
router.route("/hotel").get(authUser, getHotelBookings);
router.route("/stripe-payment").post(authUser, stripePayment);

export default router;

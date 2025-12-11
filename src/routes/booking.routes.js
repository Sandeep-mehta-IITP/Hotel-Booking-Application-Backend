import { Router } from "express";
import { authUser } from "../middlewares/auth.middleware.js";
import {
  checkAvailabilityApi,
  createBooking,
  getHotelBookings,
  getUserBookings,
} from "../controllers/booking.controller.js";

const router = Router();

router.route("/check-availability").post(checkAvailabilityApi);
router.route("/book").post(authUser, createBooking);
router.route("/user").get(authUser, getUserBookings);
router.route("/hotel").get(authUser, getHotelBookings);

export default router;

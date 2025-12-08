import { Router } from "express";
import { authUser } from "../middlewares/auth.middleware.js";
import { registerHotel } from "../controllers/hotel.controller.js";


const router = Router();

router.route("/").post(authUser, registerHotel)

export default router;

import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { authUser } from "../middlewares/auth.middleware.js";
import {
  createRoom,
  getOwnerRooms,
  getRooms,
  toggleRoomAvailability,
} from "../controllers/room.controller.js";

const router = Router();

router.route("/").post(upload.array("images", 5), authUser, createRoom);
router.route("/").get(getRooms);
router.route("/owner").get(authUser, getOwnerRooms);
router.route("/toggle-availability").patch(authUser, toggleRoomAvailability);

export default router;

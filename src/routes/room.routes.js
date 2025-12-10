import { Router } from "express";
import {upload} from "../middlewares/multer.middleware.js"
import { authUser } from "../middlewares/auth.middleware.js";
import { createRoom } from "../controllers/room.controller.js";

const router = Router();

router.route("/").post(upload.array("images", 5), authUser, createRoom);
router.route("/")

export default router;


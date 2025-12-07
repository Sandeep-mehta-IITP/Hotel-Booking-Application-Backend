import { Router } from "express";
import clerkWebhooks from "../controllers/clerkWebHooks.controller.js";


const router = Router();

router.route("/webhook").post(clerkWebhooks)

export default router;
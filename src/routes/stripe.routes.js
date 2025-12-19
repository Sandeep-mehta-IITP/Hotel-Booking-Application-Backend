import { Router } from "express";
import { stripeWebhooks } from "../controllers/stripeWebhook.controller.js";

const router = Router();

router
  .route("/stripe")
  .post(stripeWebhooks);

export default router;

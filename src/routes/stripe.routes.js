import { Router } from "express";
import express from "express";
import { stripeWebhooks } from "../controllers/stripeWebhook.controller.js";

const router = Router();

router
  .route("/stripe")
  .post(express.raw({ type: "application/json" }), stripeWebhooks);

export default router;

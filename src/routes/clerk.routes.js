import { Router } from "express";
import express from "express";
import clerkWebhooks from "../controllers/clerkWebHooks.controller.js";


const router = Router();

router.route("/webhook").post(express.raw({ type: "application/json" }), clerkWebhooks)

export default router;
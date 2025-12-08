import { Router } from "express";
import { authUser } from "../middlewares/auth.middleware.js";
import {
  getUserData,
  recentlySearchedCitiesHandler,
} from "../controllers/user.controller.js";

const router = Router();

router.route("/").get(authUser, getUserData);
router
  .route("/recent-search-city")
  .post(authUser, recentlySearchedCitiesHandler);

export default router;

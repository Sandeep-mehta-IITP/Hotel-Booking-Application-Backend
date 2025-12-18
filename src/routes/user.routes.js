import { Router } from "express";
import { authUser } from "../middlewares/auth.middleware.js";
import {
  getUserData,
  loginUser,
  logoutUser,
  recentlySearchedCitiesHandler,
  refreshAccessToken,
  registerUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/register").post(upload.single("image"), registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(authUser, logoutUser);
router.route("/refresh-access-token").post(refreshAccessToken);
router.route("/").get(authUser, getUserData);
router
  .route("/recent-search-city")
  .post(authUser, recentlySearchedCitiesHandler);

export default router;

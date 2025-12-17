import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

export const authUser = asyncHandler(async (req, _, next) => {
   console.log("REQ.AUTH 👉", req.auth);
  const { userId } = req.auth;

  if (!userId) {
    throw new apiError(401, "Unauthorized access");
  }

  const user = await User.findById({_id: userId});
  console.log("user", user);
  
  req.user = user;
  next();
});

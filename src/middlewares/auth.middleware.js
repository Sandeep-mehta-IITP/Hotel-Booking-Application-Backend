import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

export const authUser = asyncHandler(async (req, _, next) => {
  const auth = req.auth();

  console.log("AUTH OBJECT 👉", auth);

  const { userId } = auth;
  if (!userId) {
    throw new apiError(401, "Unauthorized access");
  }

  const user = await User.findById({_id: userId});
  console.log("user", user);
  
  req.user = user;
  next();
});

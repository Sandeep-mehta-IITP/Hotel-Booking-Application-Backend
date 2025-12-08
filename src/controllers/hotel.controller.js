import { Hotel } from "../models/hotel.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";

//TODO: Register Hotel
const registerHotel = asyncHandler(async (req, res) => {
  const { name, address, contact, city } = req.body;
  const owner = req.user?._id;

  if (!owner) {
    throw new apiError(401, "Unauthorized user.");
  }

  // Check if hotel already exists for this owner
  const hotel = await Hotel.findOne({ owner });

  if (hotel) {
    throw new apiError(409, "Hotel already registered.");
  }

  const createdHotel = await Hotel.create({
    name,
    address,
    contact,
    city,
    owner,
  });
  await User.findByIdAndUpdate(owner, { role: "hotelOwner" });

  if (!createdHotel) {
    throw new apiError(500, "Failed to register hotel.");
  }

  return res
    .status(200)
    .json(new apiResponse(200, createdHotel, "Hotel registered successfully."));
});

export { registerHotel };

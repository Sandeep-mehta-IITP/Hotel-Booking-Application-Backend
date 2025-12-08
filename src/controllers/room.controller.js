import { Room } from "../models/room.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import { Hotel } from "../models/hotel.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

//TODO: Create a new room for Hotel
const createRoom = asyncHandler(async (req, res) => {
  const { roomType, pricePerNight, amenities } = req.body;

  if (!roomType || !pricePerNight || !amenities) {
    throw new apiError(400, "All fields required.");
  }

  const hotel = await Hotel.findOne({ owner: req.auth?.userId });
  if (!hotel) {
    throw new apiError(404, "No Hotel Found.");
  }

  // Validate image files
  if (!req.files || req.files.length === 0) {
    throw new apiError(400, "At least one room image is required.");
  }

  // Upload all images to Cloudinary
  const uploadedImages = await Promise.all(
    req.files.map(async (file) => {
      const uploaded = await uploadOnCloudinary(file.path);
      return uploaded?.secure_url;
    })
  );

  const images = uploadedImages.filter((url) => url);

  if (images.length === 0) {
    throw new apiError(500, "Image upload failed.");
  }

  // Parse amenities
  let amenitiesArray;
  try {
    amenitiesArray = JSON.parse(amenities);
  } catch {
    amenitiesArray = amenities.split(",").map((a) => a.trim());
  }

  const createdRoom = await Room.create({
    hotel: hotel?._id,
    roomType,
    pricePerNight: +pricePerNight,
    amenities: amenitiesArray,
    images,
  });

  return res
    .status(200)
    .json(new apiResponse(200, createdRoom, "Room created successfully."));
});


//TODO: Get all romms
const getRooms = asyncHandler( async (req, res) => {
    
})

export { createRoom };

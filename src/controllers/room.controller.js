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
const getRooms = asyncHandler(async (req, res) => {
  const rooms = await Room.find({ isAvailable: true })
    .populate({
      path: "hotel",
      populate: {
        path: "owner",
        select: "image",
      },
    })
    .sort({ createdAt: -1 })
    .lean();

  if (!rooms || rooms.length === 0) {
    throw new apiError(404, "No room available");
  }

  return res
    .status(200)
    .json(new apiResponse(200, rooms, "Rooms fetched successfully."));
});

// TODO: get all rooms for a specific hotel
const getOwnerRooms = asyncHandler(async (req, res) => {
  const ownerId = req.auth?.userId;

  if (!ownerId) {
    throw new apiError(401, "Unauthorized acess.");
  }

  const hotelData = await Hotel.findOne({ owner: ownerId }).lean();

  if (!hotelData) {
    throw new apiError(404, "No hotel found for this owner.");
  }

  const rooms = await Room.find({ hotel: hotelData?._id.toString() })
    .populate("hotel")
    .lean();

  return res
    .status(200)
    .json(new apiResponse(200, rooms, "All rooms fetched successfully."));
});

//TODO: toggle availability for a room
const toggleRoomAvailability = asyncHandler(async (req, res) => {
  const { roomId } = req.body;

  if (!roomId) {
    throw new apiError(400, "Room ID is required.");
  }

  const roomData = (await Room.findById(roomId)) / lean();

  if (!roomData) {
    throw new apiError(404, "No room found.");
  }

  const updatedRoom = await Room.findByIdAndUpdate(
    roomId,
    { isAvailable: !roomData.isAvailable },
    { new: true }
  ).lean();

  return res
    .status(200)
    .json(new apiResponse(200, updatedRoom, "Room availability updated."));
});
export { createRoom, getRooms, getOwnerRooms, toggleRoomAvailability };

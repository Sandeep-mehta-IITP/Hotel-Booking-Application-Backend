import { Room } from "../models/room.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import { Hotel } from "../models/hotel.model.js";
import { Booking } from "../models/booking.model.js";

//TODO: function for checkavailability
const checkAvailability = async (room, start, end) => {
  const bookings = await Booking.find({
    room,
    checkInDate: { $lte: end },
    checkOutDate: { $gte: start },
  }).lean();

  return bookings.length === 0;
};

//TODO: check availability of room
const checkAvailabilityApi = asyncHandler(async (req, res) => {
  const { checkInDate, checkOutDate, room } = req.body;

  if (!checkInDate || !checkOutDate || !room) {
    throw new apiError(400, "Room , start date and end date are required.");
  }

  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);

  // Ensure valid date range
  if (isNaN(start) || isNaN(end)) {
    throw new apiError(400, "Invalid date format.");
  }

  if (start >= end) {
    throw new apiError(400, "Check-out date must be after check-in date.");
  }

  const isAvailable = await checkAvailability(room, start, end);

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        { available: isAvailable },
        isAvailable
          ? "Room is available for the selected dates."
          : "Room is not available for the selected dates."
      )
    );
});

//TODO: create a new booking
const createBooking = asyncHandler(async (req, res) => {
  const { room, checkInDate, checkOutDate, guests } = req.body;
  const userId = req.auth?.userId;

  if (!room || !checkInDate || !checkOutDate) {
    throw new apiError(
      400,
      "Room, check-in date, and check-out date are required."
    );
  }
  if (!userId) {
    throw new apiError(401, "Unauthorized access.");
  }

  // Validate room existence
  const roomData = await Room.findById(room).populate("hotel").lean();
  if (!roomData) {
    throw new apiError(404, "Room not found.");
  }

  // Parse dates
  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);

  // Validate date format
  if (isNaN(start) || isNaN(end)) {
    throw new apiError(400, "Invalid date format.");
  }

  // Ensure correct order
  if (start >= end) {
    throw new apiError(400, "Check-out date must be after check-in date.");
  }

  // Overlapping bookings check
  const existingBookings = await Booking.find({
    room,
    checkInDate: { $lte: end },
    checkOutDate: { $gte: start },
  }).lean();

  if (existingBookings.length > 0) {
    throw new apiError(409, "Room is already booked for these dates.");
  }

  // Calculate number of nights
  const oneDay = 24 * 60 * 60 * 1000;
  const nights = Math.ceil((end - start) / oneDay);

  // Price calculation
  const totalPrice = nights * roomData.pricePerNight;

  const newBooking = await Booking.create({
    user: userId,
    room,
    hotel: roomData?.hotel?._id,
    guests: +guests,
    checkInDate: start,
    checkOutDate: end,
    totalPrice,
  });

  if (!newBooking) {
    throw new apiError(500, "Failed to create booking.");
  }

  return res
    .status(200)
    .json(new apiResponse(200, newBooking, "Booking created successfully."));
});

//TODO: get all booking for a user
const getUserBookings = asyncHandler(async (req, res) => {
  const user = req.user?._id;

  if (!user) {
    throw new apiError(401, "Unauthorized access.");
  }

  const bookings = await Booking.find({ user })
    .populate("room hotel")
    .sort({ createdAt: -1 })
    .lean();

  if (!bookings || bookings.length === 0) {
    throw new apiError(404, "No bookings found.");
  }

  return res
    .status(200)
    .json(new apiResponse(200, bookings, "Bookings fetched successfully."));
});

//TODO: get hotel bookings
const getHotelBookings = asyncHandler(async (req, res) => {
  const owner = req.auth.userId;

  if (!owner) {
    throw new apiError(401, "Unauthorized access.");
  }

  const hotel = await Hotel.findOne({ owner }).lean();
  if (!hotel) {
    throw new apiError(404, "No hotel found.");
  }

  const bookings = await Booking.find({ hotel: hotel?._id })
    .populate("room hotel user")
    .sort({ createdAt: -1 })
    .lean();

  const totalBookings = bookings.length;

  const totalRevenue = bookings.reduce(
    (acc, booking) => acc + booking.totalPrice,
    0
  );

  const dashboardData = {
    bookings,
    totalBookings,
    totalRevenue,
  };

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        dashboardData,
        "Hotel bookings fetched successfully."
      )
    );
});

export {
  checkAvailabilityApi,
  createBooking,
  getUserBookings,
  getHotelBookings,
};

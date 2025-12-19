import { Room } from "../models/room.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import { Hotel } from "../models/hotel.model.js";
import { Booking } from "../models/booking.model.js";
import transporter from "../config/nodemailer.js";
import stripe from "stripe";

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
  const userId = req.user?._id;

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

  // mail options for comfirmation mail
  const mailOptions = {
    from: `"QuickStay Hotel Booking" <${process.env.SENDER_EMAIL}>`,
    to: req.user.email,
    subject: "Your Hotel Booking is Confirmed | QuickStay",
    html: `
  <div style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f4f6f8; padding: 30px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.08);">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #0f2027, #203a43, #2c5364); padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">QuickStay</h1>
        <p style="color: #d1e8ff; margin-top: 6px; font-size: 14px;">
          Premium Hotel Booking Experience
        </p>
      </div>

      <!-- Body -->
      <div style="padding: 28px;">
        <h2 style="color: #333333; margin-bottom: 10px;">
          Booking Confirmed ✅
        </h2>

        <p style="color: #555555; font-size: 15px;">
          Dear <strong>${req.user.username}</strong>,
        </p>

        <p style="color: #555555; font-size: 15px; line-height: 1.6;">
          Thank you for choosing <strong>QuickStay</strong>.  
          We’re delighted to confirm your hotel booking. Below are your reservation details:
        </p>

        <!-- Booking Details Card -->
        <div style="border: 1px solid #eaeaea; border-radius: 10px; padding: 18px; margin: 20px 0; background: #fafafa;">
          <table width="100%" cellpadding="8" cellspacing="0" style="font-size: 14px; color: #333;">
            <tr>
              <td><strong>Booking ID</strong></td>
              <td style="text-align: right;">${newBooking?._id}</td>
            </tr>
            <tr>
              <td><strong>Hotel Name</strong></td>
              <td style="text-align: right;">${roomData?.hotel?.name}</td>
            </tr>
            <tr>
              <td><strong>Location</strong></td>
              <td style="text-align: right;">${roomData?.hotel?.address}</td>
            </tr>
            <tr>
              <td><strong>Check-in Date</strong></td>
              <td style="text-align: right;">
                ${new Date(newBooking?.checkInDate).toDateString()}
              </td>
            </tr>
            <tr>
              <td><strong>Amount</strong></td>
              <td style="text-align: right; color: #2c5364;">
                ${process.env.CURRENCY || "$"} ${newBooking?.totalPrice} / night
              </td>
            </tr>
          </table>
        </div>

        <p style="color: #555555; font-size: 15px; line-height: 1.6;">
          We look forward to welcoming you and ensuring a comfortable stay.
        </p>

        <p style="color: #555555; font-size: 14px;">
          If you need any assistance or wish to modify your booking, feel free to contact our support team.
        </p>

        <p style="margin-top: 24px; color: #333;">
          Warm regards,<br/>
          <strong>QuickStay Team</strong>
        </p>
      </div>

      <!-- Footer -->
      <div style="background: #f0f2f5; padding: 16px; text-align: center; font-size: 12px; color: #777;">
        © ${new Date().getFullYear()} QuickStay. All rights reserved.
        <br/>
        This is an automated email. Please do not reply.
      </div>

    </div>
  </div>
  `,
  };

  await transporter.sendMail(mailOptions);

  return res
    .status(200)
    .json(new apiResponse(200, newBooking, "Booking created successfully."));
});

//TODO: get all booking for a user
const getUserBookings = asyncHandler(async (req, res) => {
  const user = req.user?._id;

  console.log("user in booking contorller", user);
  

  if (!user) {
    throw new apiError(401, "Unauthorized access.");
  }

  const bookings = await Booking.find({ user })
    .populate("room hotel")
    .sort({ createdAt: -1 })
    .lean();

    console.log("bookings data0", bookings);
    

  if (!bookings || bookings.length === 0) {
    throw new apiError(404, "No bookings found.");
  }

  return res
    .status(200)
    .json(new apiResponse(200, bookings, "Bookings fetched successfully."));
});

//TODO: get hotel bookings
const getHotelBookings = asyncHandler(async (req, res) => {
  const owner = req.user._id;

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

// Payment conrtoller
const stripePayment = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;

  if (!bookingId) {
    throw new apiError(400, "Booking ID is required.");
  }

  const booking = await Booking.findById(bookingId).lean();

  if (booking.isPaid) {
    throw new apiError(400, "Booking already paid.");
  }

  const roomData = await Room.findById(booking.room).populate("hotel").lean();

  if (!roomData) {
    throw new apiError(404, "Room not found.");
  }

  const totalPrice = booking.totalPrice;
  const { origin } = req.headers;

  const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

  const line_items = [
    {
      price_data: {
        currency: "usd",
        product_data: {
          name: roomData?.hotel?.name,
        },
        unit_amount: totalPrice * 100,
      },
      quantity: 1,
    },
  ];

  // Create checkout session
  const session = await stripeInstance.checkout.sessions.create({
    line_items,
    mode: "payment",
    success_url: `${origin}/loader/my-bookings`,
    cancel_url: `${origin}/my-bookings`,
    metadata: {
      bookingId,
    },
  });

  if (!session?.url) {
    throw new apiError(500, "Payment failed.");
  }

  return res
    .status(200)
    .json(new apiResponse(200, { url: session?.url }, "Payment Successful !"));
});

export {
  checkAvailabilityApi,
  createBooking,
  getUserBookings,
  getHotelBookings,
  stripePayment,
};

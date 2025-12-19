import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import stripeRouter from "./routes/stripe.routes.js";

const app = express();

app.use("/api/v1", stripeRouter); // it is using raw data not in json

app.use(
  cors({
    origin: process.env.ORIGIN_CORS,
    credentials: true,
  })
);


app.use(express.json({ limit: "99mb" }));
app.use(cookieParser());
app.use(morgan("dev"));


// import routes
import userRouter from "./routes/user.routes.js";
import hotelRouter from "./routes/hotel.routes.js";
import roomRouter from "./routes/room.routes.js";
import bookingRouter from "./routes/booking.routes.js";
import healthcheckRouter from "./routes/healthCheck.routes.js";

//routes decelration
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/hotels", hotelRouter);
app.use("/api/v1/rooms", roomRouter);
app.use("/api/v1/bookings", bookingRouter);


// Error Handling of Express
app.use((err, req, res, next) => {
  console.error("Express Error :", err);

  const statusCode = err.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || [],
    data: err.data || null,
  });
});
export { app };

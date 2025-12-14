import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import morgan from "morgan";

const app = express();

app.use(
  cors({
    origin: process.env.ORIGIN_CORS,
    credentials: true,
  })
);

app.use(express.json({ limit: "99mb" }));
app.use(clerkMiddleware());
app.use(morgan("dev"));

// import routes
import clerkRouter from "./routes/clerk.routes.js";
import userRouter from "./routes/user.routes.js";
import hotelRouter from "./routes/hotel.routes.js";
import roomRouter from "./routes/room.routes.js";
import bookingRouter from "./routes/booking.routes.js";

//routes decelration
app.use("/api/v1/clerk", clerkRouter);
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

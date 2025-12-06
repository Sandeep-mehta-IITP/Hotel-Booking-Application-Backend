import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";


const app = express();

app.use(
  cors({
    origin: process.env.ORIGIN_CORS,
    credentials: true,
  })
);

app.use(express.json({ limit: "99mb" }));
app.use(clerkMiddleware());


// import routes
import clerkWebhooks from "./controllers/clerkWebHooks.controller.js";


//routes decelration
app.use("/api/v1/clerk", clerkWebhooks);


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

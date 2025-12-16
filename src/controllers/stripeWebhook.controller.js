import Stripe from "stripe";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Booking } from "../models/booking.model.js";
import { apiResponse } from "../utils/apiResponse.js";

const stripeWebhooks = asyncHandler(async (req, res) => {
  const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const paymentIntent = event.data.object;
    const paymentIntentId = paymentIntent?._id;

    // getting session metadata
    const session = await stripeInstance.checkout.sessions.list({
      payment_intent: paymentIntentId,
    });

    const { bookingId } = session.data[0].metadata;

    // Mark payment is true
    if (bookingId) {
      await Booking.findByIdAndUpdate(bookingId, {
        isPaid: true,
        paymentMethod: "Stripe",
        status: "confirmed",
      });
    }
  }

  return res
    .status(200)
    .json(
      new apiResponse(200, { received: true }, "Payment received successfully.")
    );
});

export { stripeWebhooks };

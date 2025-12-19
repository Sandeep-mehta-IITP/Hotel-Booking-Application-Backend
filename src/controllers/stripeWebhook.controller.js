import Stripe from "stripe";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Booking } from "../models/booking.model.js";
import { apiResponse } from "../utils/apiResponse.js";

const stripeWebhooks = asyncHandler(async (req, res) => {
  console.log("stripe payment ", req.headers);

  const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log("Stripe event type:", event.type);
  } catch (error) {
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const paymentIntentId = paymentIntent.id;

    const session = stripeInstance.checkout.sessions.list({
      payment_intent: paymentIntentId,
    });

    const { bookingId } = (await session).data[0].metadata;

    console.log("Webhook received for booking:", bookingId);

    // Mark payment is true
    if (bookingId) {
      const result = await Booking.findByIdAndUpdate(bookingId, {
        isPaid: true,
        paymentMethod: "Stripe",
        status: "confirmed",
      });

      console.log("payment result", result);
    }
  }

  return res
    .status(200)
    .json(
      new apiResponse(200, { received: true }, "Payment received successfully.")
    );
});

export { stripeWebhooks };

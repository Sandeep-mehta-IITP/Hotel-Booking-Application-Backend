import { User } from "../models/user.model.js";
import { Webhook } from "svix";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";

const clerkWebhooks = asyncHandler(async (req, res) => {
  try {
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    const headers = {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    };

    // Verify webhook signature
    await whook.verify(req.body, headers);

    const { data, type } = JSON.parse(req.body.toString());

    console.log(" data of clerk user", data);
    

    // switch case for different events
    switch (type) {
      case "user.created": {
        const userData = {
          _id: data.id,
          email: data.email_addresses[0]?.email_address,
          username: `${data.first_name} ${data.last_name}`,
          image: data.image_url,
        };

        await User.findOneAndUpdate(
          { _id: data.id },
          userData,
          { upsert: true, new: true } // create if not exist
        );
        break;
      }

      case "user.updated": {
        const userData = {
          _id: data.id,
          email: data.email_addresses[0]?.email_address,
          username: `${data.first_name} ${data.last_name}`,
          image: data.image_url,
        };

        await User.findOneAndUpdate({ _id: data.id }, userData, {
          new: true,
        });
        break;
      }

      case "user.deleted": {
        await User.findOneAndDelete({ _id: data.id });
        break;
      }

      default:
        break;
    }

    return res
      .status(200)
      .json(
        new apiResponse(200, { success: true }, "Webhook handled successfully.")
      );
  } catch (error) {
    throw new apiError(500, "Webhook processing failed: " + error.message);
  }
});

export default clerkWebhooks;

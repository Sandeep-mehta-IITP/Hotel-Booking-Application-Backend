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
    await whook.verify(JSON.stringify(req.body), headers);

    const { data, type } = req.body;

    const userData = {
      _id: data.id,
      email: data.addresses[0].email_address,
      username: `${data.first_name} ${data.last_name}`,
      image: data.image_url,
    };

    // switch case for different events
    switch (type) {
      case "user.created": {
        await User.create(userData);
        break;
      }

      case "user.updated": {
        await User.findByIdAndUpdate(data.id, userData);
        break;
      }

      case "user.deleted": {
        await User.findByIdAndDelete(data.id);
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

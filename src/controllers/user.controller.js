import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";

const getUserData = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new apiError(401, "Unauthorized: User not logged in.");
  }

  const role = req.user?.role;
  const recentlySearchedCities = req.user?.recentlySearchedCities;

  const data = {
    role,
    recentlySearchedCities,
  };

  return res
    .status(200)
    .json(new apiResponse(200, data, "UserData fetched successfully."));
});

const recentlySearchedCitiesHandler = asyncHandler(async (req, res) => {
  const { recentSearchedCity } = req.body;
  const user = req.user;

  if (!recentSearchedCity) {
    throw new apiError(400, "Invalid city name.");
  }

  const city = recentSearchedCity.trim();

  // Remove existing occurrence to avoid duplicates
  user.recentlySearchedCities = user.recentlySearchedCities.filter(
    (c) => c.toLowerCase() !== city.toLowerCase()
  );

  // Add newest city at the end OR at the start as per your UI
  user.recentlySearchedCities.push(city);

  // Maintain size limit of 10
  if (user.recentlySearchedCities.length > 10) {
    user.recentlySearchedCities.splice(
      0,
      user.recentlySearchedCities.length - 10
    );
  }

  await user.save();

  return res.status(200).json(
    new apiResponse(
      200,
      {
        success: true,
        recentlySearchedCities: user.recentlySearchedCities,
      },
      "City added successfully."
    )
  );
});

export { getUserData, recentlySearchedCitiesHandler };

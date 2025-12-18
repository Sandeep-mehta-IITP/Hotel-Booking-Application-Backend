import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Function to generate access and refresh tokens
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(
      500,
      "Something went wrong while generating access and refresh token."
    );
  }
};

//TODO: Register User
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullName, password } = req.body;

  const fields = { fullName, username, email, password };

  for (const [key, value] of Object.entries(fields)) {
    if (!value.trim()) {
      throw new apiError(400, `${key} is required.`);
    }
  }

  // check for existing user
  const existedUser = await User.findOne({
    $or: [
      {
        username: username.trim(),
      },
      {
        email: email.toLowerCase(),
      },
    ],
  }).lean();

  if (existedUser) {
    throw new apiError(
      409,
      existedUser.email === email.toLowerCase()
        ? "Email is already registered."
        : "Username is already taken."
    );
  }

  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar image is required.");
  }

  // upload on cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar) {
    throw new apiError(500, "Failed to upload avatar to Cloudinary.");
  }

  // user creation
  const user = await User.create({
    username: username.toLowerCase(),
    fullName,
    image: avatar?.secure_url,
    email: email.toLowerCase(),
    password,
  });

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new apiError(500, "Something went wrong while creating the user.");
  }

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  };

  return res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        { user: createdUser, accessToken, refreshToken },
        "User created successfully"
      )
    );
});

//TODO: Login User
const loginUser = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier) {
    throw new apiError(400, "username or email is required");
  }

  if (!password) {
    throw new apiError(400, "password is required.");
  }

  const user = await User.findOne({
    $or: [{ email: identifier }, { username: identifier }],
  });

  if (!user) {
    throw new apiError(404, "User does not exist");
  }

  const isValidPassword = await user.isPasswordCorrect(password, user.password);

  if (!isValidPassword) {
    throw new apiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in Successfully !!!"
      )
    );
});

//TODO: Logout User
const logoutUser = asyncHandler(async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          refreshToken: null,
        },
      },
      {
        new: true,
      }
    );

    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    };

    res
      .status(200)
      .clearCookie("accessToken", { ...options, maxAge: 0 })
      .clearCookie("refreshToken", { ...options, maxAge: 0 })
      .json(new apiResponse(200, {}, "Logout user."));
  } catch (error) {
    throw new apiError(
      500,
      error.message || "something went wrong while logout user !!!"
    );
  }
});

//TODO:  regenerate access and refresh token
const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
      throw new apiError(400, "Unauthorized access");
    }

    const decodedRefreshToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedRefreshToken?._id);

    if (!user) {
      throw new apiError(401, "Invalid refresh token.");
    }

    if (user?.refreshToken !== incomingRefreshToken) {
      throw new apiError(401, "Resfresh token is expired or used");
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    // console.log("refresh access token", accessToken);
    // console.log("refresh token", newRefreshToken);

    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new apiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Refreshed access token successfuly."
        )
      );
  } catch (error) {
    throw new apiError(401, error.message || "Could not refresh access token");
  }
});

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

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getUserData,
  recentlySearchedCitiesHandler,
};

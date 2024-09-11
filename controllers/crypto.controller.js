const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const cryptoService = require("../services/crypto.service");
const config = require("../config/config");
const CryptoGraph = require("../models/cryptoGraphModel");
const CryptoImage = require("../models/cryptoImageModel");
const redisClient = require("../config/redisConfig.js");

const fetchCrypto = catchAsync(async (req, res, next) => {
  try {
    if (redisClient.isReady) {
      const cachedData = await redisClient.get("cryptoData");
      if (cachedData) {
        console.log("crypto data response from redis")
        return res.status(200).send(JSON.parse(cachedData));
      } else {
        console.log("crypto data response from db")
        const result = await cryptoService.fetchCrypto();
        res.status(200).send(result);
      }
    } else {
      const result = await cryptoService.fetchCrypto();
      console.log("crypto data response from db")
      res.status(200).send(result);
    }
  } catch (error) {
    next(error);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to fetch crypto data"
    );
  }
});

// const fetchImage = catchAsync(async (req, res, next) => {
//   try {
//     const { imageName } = req.params;
//     // Replace with the actual URL where the image is hosted
//     const imageUrl = `${config.source}/${imageName}`;
//     request
//       .get(imageUrl)
//       .on("error", (err) => {
//         console.error(`Error fetching image from ${imageUrl}:`, err);
//         return res
//           .status(404)
//           .json({ status: "FAILED", message: "Failed to fetch image" });
//       })
//       .on("response", (response) => {
//         // Modify the response headers to show the desired URL
//         response.headers[
//           "Content-Disposition"
//         ] = `inline; filename="${config.mask}/${imageName}"`;
//         response.headers["Content-Type"] = "image/png"; // Adjust according to your image type
//         res.setHeader(
//           "Content-Disposition",
//           response.headers["Content-Disposition"]
//         );
//       })
//       .pipe(res);
//   } catch (error) {
//     next(error);
//     throw new ApiError(
//       httpStatus.INTERNAL_SERVER_ERROR,
//       "Failed to fetch image data"
//     );
//   }
// });
const fetchCryptoImage = catchAsync(async (req, res, next) => {
  const { imageName } = req.params;
  const imageUrl = `${config.source}/data/logos/${imageName}`;
  try {
    // Check if the image is already in the database
    const existingImage = await CryptoImage.findOne({ imageName }).catch(
      (dbError) => {
        console.error("Error accessing the database:", dbError);
        return next(new ApiError("Database access error", 500));
      }
    );

    if (existingImage) {
      res.contentType(existingImage.contentType);
      return res.send(existingImage.imageData);
    }

    // Fetch the image from the external source
    let response;
    try {
      const fetch = (await import("node-fetch")).default;
      response = await fetch(imageUrl);
    } catch (fetchError) {
      console.error(`Error fetching image from ${imageUrl}:`, fetchError);
      return res
        .status(404)
        .json({ status: "FAILED", message: "Failed to fetch image" });
    }

    if (!response.ok) {
      console.error(`Image not found at ${imageUrl}:`, response.statusText);
      return res
        .status(404)
        .json({ status: "FAILED", message: "Image not found" });
    }

    let buffer;
    try {
      buffer = Buffer.from(await response.arrayBuffer());
    } catch (bufferError) {
      console.error("Error buffering image data:", bufferError);
      return next(
        new ApiError("An error occurred while processing the image data", 500)
      );
    }

    // Save the image to the database
    try {
      const newImage = await CryptoImage.create({
        imageName,
        imageData: buffer,
        contentType: response.headers.get("content-type"),
      });
      res.contentType(newImage.contentType);
      return res.send(newImage.imageData);
    } catch (dbSaveError) {
      console.error("Error saving image to the database:", dbSaveError);
      return next(
        new ApiError("An error occurred while saving the image", 500)
      );
    }
  } catch (error) {
    console.error("Error in fetchCryptoImage:", error);
    return next(
      new ApiError("An error occurred while processing the image", 500)
    );
  }
});

const fetchCryptoGraphdata = catchAsync(async (req, res, next) => {
  try {
    const { timeframe, cryptoId, currency } = req.params;
    const url = `${config.source}/data/charts/${timeframe}/${cryptoId}/${currency}`;

    let response;
    try {
      const fetch = (await import("node-fetch")).default;
      response = await fetch(url);
    } catch (fetchError) {
      console.error(`Error fetching graph data from ${url}:`, fetchError);
      return next(
        new ApiError("Failed to fetch graph data", httpStatus.NOT_FOUND)
      );
    }

    if (!response.ok) {
      console.error(`Graph data not found at ${url}:`, response.statusText);
      return next(new ApiError("Graph data not found", httpStatus.NOT_FOUND));
    }

    let data;
    try {
      const responseBody = await response.text();
      data = JSON.parse(responseBody);
    } catch (processError) {
      console.error("Error processing graph data:", processError);
      return next(
        new ApiError(
          "Failed to process graph data",
          httpStatus.INTERNAL_SERVER_ERROR
        )
      );
    }

    // Upsert data in MongoDB
    let updatedData;
    try {
      updatedData = await CryptoGraph.findOneAndUpdate(
        { timeframe, cryptoId, currency },
        { data, fetchedAt: new Date() },
        { new: true, upsert: true } // Create if not exists, return the updated document
      );
    } catch (dbError) {
      console.error("Error accessing or saving data to the database:", dbError);
      return next(
        new ApiError("Database error", httpStatus.INTERNAL_SERVER_ERROR)
      );
    }

    res.status(httpStatus.OK).json(updatedData.data);
  } catch (error) {
    console.error("Error in fetchCryptoGraphdata:", error);
    next(
      new ApiError(
        "An error occurred while processing the graph data",
        httpStatus.INTERNAL_SERVER_ERROR
      )
    );
  }
});

module.exports = {
  fetchCrypto,
  fetchCryptoGraphdata,
  fetchCryptoImage,
};

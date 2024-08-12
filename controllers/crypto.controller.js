const httpStatus = require("http-status");
const pick = require("../utils/pick");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const cryptoService = require("../services/crypto.service");
const request = require("request");
const config = require("../config/config");
const axios = require("axios");
const CryptoGraph = require("../models/cryptoGraphModel");
const CryptoImage = require("../models/cryptoImageModel");
const { response } = require("express");

const fetchCrypto = catchAsync(async (req, res, next) => {
  try {
    const result = await cryptoService.fetchCrypto();
    res.status(200).send(result);
  } catch (error) {
    next(error);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to fetch crypto data"
    );
  }
});

const fetchImage = catchAsync(async (req, res, next) => {
  try {
    const { imageName } = req.params;
    // Replace with the actual URL where the image is hosted
    const imageUrl = `${config.source}/${imageName}`;
    request
      .get(imageUrl)
      .on("error", (err) => {
        console.error(`Error fetching image from ${imageUrl}:`, err);
        return res
          .status(404)
          .json({ status: "FAILED", message: "Failed to fetch image" });
      })
      .on("response", (response) => {
        // Modify the response headers to show the desired URL
        response.headers[
          "Content-Disposition"
        ] = `inline; filename="${config.mask}/${imageName}"`;
        response.headers["Content-Type"] = "image/png"; // Adjust according to your image type
        res.setHeader(
          "Content-Disposition",
          response.headers["Content-Disposition"]
        );
      })
      .pipe(res);
  } catch (error) {
    next(error);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to fetch image data"
    );
  }
});
const fetchCryptoImage = catchAsync(async (req, res, next) => {
  try {
    const { imageName } = req.params;
    const imageUrl = `${config.source}/${imageName}`;

    // Check if the image is already in the database
    let existingImage = await CryptoImage.findOne({ imageName });
    if (existingImage) {
      // If found, send the stored image data
      res.contentType(existingImage.contentType);
      return res.send(existingImage.imageData);
    }

    // Fetch the image from the external source
    request.get(imageUrl)
    .on("error", (err) => {
      console.error(`Error fetching image from ${imageUrl}:`, err);
      return res
        .status(404)
        .json({ status: "FAILED", message: "Failed to fetch image" });
    })
      .on("response", async (response) => {
        console.log(response)
      
       
        let imageData = [];
        response.on('data', (chunk) => {
          imageData.push(chunk);
        });

        response.on('end', async () => {
          const buffer = Buffer.concat(imageData);

          // Store the image in MongoDB using create
          const newImage = await CryptoImage.create({
            imageName,
            imageData: buffer,
            contentType: response.headers['content-type'],
          });
          console.log(newImage)

          // Send the stored image to the frontend
          res.contentType(newImage.contentType);
          res.send(newImage.imageData);
        });
      });

  } catch (error) {
    console.error("Error in fetchCryptoImage:", error);
    next(new ApiError('An error occurred while processing the image', 500));
  }
});




const fetchCryptoGraphdata = catchAsync(async (req, res, next) => {
  try {
    const { timeframe, cryptoId, currency } = req.params;

    // Fetch data from the external API
    const url = `https://cryptobubbles.net/backend/data/charts/${timeframe}/${cryptoId}/${currency}`;
    request
      .get(url)
      .on("error", (err) => {
        console.error(`Error fetching graph data from ${url}:`, err);
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ status: "FAILED", message: "Failed to fetch graph data" });
      })
      .on("response", async (response) => {
        res.setHeader("Content-Type", "application/json");

        let dataChunks = [];
        response.on("data", (chunk) => {
          dataChunks.push(chunk);
        });

        response.on("end", async () => {
          const data = JSON.parse(Buffer.concat(dataChunks).toString());

          // Upsert data in MongoDB
          const updatedData = await CryptoGraph.findOneAndUpdate(
            { timeframe, cryptoId, currency },
            { data, fetchedAt: new Date() },
            { new: true, upsert: true } // Create if not exists, return the updated document
          );

          res.status(200).json(updatedData.data);
        });
      });
  } catch (error) {
    next(error);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to fetch or store graph data"
    );
  }
});

module.exports = {
  fetchCrypto,
  fetchCryptoGraphdata,
  fetchCryptoImage,

  fetchImage,
};

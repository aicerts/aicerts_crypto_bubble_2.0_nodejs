const httpStatus = require("http-status");
const pick = require("../utils/pick");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const cryptoService = require("../services/crypto.service");
const request = require("request");
const config = require("../config/config");
const axios = require("axios");
const CryptoGraph = require("../models/cryptoGraphModel");

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
const fetchCryptoGraphdata = catchAsync(async (req, res, next) => {
  try {
    const { timeframe, cryptoId, currency } = req.params;

    // Check if data is already stored
    let storedData = await CryptoGraph.findOne({
      timeframe,
      cryptoId,
      currency,
    }).exec();

    if (storedData) {
      return res.status(200).json(storedData.data);
    }
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
          // Save data to MongoDB
          const createdData = await CryptoGraph.create({
            timeframe,
            cryptoId,
            currency,
            data,
            fetchedAt: new Date(),
          });

          res.status(200).json(createdData.data);
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

  fetchImage,
};

const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const cryptoService = require("../services/crypto.service");
const config = require("../config/config");
const CryptoGraph = require("../models/cryptoGraphModel");
const CryptoImage = require("../models/cryptoImageModel");
const redisClient = require("../config/redisConfig.js");
const  {promisify} = require("util")

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
// Promisify Redis methods
const getAsync = promisify(redisClient.get).bind(redisClient);
const setAsync = promisify(redisClient.set).bind(redisClient);

const fetchCryptoImage = catchAsync(async (req, res, next) => {
  const { imageName } = req.params;
  const imageUrl = `${config.source}/data/logos/${imageName}`;

  try {
    // Check Redis cache first
    if (redisClient.isReady) {
      const cachedImage = await redisClient.get(imageName);
      if (cachedImage) {
        console.log("Image response from Redis");
        const parsedImage = JSON.parse(cachedImage);
        console.log(parsedImage)
        res.contentType(parsedImage.contentType);
        return res.send(Buffer.from(parsedImage.imageData, 'base64'));
      }
    }

    // Check if the image is already in the database
    const existingImage = await CryptoImage.findOne({ imageName }).exec();

    if (existingImage) {
      // Save image to Redis cache
      if (redisClient.isReady) {
        const imageDataToCache = {
          contentType: existingImage.contentType,
          imageData: existingImage.imageData.toString('base64')
        };
        await redisClient.set(imageName, JSON.stringify(imageDataToCache));
        console.log("Image cached in Redis");
      }
      console.log(existingImage.imageData)

      res.contentType(existingImage.contentType);
      return res.send(existingImage.imageData);
    }

    // Fetch the image from the external source
    const fetch = (await import("node-fetch")).default;
    const response = await fetch(imageUrl);

    if (!response.ok) {
      return res.status(404).json({ status: "FAILED", message: "Image not found" });
    }

    // Read the image data
    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type");

    // Save the image to the database
    const newImage = await CryptoImage.create({
      imageName,
      imageData: buffer,
      contentType
    });

    // Save image to Redis cache
    if (redisClient.isReady) {
      const imageDataToCache = {
        contentType: newImage.contentType,
        imageData: newImage.imageData.toString('base64')
      };
      await redisClient.set(imageName, JSON.stringify(imageDataToCache));
      console.log("Image cached in Redis");
    }

    res.contentType(newImage.contentType);
    return res.send(newImage.imageData);

  } catch (error) {
    console.error("Error in fetchCryptoImage:", error);
    return next(new ApiError("An error occurred while processing the image", 500));
  }
});


const fetchAiImage = catchAsync(async (req, res, next) => {
  
  const { imageName } = req.params;
  const imageUrl = `${config.ai_image_url}${imageName}.jpeg`;

  try {
    // Check Redis cache first
    if (redisClient.isReady) {
      const cachedImage = await redisClient.get(imageName);
      if (cachedImage) {
        console.log("Image response from Redis");
        const parsedImage = JSON.parse(cachedImage);
        console.log(parsedImage)
        res.contentType(parsedImage.contentType);
        return res.send(Buffer.from(parsedImage.imageData, 'base64'));
      }
    }

    // Check if the image is already in the database
    const existingImage = await CryptoImage.findOne({ imageName }).exec();

    if (existingImage) {
      // Save image to Redis cache
      if (redisClient.isReady) {
        const imageDataToCache = {
          contentType: existingImage.contentType,
          imageData: existingImage.imageData.toString('base64')
        };
        await redisClient.set(imageName, JSON.stringify(imageDataToCache));
        console.log("Image cached in Redis");
      }
      console.log(existingImage.imageData)

      res.contentType(existingImage.contentType);
      return res.send(existingImage.imageData);
    }

    // Fetch the image from the external source
    const fetch = (await import("node-fetch")).default;
    const response = await fetch(imageUrl);

    if (!response.ok) {
      return res.status(404).json({ status: "FAILED", message: "Image not found" });
    }

    // Read the image data
    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type");

    // Save the image to the database
    const newImage = await CryptoImage.create({
      imageName,
      imageData: buffer,
      contentType
    });

    // Save image to Redis cache
    if (redisClient.isReady) {
      const imageDataToCache = {
        contentType: newImage.contentType,
        imageData: newImage.imageData.toString('base64')
      };
      await redisClient.set(imageName, JSON.stringify(imageDataToCache));
      console.log("Image cached in Redis");
    }

    res.contentType(newImage.contentType);
    return res.send(newImage.imageData);

  } catch (error) {
    console.error("Error in fetchCryptoImage:", error);
    return next(new ApiError("An error occurred while processing the image", 500));
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

const fetchNewsWithOriginalUrl = async (req, res) => {
  try {
    const { symbol } = req.params;

    if (!symbol || symbol === "undefined") {
      return res.status(400).json({
        status: "FAILED",
        message: "Crypto symbol required in params",
      });
    }

    const news_url = `${config.crypto_news_url}currencies=${symbol}&public=true`;
    const fetch = (await import("node-fetch")).default;
    const response = await fetch(news_url);
    const result = await response.json();  // Entire result object
    
    const urls = result.results.map((newsItem) => newsItem.url);
    
    // Generate the original URLs using your service
    const originalUrls = await cryptoService.genrateOriginalUrls(urls);
    
    // Replace only the URLs in result.results
    result.results = result.results.map((newsItem, index) => {
      const originalUrl = originalUrls[index];
      if (originalUrl) {
        return {
          ...newsItem,
          url: originalUrl, // Replace with original URL if available
        };
      }
      return newsItem; // Keep the original newsItem if no original URL
    });

    // Send the entire result object with modified URLs
    res.status(200).json({
      status: "SUCCESS",
      data: result, // Send the modified result object
    });

  } catch (error) {
    console.error("Error in fetchNewsWithOriginalUrl:", error);
    res.status(500).json({
      status: "FAILED",
      message: "An error occurred while processing the news data.",
    });
  }
};


const fetchPerformanceData= async (req, res) => {
  const { symbol } = req.params;

  const url = `https://api.marketstack.com/v1/eod?access_key=b242b15c327b3332565729379530467d&symbols=${symbol}&limit=365`;
  
  try {
    const fetch = (await import("node-fetch")).default;
      const response = await fetch(url)
      const {data} = await response.json()
      console.log(data)

      if (data.length === 0) {
          return res.status(404).json({ message: "No data found for the given symbol." });
      }

      // Calculate performance
      const latestEODPrice = data[0].close;
      const latestVolume = data[0].volume;

      const lastClose = data[0].close;

      let initialPriceDay = null, initialPriceWeek = null, initialPriceMonth = null, initialPriceYear = null;
      const todayUTC = new Date();
      const weekAgoUTC = new Date(todayUTC.getTime());
      weekAgoUTC.setUTCDate(todayUTC.getUTCDate() - 7);
      const monthAgoUTC = new Date(todayUTC.getTime());
      monthAgoUTC.setUTCMonth(todayUTC.getUTCMonth() - 1);
      const yearAgoUTC = new Date(todayUTC.getTime());
      yearAgoUTC.setUTCFullYear(todayUTC.getFullYear() - 1);

      for (let i = 1; i < data.length; i++) {
          const entryDateUTC = new Date(data[i].date);
          
          if (!initialPriceDay && entryDateUTC < todayUTC) {
              initialPriceDay = data[i].close;
          }
          if (!initialPriceWeek && entryDateUTC <= weekAgoUTC) {
              initialPriceWeek = data[i].close;
          }
          if (!initialPriceMonth && entryDateUTC <= monthAgoUTC) {
              initialPriceMonth = data[i].close;
          }
          if (!initialPriceYear && entryDateUTC <= yearAgoUTC) {
              initialPriceYear = data[i].close;
          }

          if (initialPriceDay && initialPriceWeek && initialPriceMonth && initialPriceYear) break;
      }

      const performance = {
          day: initialPriceDay ? ((lastClose - initialPriceDay) / initialPriceDay) * 100 : null,
          week: initialPriceWeek ? ((lastClose - initialPriceWeek) / initialPriceWeek) * 100 : null,
          month: initialPriceMonth ? ((lastClose - initialPriceMonth) / initialPriceMonth) * 100 : null,
          year: initialPriceYear ? ((lastClose - initialPriceYear) / initialPriceYear) * 100 : null,
      };

      return res.json({
          symbol: symbol,
          performance: performance,
          price: latestEODPrice,
          volume:latestVolume
      });
  } catch (error) {
      console.error('Error fetching performance data:', error);
      return res.status(500).json({ message: 'Failed to fetch performance data.' });
  }
}



module.exports = {
  fetchCrypto,
  fetchCryptoGraphdata,
  fetchCryptoImage,
  fetchNewsWithOriginalUrl,
  fetchAiImage,
  fetchPerformanceData
};

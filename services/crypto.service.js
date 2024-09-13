const Crypto = require("../models/cryptoModel");
const fetchCrypto = async () => {
  try {
    const cryptos = await Crypto.find({});
    return cryptos;
  } catch (error) {
    console.error("Error fetching crypto data:", error);
    return "Internal Server Error";
  }
};

const genrateOriginalUrls = async (urls) => {
  try {
    const fetch = (await import("node-fetch")).default;
    const idPattern = /\/news\/(\d+)\//;

    const result = await Promise.all(
      urls.map(async (inputUrl) => {
        // Apply the regular expression to the URL
        const match = inputUrl.match(idPattern);
        // Extract the ID from the match results
        const id = match ? match[1] : null;

        // First request to get the intermediate URL
        const intermediateResponse = await fetch(
          `https://cryptopanic.com/news/feed/click/${id}/`,
          {
            headers: {
              accept: "application/json, text/plain, */*",
              "accept-language": "en-US,en;q=0.9",
              "sec-ch-ua":
                '"Not/A)Brand";v="8", "Chromium";v="126", "Opera";v="112"',
              "sec-ch-ua-mobile": "?0",
              "sec-ch-ua-platform": '"winOS"',
              "sec-fetch-dest": "empty",
              "sec-fetch-mode": "cors",
              "sec-fetch-site": "same-origin",
              "x-csrftoken":
                "8VULXwzqUIFBwjfprHYCq4i9k71OIg8KKw1d6sAM2hySv5chC1e1CS2y3RvKkX3s",
              "x-requested-with": "XMLHttpRequest",
              Referer: "https://cryptopanic.com/",
              "Referrer-Policy": "unsafe-url",
            },
          }
        );
        if (!intermediateResponse.ok) {
          throw new Error(`HTTP error! status: ${intermediateResponse.status}`);
        }
        const intermediateData = await intermediateResponse.json();

        // Second request to get the final destination URL
        const finalResponse = await fetch(
          `https://cryptopanic.com/news/click/${id}/`,
          {
            redirect: "manual", // This prevents following redirects automatically
          }
        );
        if (finalResponse.status === 302) {
          const destinationUrl = finalResponse.headers.get("location");
          return destinationUrl;
        } else {
          throw new Error("Unable to retrieve destination URL");
        }
      })
    );

    return result;
  } catch (error) {
    console.error("Error:", error);
    return error;
  }
};

module.exports = {
  fetchCrypto,
  genrateOriginalUrls,
};

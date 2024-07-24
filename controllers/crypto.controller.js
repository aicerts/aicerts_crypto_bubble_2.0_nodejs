const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const cryptoService = require('../services/crypto.service');
const request = require('request');
const config = require('../config/config');

const fetchCrypto = catchAsync(async (req, res, next) => {
    try {
        const result = await cryptoService.fetchCrypto();
        res.status(200).send(result)
    } catch (error) {
        next(error)
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to fetch crypto data')
    }
});

const fetchImage = catchAsync(async (req, res, next) => {
    try {
        const { imageName } = req.params;
        // Replace with the actual URL where the image is hosted
        const imageUrl = `${config.source}/${imageName}`;
        request.get(imageUrl)
            .on('error', err => {
                console.error(`Error fetching image from ${imageUrl}:`, err);
                return res.status(404).json({ status: "FAILED", message: "Failed to fetch image" });
            })
            .on('response', response => {
                // Modify the response headers to show the desired URL
                response.headers['content-disposition'] = `inline; filename="${config.mask}/${imageName}"`;
            })
            .pipe(res);
    } catch (error) {
        next(error)
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to fetch image data')
    }
});

module.exports = {
    fetchCrypto,

    fetchImage
}
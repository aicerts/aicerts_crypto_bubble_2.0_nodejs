const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const cryptoService  = require('../services/crypto.service');

const fetchCrypto = catchAsync(async (req, res, next) => {
    try {
        const result = await cryptoService.fetchCrypto();
        res.status(200).send(result)
    } catch (error) {
        next(error)
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to fetch crypto data')
    }
})

module.exports = {
    fetchCrypto
}
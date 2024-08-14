const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const httpStatus = require("http-status");
const config = require("./config/config");
const morgan = require("./config/morgan");
const compression = require("compression");
const { errorConverter, errorHandler } = require("./middlewares/error");
const ApiError = require("./utils/ApiError");
const mongoSanitize = require("express-mongo-sanitize");
const routes = require("./routes");

const app = express();

app.use(morgan.successHandler);
app.use(morgan.errorHandler);

// app.use(helmet());

app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

app.use(mongoSanitize());

// app.use(compression())

// enable cors
app.use(cors());
app.options("*", cors());
// v1 api routes
app.use("/v1", routes);

// send back a 404 error for any unknown api request
// app.use((req, res, next) => {
//     next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
// });

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

module.exports = app;

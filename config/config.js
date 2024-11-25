const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');

dotenv.config();
const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(3000),
    MONGODB_URL: Joi.string().required().description('Mongo DB url'),
    SOURCE_URL: Joi.string().required().description('Source url'),
    REDIS_URL: Joi.string().required().description('Redis url'),
    CRYPTO_NEWS_URL: Joi.string().required().description("Crypto news url"),
    AI_IMAGE_URL:Joi.string().required().description("Ai image url")
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  mongoose: {
    url: envVars.MONGODB_URL + (envVars.NODE_ENV === 'test' ? '-test' : '')
  },
  source: envVars.SOURCE_URL,
  redis:{
    url: envVars.REDIS_URL
  },
  crypto_news_url:envVars.CRYPTO_NEWS_URL,
  // mask: envVars.MASKING_URL
  ai_image_url:envVars.AI_IMAGE_URL
};
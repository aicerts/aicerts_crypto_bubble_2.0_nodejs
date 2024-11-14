const redis = require("redis")
const config = require("./config")

const client = redis.createClient({
    url: config.redis.url
    // url:'redis://localhost:6380'
    
})

client.on('error', (err) => {
  //  console.log("error while connecting to redis server")
  });
  
client.connect();
  
module.exports = client;
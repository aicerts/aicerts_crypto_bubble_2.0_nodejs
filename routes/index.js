const express = require('express');
const cryptoRoute = require('./crypto.route');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/crypto',
    route: cryptoRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
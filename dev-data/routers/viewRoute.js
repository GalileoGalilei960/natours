const express = require('express');

const authController = require(`../controllers/authController`);
const viewController = require('../controllers/viewController');

const router = express.Router();

router.use(viewController.alerts);

router.get('/', authController.isLoggedIn, viewController.getOverview);

router.get('/tour/:slug', authController.isLoggedIn, viewController.getTour);
router.get('/login', authController.isLoggedIn, viewController.login);
router.get('/signup', viewController.signUp);
router.get('/me', authController.protect, viewController.getAccount);

router.get('/my-tours', authController.protect, viewController.getMyBookings);

module.exports = router;

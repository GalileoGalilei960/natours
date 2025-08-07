const express = require('express');

const authController = require(`../controllers/authController`);
const bookingController = require(`./../controllers/bookingController`);

const router = express.Router();

router.get(
    '/checkout-session/:id',
    authController.protect,
    bookingController.getCheckoutSession,
);
router.use(
    authController.protect,
    authController.restrictTo('lead-guide', 'guide', 'admin'),
);
router
    .route('/')
    .get(bookingController.getAllBookings)
    .post(
        authController.restrictTo('lead-guide', 'admin'),
        bookingController.createBooking,
    );
router.route('/:bookedTourId').get(bookingController.getAllBookings);
router.use(authController.restrictTo('admin'));
router
    .route('/:id')
    .patch(bookingController.updateBooking)
    .delete(bookingController.deleteBooking);

module.exports = router;

const express = require('express');

const authController = require(`../controllers/authController`);
const reviewController = require(`./../controllers/reviewController`);

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
    .route('/')
    .get(authController.restrictTo('admin'), reviewController.getAllReviews)
    .post(reviewController.setIdAndUser, reviewController.createReview);

router
    .route('/:id')
    .delete(reviewController.deleteReview)
    .patch(reviewController.patchReview)
    .get(reviewController.getReviewById);

module.exports = router;

const express = require('express');
const tourController = require('../controllers/tourController');

const authController = require(`../controllers/authController`);
const reviewRouter = require(`./reviewRoute`);
const router = express.Router();

// router.param('id', (req, res, next, val) => {
//     // tourController.checkTour(req, res, next, val);
//     next();
// });
router.route('/stats').get(tourController.tourStats);

router
    .route('/top-5-cheap')
    .get(tourController.aliasTop5Cheap, tourController.getAlltours);

router
    .route('/tours-within/:distance/center/:latlng/units/:unit')
    .get(tourController.getToursWithin);

router.route('/distances/:latlng/units/:unit').get(tourController.getDistances);

router
    .route('/')
    .get(tourController.getAlltours)
    .post(
        authController.protect,
        authController.restrictTo('lead-guide', 'admin'),
        tourController.uploadTourImages,
        tourController.resizeTourPhotos,
        tourController.postNewTour,
    );

router
    .route('/report/:year')
    .get(
        authController.protect,
        authController.restrictTo('guide', 'lead-guide', 'admin'),
        tourController.monthlyReport,
    );

router
    .route('/:id')
    .get(tourController.getTourByID)
    .patch(
        authController.protect,
        authController.restrictTo('lead-guide', 'admin'),
        tourController.uploadTourImages,
        tourController.resizeTourPhotos,
        tourController.patchTour,
    )
    .delete(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.deleteTour,
    );

router.use('/:tourId/review', reviewRouter);

module.exports = router;

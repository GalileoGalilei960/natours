// const catchAsync = require(`../utils/catchAsync`);
const Review = require(`./../../models/reviewModel`);
const handleFactory = require(`./handleFactory`);

exports.setIdAndUser = (req, res, next) => {
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user._id;

    next();
};

exports.getAllReviews = handleFactory.getAll(Review);

exports.createReview = handleFactory.createOne(Review);

exports.patchReview = handleFactory.patchOne(Review);

exports.deleteReview = handleFactory.deleteOne(Review);

exports.getReviewById = handleFactory.getOne(Review);

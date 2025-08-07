const catchAsync = require(`../utils/catchAsync`);
const Tour = require('../../models/tourModel');
const Booking = require('../../models/bookingModel');

const AppError = require(`../utils/appError`);

exports.getOverview = catchAsync(async (req, res) => {
    const tours = await Tour.find();

    res.status(200).render('overview', { title: 'All Tours', tours });
});

exports.getTour = catchAsync(async (req, res, next) => {
    const { slug } = req.params;
    const tour = await Tour.findOne({ slug }).populate({
        path: 'reviews',
        fields: 'review rating user',
    });

    if (!tour) next(new AppError("Can't find this tour", 400));

    res.status(200).render('tour', { title: `${tour.name} tour`, tour });
});

exports.login = (req, res, next) => {
    res.status(200).render('login', { title: 'Log into your account' });
};

exports.getAccount = (req, res, next) => {
    res.status(200).render('account', {
        title: 'me',
    });
};

exports.getMyBookings = catchAsync(async (req, res, next) => {
    const bookings = await Booking.find({ user: req.user.id });

    const toursIds = bookings.map((el) => el.tour);

    const tours = await Tour.find({ _id: { $in: toursIds } });

    res.status(200).render('overview', {
        title: 'All bookings',
        tours,
    });
});

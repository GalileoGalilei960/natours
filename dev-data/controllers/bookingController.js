const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const catchAsync = require(`../utils/catchAsync`);
const handleFactory = require(`./handleFactory`);
const Tour = require('../../models/tourModel');
const Booking = require('../../models/bookingModel');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    //get tour info
    const tour = await Tour.findById(req.params.id);
    //create session

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.id}&user=${req.user.id}&price=${tour.price}`,
        cancel_url: `${req.protocol}://${req.get('host')}/tours/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.id,
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `${tour.name} Tour`,
                        description: tour.summary,
                        images: [
                            `https://natours.dev/img/tours/${tour.imageCover}`,
                        ],
                    },
                    unit_amount: tour.price * 100,
                },
                quantity: 1,
            },
        ],
        mode: 'payment',
    });

    // send res

    res.json({
        status: 'success',
        session,
    });
});

exports.createBookingCheckout = async (req, res, next) => {
    const { price, tour, user } = req.query;

    if (!price || !tour || !user) return next();

    await Booking.create({ price, tour, user });

    res.redirect(req.originalUrl.split('?')[0]);
};

exports.getAllBookings = handleFactory.getAll(Booking);
exports.getBookingById = handleFactory.getOne(Booking, 'user tour');
exports.createBooking = handleFactory.createOne(Booking);
exports.updateBooking = handleFactory.patchOne(Booking);
exports.deleteBooking = handleFactory.deleteOne(Booking);

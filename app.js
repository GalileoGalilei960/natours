const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const XSS = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');

const AppError = require(`./dev-data/utils/appError.js`);
const errorController = require(`./dev-data/controllers/errorController.js`);
const tourRouter = require(`./dev-data/routers/tourRoute.js`);
const userRouter = require(`./dev-data/routers/userRoute.js`);
const reviewRouter = require(`./dev-data/routers/reviewRoute.js`);
const bookingRouter = require(`./dev-data/routers/bookingRoute.js`);
const viewRouter = require(`./dev-data/routers/viewRoute.js`);
const bookingController = require(
    `./dev-data/controllers/bookingController.js`,
);

const limiter = rateLimit({
    max: 1000,
    WindowMs: 60 * 60 * 1000,
    message: 'Too many requests, try again  next hour',
});

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// set security http headers

app.use(cors());
app.options('*', cors());

app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: [
                    "'self'",
                    'https://api.mapbox.com',
                    'https://cdnjs.cloudflare.com',
                    'https://js.stripe.com',
                    'blob:',
                ],
                frameSrc: ['https://js.stripe.com'],
                frameAncestors: ["'self'"],
                workerSrc: ["'self'", 'blob:'],
                styleSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    'https://api.mapbox.com',
                    'https://fonts.googleapis.com',
                ],
                fontSrc: ["'self'", 'https://fonts.gstatic.com'],
                imgSrc: [
                    "'self'",
                    'data:',
                    'https://api.mapbox.com',
                    'https://images.unsplash.com',
                ],
                connectSrc: [
                    "'self'",
                    'https://api.mapbox.com',
                    'https://events.mapbox.com',
                    'https://js.stripe.com',
                    'ws:',
                ],
            },
        },
    }),
);

// set limit af requests from ip
app.use(limiter);

app.use(
    '/checkout-webhook',
    express.raw({ type: 'application/json' }),
    bookingController.checkoutWebhook,
);

// use deep body parser for jsons
app.set('query parser', 'extended');
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

//sanitizing data against noSQL injections
app.use(mongoSanitize());

//sanitizing data aginst XSS atacks
app.use(XSS());

//preventing parameter pollution
app.use(
    hpp({
        whitelist: [
            'duration',
            'ratingsQuantity',
            'ratingsAverage',
            'maxGroupSize',
            'difficulty',
            'price',
        ],
    }),
);

app.use(compression());

// serve static files
app.use(express.static(path.join(__dirname, 'public')));

// routers
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/', viewRouter);

// for wrong paths
app.all(/.*/, (req, res, next) => {
    const err = new AppError(`Can't find route ${req.originalUrl}`, 404);

    next(err);
});

// error middleware
app.use(errorController);

module.exports = app;

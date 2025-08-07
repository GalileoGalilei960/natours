/* eslint-disable import/no-extraneous-dependencies, node/no-extraneous-require */
const multer = require('multer');
const sharp = require('sharp');

const AppError = require(`../utils/appError`);
const catchAsync = require(`../utils/catchAsync`);
const handleFactory = require(`./handleFactory`);
const Tour = require('../../models/tourModel');

// const APIFeatures = require('../utils/apiFeatures');
// const User = require('../../models/userModel');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('You can upload only images', 400), false);
    }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadTourImages = upload.fields([
    {
        name: 'imageCover',
        maxCount: 1,
    },
    {
        name: 'images',
        maxCount: 3,
    },
]);

exports.resizeTourPhotos = async (req, res, next) => {
    if (!req.files || !req.files.imageCover || !req.files.images) return next();

    req.body.imageCover = `tour-${req.params.id}-cover.jpg`;

    await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat('jpg')
        .jpeg({ quality: 100 })
        .toFile(`public/img/tours/tour-${req.params.id}-cover.jpg`);

    req.body.images = await Promise.all(
        req.files.images.map(async (el, i) => {
            const filename = `tour-${req.params.id}-${i + 1}.jpg`;

            await sharp(el.buffer)
                .resize(2000, 1333)
                .toFormat('jpg')
                .jpeg({ quality: 100 })
                .toFile(`public/img/tours/${filename}`);

            return filename;
        }),
    );

    next();
};

exports.aliasTop5Cheap = (req, res, next) => {
    req.url = '/?sort=price,-ratingsAverage&limit=5';

    next();
};

exports.getAlltours = handleFactory.getAll(Tour);

exports.postNewTour = handleFactory.createOne(Tour);

exports.getTourByID = handleFactory.getOne(Tour, 'reviews');

exports.patchTour = handleFactory.patchOne(Tour);

exports.deleteTour = handleFactory.deleteOne(Tour);

exports.tourStats = catchAsync(async (req, res) => {
    const stats = await Tour.aggregate([
        {
            $match: {
                price: {
                    $gte: 0,
                },
            },
        },
        {
            $group: {
                _id: '$difficulty',
                avgPrice: {
                    $avg: '$price',
                },
                count: {
                    $sum: 1,
                },
            },
        },
        {
            $sort: {
                avgPrice: -1,
            },
        },
    ]);
    res.status(200).json({
        status: 'success',
        data: {
            stats,
        },
    });
});

exports.monthlyReport = catchAsync(async (req, res) => {
    let { year } = req.params;
    year *= 1;

    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates',
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`),
                },
            },
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                count: {
                    $sum: 1,
                },
                tours: {
                    $push: '$name',
                },
            },
        },
        {
            $addFields: {
                month: '$_id',
            },
        },
        {
            $project: {
                _id: 0,
            },
        },
        {
            $sort: {
                _id: 1,
            },
        },
    ]);

    res.status(200).json({
        status: 'success',
        results: plan.length,
        data: {
            plan,
        },
    });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
    const { distance, latlng, units } = req.params;
    let [lat, lng] = latlng.split(',');

    lat *= 1;
    lng *= 1;

    if (!lat || !lng) {
        return next(AppError('Provide coordinates in format lat,lng', 400));
    }

    const radius = units === 'km' ? distance / 6378.1 : distance / 3963.2;

    const tour = await Tour.find({
        startLocation: {
            $geoWithin: {
                $centerSphere: [[lng, lat], radius],
            },
        },
    });

    res.status(200).json({
        status: 'success',
        results: tour.length,
        data: {
            tour,
        },
    });
});

exports.getDistances = catchAsync(async (req, res, next) => {
    const { latlng, unit } = req.params;
    let [lat, lng] = latlng.split(',');

    lat *= 1;
    lng *= 1;

    if (!lat || !lng) {
        return next(AppError('Provide coordinates in format lat,lng', 400));
    }

    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [lng, lat],
                },
                distanceField: 'distances',
                distanceMultiplier: unit === 'km' ? 1 / 1000 : 1 / 1609.34,
            },
        },
        {
            $project: {
                distances: 1,
                name: 1,
            },
        },
    ]);

    res.status(200).json({
        status: 'success',
        results: distances.length,
        data: {
            distances,
        },
    });
});

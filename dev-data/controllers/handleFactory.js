const AppError = require(`../utils/appError`);
const catchAsync = require(`../utils/catchAsync`);
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const Element = await Model.findByIdAndDelete(req.params.id);

        if (!Element) {
            return next(
                new AppError("Document with this id doesn't exist", 404),
            );
        }

        res.status(204).send({
            status: 'success',
            data: null,
        });
    });

exports.patchOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const updatedDoc = await Model.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            },
        );

        if (!updatedDoc) {
            return next(
                new AppError("Document with this id doesn't exist", 404),
            );
        }

        res.status(200).json({
            status: 'success',
            data: {
                updatedDoc,
            },
        });
    });

exports.createOne = (Model) =>
    catchAsync(async (req, res) => {
        const newDoc = await Model.create(req.body);
        res.status(201).json({
            status: 'success',
            data: {
                newDoc,
            },
        });
    });

exports.getOne = (Model, popOptions) =>
    catchAsync(async (req, res, next) => {
        let query;
        if (req.params.bookedTourId) {
            query = Model.findOne({ tour: req.params.bookedTourId });
            if (popOptions)
                query.populate({
                    path: popOptions,
                });
        } else {
            query = Model.findById(req.params.id);
            if (popOptions)
                query.populate({
                    path: popOptions,
                });
        }

        const docByID = await query;

        if (!docByID) {
            return next(
                new AppError("Document with this id doesn't exist", 404),
            );
        }

        res.status(200).json({
            satus: 'success',
            data: {
                docByID,
            },
        });
    });

exports.getAll = (Model) =>
    catchAsync(async (req, res) => {
        const filter = {};
        if (req.params.tourId) filter.tour = req.params.tourId;

        const apiFeatures = new APIFeatures(Model.find(filter), req.query)
            .filter()
            .sort()
            .limit()
            .pagination();

        const doc = await apiFeatures.query;

        res.status(200).json({
            status: 'success',
            results: doc.length,
            data: {
                doc,
            },
        });
    });

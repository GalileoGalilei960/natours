const mongoose = require('mongoose');

const Tour = require(`./tourModel`);
const reviewSchema = new mongoose.Schema(
    {
        review: {
            type: String,
            maxLength: 1000,
        },
        rating: {
            type: Number,
            required: [true, 'Review must have rating'],
            max: 5,
            min: 1,
            set: (val) => Math.round(val * 10) / 10,
        },
        createdAt: {
            type: Date,
            default: new Date(Date.now()).toISOString(),
        },
        tour: {
            type: mongoose.Schema.ObjectId,
            ref: 'Tours',
            required: [true, 'Review must have tour'],
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'Users',
            required: [true, 'Review must have user'],
        },
    },
    { toJSON: { virtuals: true }, toObject: { virtuals: true } },
);
reviewSchema.index({ user: 1, tour: 1 }, { unique: true });

reviewSchema.statics.calcAverageRatings = async function (tourId) {
    const stats = await this.aggregate([
        { $match: { tour: tourId } },
        {
            $group: {
                _id: tourId,
                nRating: { $sum: 1 },
                avRating: { $avg: '$rating' },
            },
        },
    ]);

    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avRating,
        });
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingQuantity: 0,
            ratingsAverage: 4.5,
        });
    }
};

reviewSchema.post('save', async function () {
    await this.constructor.calcAverageRatings(this.tour);
});

reviewSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'user',
        select: 'name photo',
    });

    next();
});

reviewSchema.post(/^findOneAnd/, (doc) => {
    if (doc) doc.constructor.calcAverageRatings(doc.tour);
});

module.exports = mongoose.model('reviews', reviewSchema);

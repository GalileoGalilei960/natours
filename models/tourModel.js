const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'A tour must have a name'],
            unique: true,
            trim: true,
            maxlength: [40, 'A tour name must be shorter than 40 characters'],
            minlength: [1, 'A tour name must have at least 1 character'],
        },
        slug: String,
        duration: {
            type: Number,
            required: [true, 'A tour must have a duration'],
        },
        maxGroupSize: {
            type: Number,
            required: [true, 'A tour must have a group size'],
        },
        ratingsAverage: {
            type: Number,
            default: 1,
            min: [1, 'rating must be greater than 1'],
            max: [5, 'rating must be less than 5'],
        },
        ratingQuantity: {
            type: Number,
            default: 0,
        },
        difficulty: {
            type: String,
            required: [true, 'A tour must have a difficulty'],
            enum: {
                values: ['easy', 'medium', 'difficult'],
                message: 'difficulty must be easy, medium or difficult',
            },
        },
        price: {
            type: Number,
            required: [true, 'A tour must have a price'],
        },
        priceDiscount: {
            type: Number,
            validate: {
                message: "discount can't be bigger than price",
                validator: function (val) {
                    return this.price > val;
                },
            },
        },
        summary: {
            type: String,
            trim: true,
            required: [true, 'A tour must have a summary'],
        },
        description: {
            type: String,
            trim: true,
        },
        imageCover: {
            type: String,
            required: [true, 'A tour must have a cover image'],
        },
        images: [String],
        createdAt: {
            type: Date,
            default: Date.now(),
            select: false,
        },
        startDates: [Date],
        startLocation: {
            type: {
                type: String,
                default: 'Point',
                enum: 'Point',
            },
            coordinates: [Number],
            adress: String,
            description: String,
        },
        locations: [
            {
                type: {
                    type: String,
                    default: 'Point',
                    enum: 'Point',
                },
                coordinates: [Number],
                adress: String,
                description: String,
                day: Number,
            },
        ],
        guides: [{ type: mongoose.Schema.ObjectId, ref: 'Users' }],
        secret: Boolean,
    },
    { toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7;
});

tourSchema.virtual('reviews', {
    ref: 'reviews',
    foreignField: 'tour',
    localField: '_id',
});

tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

tourSchema.post('save', (doc, next) => {
    // console.log(doc);
    next();
});

//for embedding guides
// tourSchema.pre('save', async function (next) {
//     this.guides = await Promise.all(
//         this.guides.map(async (el) => await User.findById(el)),
//     );

//     next();
// });

tourSchema.pre(/^find/, function (next) {
    this.find({
        secret: {
            $ne: true,
        },
    }).populate({ path: 'guides', select: '-__v -changedPassword' });
    // .populate('reviews');

    this._timeStamp = Date.now();
    next();
});

tourSchema.post(/^find/, (docs, next) => {
    // console.log(
    //     `processing ${docs ? docs.length : 0} documents took ${this._timeStamp - Date.now()} millseconds`,
    // );
    next();
});

// tourSchema.pre('aggregate', function (next) {
//     this._pipeline.unshift({
//         $match: {
//             secret: {
//                 $ne: true,
//             },
//         },
//     });
//     next();
// });

const Tour = mongoose.model('Tours', tourSchema);

module.exports = Tour;

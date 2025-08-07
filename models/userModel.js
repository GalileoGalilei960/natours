const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const catchAsync = require('../dev-data/utils/catchAsync');
// const { resetPassword } = require('../dev-data/controllers/authController');
// const { stringify } = require('querystring');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'User must have a name'],
        trim: true,
        max: [20, 'Name must be shorter than 20 characters'],
    },
    email: {
        type: String,
        required: [true, 'User must have a email'],
        trim: true,
        unique: true,
        validate: [validator.isEmail, 'Wrong email'],
    },
    photo: {
        type: String,
        default: 'default.jpg',
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user',
    },
    password: {
        type: String,
        required: [true, 'User must have a password'],
        minlength: [8, 'Password must be longer than 8 characters'],
        select: false,
    },
    passwordConfirm: {
        type: String,
        required: [true, 'User must have a password confirm'],
        validate: {
            validator: function (el) {
                return el === this.password;
            },
            message: 'Passwords must match',
        },
    },
    changedPassword: Date,
    resetPasswordToken: String,
    passwordResetExpiresIn: Date,
    active: {
        type: Boolean,
        default: true,
        select: false,
    },
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;

    next();
});

userSchema.methods.correctPassword = catchAsync(
    async (candidatePassword, hashPassword) =>
        await bcrypt.compare(candidatePassword, hashPassword),
);

userSchema.methods.changedPasswordAfter = function (JWTtimeStamp) {
    if (this.changedPassword) {
        return this.changedPassword.getTime() / 1000 > JWTtimeStamp;
    }

    return false;
};

userSchema.methods.createResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.passwordResetExpiresIn = Date.now() + 10 * 1000 * 60;

    return resetToken;
};

userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();

    this.changedPassword = Date.now() - 1000;

    next();
});

userSchema.pre(/\bfind/, function (next) {
    this.find({
        active: {
            $ne: false,
        },
    });

    next();
});

const UserModel = mongoose.model('Users', userSchema);

module.exports = UserModel;

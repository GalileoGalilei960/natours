const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const User = require(`./../../models/userModel`);
const catchAsync = require(`./../utils/catchAsync`);
const AppError = require(`./../utils/appError`);
const Email = require('../utils/mail');

const cookieOption = {
    expires: new Date(
        Date.now() +
            Number(process.env.COOKIE_JWT_EXPIRES_IN) * 24 * 60 * 60 * 1000,
    ),
    // secure: true,
    httpOnly: true,
};

if (process.env.NODE_ENV === 'production') cookieOption.secure = true;

const signToken = (load) =>
    jwt.sign(load, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });

const createSendToken = (user, status, res) => {
    const token = signToken({ id: user._id });

    res.cookie('jwt', token, cookieOption);

    res.status(status).json({
        status: 'success',
        token,
        user,
    });
};

exports.signUp = catchAsync(async (req, res, next) => {
    const filteredParams = {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        photo: req.file ? req.file.filename : undefined,
    };

    const newUser = await User.create(filteredParams);

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.cookie('jwt', token, cookieOption);

    newUser.password = undefined;

    await new Email(
        newUser,
        `${req.protocol}://${req.get('host')}`,
    ).sendWelcome();

    res.status(201).json({
        status: 'success',
        token,
        data: {
            newUser,
        },
    });
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    // console.log(email, password);

    if (!email || !password) {
        return next(new AppError('Provide an email and a password', 400));
    }

    const user = await User.findOne({ email }).select('+password');

    // console.log(password, user);

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }

    createSendToken(user, 200, res);
});

exports.logout = (req, res, next) => {
    res.cookie('jwt', 'Logged Out', {
        expiresIn: new Date(Date.now() - 1000),
    });

    res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        /\bBearer /.test(req.headers.authorization)
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) token = req.cookies.jwt;

    if (!token) return next(new AppError("You're not log in", 401));

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const freshUser = await User.findById(decoded.id);

    if (!freshUser) {
        return next(new AppError('User with this token no longer exists', 401));
    }

    if (freshUser.changedPasswordAfter(decoded.iat)) {
        return next(
            new AppError(
                'Password was changed after the token creation, log in again',
                401,
            ),
        );
    }

    req.user = freshUser;
    res.locals.user = freshUser;

    next();
});

exports.isLoggedIn = async (req, res, next) => {
    if (req.cookies.jwt) {
        try {
            // 1) verify token
            const decoded = await promisify(jwt.verify)(
                req.cookies.jwt,
                process.env.JWT_SECRET,
            );

            // 2) Check if user still exists
            const currentUser = await User.findById(decoded.id);
            if (!currentUser) {
                return next();
            }

            // 3) Check if user changed password after the token was issued
            if (currentUser.changedPasswordAfter(decoded.iat)) {
                return next();
            }

            // THERE IS A LOGGED IN USER
            res.locals.user = currentUser;
            return next();
        } catch (err) {
            return next();
        }
    }
    next();
};

exports.restrictTo =
    (...roles) =>
    (req, res, next) => {
        if (!roles.includes(req.user.role))
            next(new AppError("You don't have right's to do this action", 403));

        next();
    };

exports.forgotPassword = catchAsync(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
    //Check whether user exists
    if (!user)
        return next(
            new AppError('User connected to this email does not exist', 404),
        );

    //token creation
    const resetToken = user.createResetPasswordToken();

    await user.save({
        validateBeforeSave: false,
    });

    //email sent
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

    // const message = `Forgot your password?\nSubmit PATCH request on this link with your new password and password confirm to: ${resetURL}\nBut hurry up, YOU have just 10 minutes before reset expires\nIf you didn't forget your password than ignore this email!`;

    // try {
    await new Email(user, resetURL).sendPasswordReset();
    // } catch (err) {
    //     user.resetPasswordToken = undefined;
    //     user.passwordResetExpiresIn = undefined;

    //     return next(
    //         new AppError(
    //             'There was error while sending an email, please try again later',
    //             500,
    //         ),
    //     );
    // }

    await user.save({
        validateBeforeSave: false,
    });

    res.status(200).send({
        status: 'success',
        message: 'Token has been sent to the email',
    });
    // next();
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    //Get user by the token
    const { token } = req.params;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
        resetPasswordToken: hashedToken,
        passwordResetExpiresIn: { $gt: Date.now() },
    });

    if (!user)
        return next(
            new AppError('Reset password token is invalid or expired', 400),
        );

    //Update users password

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetExpiresIn = undefined;
    user.resetPasswordToken = undefined;

    await user.save();

    const jwtToken = signToken({ id: user._id });

    res.cookie('jwt', token, cookieOption);

    res.status(200).json({
        status: 'success',
        token: jwtToken,
    });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    //1. Get the user
    const user = await User.findOne({ _id: req.user._id }).select('+password');

    if (!user) {
        return next(new AppError('User with this email not found', 404));
    }

    // console.log('req', req.body);
    // console.log('user', user);

    //2. Ask for an old password and check it if it is valid

    if (!(await user.correctPassword(req.body.password, user.password))) {
        return next(new AppError('Incorrect password', 401));
    }

    //3. Change the password

    user.password = req.body.newPassword;
    user.passwordConfirm = req.body.confirmNewPassword;

    await user.save();

    //4. Give user new JWT

    const token = signToken({ id: user._id });

    res.cookie('jwt', token, cookieOption);

    res.status(200).json({
        status: 'success',
        token: token,
    });
});

const AppError = require(`./../utils/appError`);

const sendDevError = (err, req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            error: err,
            stack: err.stack,
        });
    } else {
        // console.log(err);
        res.status(err.statusCode).render('error', {
            title: 'Something went wrong',
            msg: err.message,
        });
    }
};

const sendProdError = (err, req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            });
        }
        console.error(`ERROR!!!!!!
        ${err.message}
        ${err}
        ${err.stack}
        !!!!!!ERROR`);

        res.status(500).json({
            status: 'error',
            message: 'Something went wrong',
        });
    } else {
        res.status(err.statusCode).render('error', {
            title: 'Something went wrong',
            msg: err.isOperational ? err.message : 'Try again later',
        });
    }
};

const handleCastErrDB = function (err) {
    const message = `Wrong ${err.path} with value ${err.value}`;
    return new AppError(message, 400);
};

const handleDuplicateNameDB = (err) => {
    const message = `A element with name '${err.errmsg.match(/(?<=").*(?=")/)}' already exists`;
    return new AppError(message, 400);
};

const handleValidationErrDB = (err) => {
    const errors = Object.values(err.errors)
        .map((el) => el.message)
        .join(', ');

    const message = `${errors}`;
    return new AppError(message, 400);
};

const handleJsonWebTokenError = () =>
    new AppError('Invalid token,please log in again', 401);

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    // let err = { ...err };

    if (err.name === 'CastError') {
        err = handleCastErrDB(err);
    } else if (err.code === 11000) {
        err = handleDuplicateNameDB(err);
    } else if (err.name === 'ValidationError') {
        err = handleValidationErrDB(err);
    } else if (err.name === 'JsonWebTokenError') {
        err = handleJsonWebTokenError(err);
    } else if (err.name === 'TokenExpiredError') {
        err = new AppError('Your log in expired, please log in again', 401);
    }

    if (process.env.NODE_ENV === 'development') {
        sendDevError(err, req, res);
    } else if (process.env.NODE_ENV === 'production') {
        sendProdError(err, req, res);
    }
};

/* eslint-disable import/no-extraneous-dependencies, node/no-extraneous-require */
const AppError = require(`../utils/appError`);
const catchAsync = require(`../utils/catchAsync`);
const User = require(`./../../models/userModel`);
const handleFactory = require(`./handleFactory`);
const multer = require('multer');
const sharp = require('sharp');

// const multerStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'public/img/users');
//     },
//     filename: (req, file, cb) => {
//         const ext = file.mimetype.split('/')[1];
//         cb(
//             null,
//             `user-${req.user ? req.user._id : Math.random()}-${Date.now()}.${ext}`,
//         );
//     },
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('You can upload only images', 400), false);
    }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = async (req, res, next) => {
    if (!req.file) return next();

    req.file.filename =
        req.user && req.user.photo !== 'default.jpg'
            ? req.user.photo
            : `user-${Math.random()}.jpg`;

    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/users/${req.file.filename}`);

    next();
};

const filterReqBody = (reqBody, ...params) => {
    const filtered = {};
    params.forEach((el) => {
        filtered[el] = reqBody[el];
    });
    return filtered;
};

exports.getMe = (req, res, next) => {
    req.params.id = req.user._id;

    next();
};

exports.getAllUsers = handleFactory.getAll(User);

exports.getUserByID = handleFactory.getOne(User);

exports.patchUser = handleFactory.patchOne(User);

exports.deleteUser = handleFactory.deleteOne(User);

exports.updateMe = catchAsync(async (req, res, next) => {
    if (req.body.password || req.body.confirmPassword)
        return next(
            new AppError(
                "You can't update the password here in this route, please use /updatePassword",
                400,
            ),
        );

    const updatedParameters = filterReqBody(req.body, 'name', 'email');
    if (req.file) updatedParameters.photo = req.file.filename;

    const updatedUser = await User.findByIdAndUpdate(
        { _id: req.user._id },
        updatedParameters,
        { new: true, runValidators: true },
    );

    res.status(200).json({ status: 'success', data: { updatedUser } });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
    const user = await User.findByIdAndUpdate(req.user._id, { active: false });

    user.active = false;

    res.status(204).send({
        status: 'success',
        data: null,
    });
});

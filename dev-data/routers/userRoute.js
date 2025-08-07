const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post(
    '/signup',
    userController.uploadUserPhoto,
    userController.resizeUserPhoto,
    authController.signUp,
);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

//restricted only to authenticated
router.use(authController.protect);

router.patch('/updatePassword', authController.updatePassword);

router
    .route('/me')
    .get(userController.getMe, userController.getUserByID)
    .patch(
        userController.uploadUserPhoto,
        userController.resizeUserPhoto,
        userController.updateMe,
    )
    .delete(userController.deleteMe);

router
    .route('/')
    .get(authController.restrictTo('admin'), userController.getAllUsers);

//restricted only to admins
router.use(authController.restrictTo('admin'));

router
    .route('/:id')
    .get(userController.getUserByID)
    .patch(userController.patchUser)
    .delete(userController.deleteUser);

module.exports = router;

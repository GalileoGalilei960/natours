const fs = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const Review = require(`./../../models/reviewModel`);
const User = require(`./../../models/userModel`);
const Tour = require('../../models/tourModel');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE;

if (process.argv[2] === '--import') {
    (async function () {
        const tours = JSON.parse(
            fs.readFileSync('./dev-data/data/tours.json', 'utf-8'),
        );

        const users = JSON.parse(
            fs.readFileSync('./dev-data/data/users.json', 'utf-8'),
        );

        const reviews = JSON.parse(
            fs.readFileSync('./dev-data/data/reviews.json', 'utf-8'),
        );

        await mongoose
            .connect(DB, {})
            .then(() => console.log('DataBase is running'));

        await Tour.create(tours);
        await User.create(users, { validateBeforeSave: false });
        await Review.create(reviews, { validateBeforeSave: false });

        await mongoose.disconnect();
        console.log('All data successfully written to the DB');
    })();
} else if (process.argv[2] === '--delete') {
    (async function () {
        await mongoose
            .connect(DB, {})
            .then(() => console.log('DataBase is running'));

        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();

        await mongoose.disconnect();
        console.log('All data successfully deleted');
        // process.abort();
    })();
} else console.log('Wrong arguments');

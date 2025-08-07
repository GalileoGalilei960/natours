const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: './config.env' });

// process.on('uncaughtException', (err) => {
//     console.log(err.name, '\n', err.message);

//     console.log('SERVER SHUTTING DOWN!');
//     process.exit(1);
// });

const app = require('./app');

const DB = process.env.DATABASE;

// console.log(process.env);

mongoose.connect(DB, {}); //.then(() => console.log('DataBase is running'));

const server = app.listen(3000, () =>
    // console.log(`The app is listening on port 3000...`),
);

process.on('unhandledRejection', (err) => {
    // console.log(err.name, '\n', err.message, '\n', err.stack);
    server.close(() => {
        console.log('SERVER SHUTTING DOWN');
        process.exit(1);
    });
});

// console.log(r);r
//hiiiiiii

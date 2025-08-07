const nodemailer = require('nodemailer');
const pug = require('pug');
const htlToText = require('html-to-text');
const path = require('path');

// const catchAsync = require(`./catchAsync`);

module.exports = class {
    constructor(user, url) {
        this.to = user.email;
        this.firsname = user.name.split(' ')[0];
        this.url = url;
        this.from = `Ostap Haladii <${process.env.EMAIL}>`;
    }

    newTransport() {
        if (process.env.NODE_ENV === 'production') {
            return nodemailer.createTransport({
                service: 'sendgrid',
                auth: {
                    user: process.env.EMAIL_USERNAME_SENDGRID,
                    pass: process.env.EMAIL_PASSWORD_SENDDRIG,
                },
            });
        }
        return nodemailer.createTransport({
            host: 'sandbox.smtp.mailtrap.io',
            port: 2525,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    }

    async send(template, subject) {
        //render html
        const html = pug.renderFile(
            path.join(
                __dirname,
                '..',
                '..',
                'views',
                'email',
                `${template}.pug`,
            ),
            {
                firstName: this.firstName,
                url: this.url,
                subject,
            },
        );

        //define email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject: subject,
            html,
            text: htlToText.htmlToText(html),
        };
        //create transport and send email
        await this.newTransport().sendMail(mailOptions);
    }

    async sendWelcome() {
        await this.send('welcome', 'Welcome to the Natours family!');
    }

    async sendPasswordReset() {
        await this.send(
            'passwordReset',
            'Your password reset token (valid for only 10 minutes)',
        );
    }
};

// const sendEmail = catchAsync(async (options) => {
//     // Looking to send emails in production? Check out our Email API/SMTP product!
//     const transport = nodemailer.createTransport({
//         host: 'sandbox.smtp.mailtrap.io',
//         port: 2525,
//         auth: {
//             user: '4099d3a4885b66',
//             pass: '82c26184964c7f',
//         },
//     });

//     const mailOptions = {
//         from: `Ostap Haladii <${process.env.EMAIL}>`,
//         to: options.email,
//         subject: options.subject,
//         text: options.message,
//     };

//     await transport.sendMail(mailOptions);
// });
// module.exports = sendEmail;

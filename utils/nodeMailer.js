require('dotenv').config();

// Dependencies
const nodemailer = require('nodemailer')

// email form
const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.eu',
    port: 465,
    secure: true,
    auth: {
        user: process.env.emailUser,
        pass: process.env.emailPassword
    },
});

let Nodemailer = async function (emailName, emailAddress, emailContent) {

    const mailOptions = {
        from: process.env.emailUser, // sender address from the form
        to: "camsjobhunting@gmail.com", // my address
        subject: `Message from ${emailName}`, // Subject line
        text: `response address: ${emailAddress}, from: ${emailName},Content: ${emailContent}`, // plain text body
        html: `<h2>Email from:</h2> <br>${emailName}
            <h2>Return address:</h2> <br>${emailAddress}
            <h2>Content: </h2> <br> <p>${emailContent}</p>`
    };

    // Send the email
    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending email:', error);
    }

}

module.exports = Nodemailer;
require('dotenv').config();

// Dependencies
const express = require('express');
const app = express();
const path = require('path');
const ejsMate = require('ejs-mate');
const Joi = require('joi');
const Nodemailer = require('./utils/nodeMailer');

// Middleware setup
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    const title = 'Home'
    res.render('home', {title});
});
app.get('/blank', (req, res) => {
    const title = 'blank'
    res.render('blank', {title});
});
app.get('/portfolio', (req, res) => {
    const title = 'portfolio'
    res.render('portfolio/portfolio', {title});
});
app.get('/contact', (req, res) => {
    const title = 'contact'
    res.render('contact/contact', {title});
});

app.post('/email', async (req, res) => {
    try {
        // Check for honeypot
        if (req.body.honeypot) {
            // If honeypot is filled out, it's probably a bot.
            return res.status(400).redirect("/emailFail");
        }

        // reCAPTCHA check
        const response_key = req.body["g-recaptcha-response"];
        const secret_key = process.env.recaptchaSecret;

        const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secret_key}&response=${response_key}`;

        // Making POST request to verify captcha
        const google_response = await fetch(url, { method: "post" }).then(response => response.json());

        if (google_response.success) {
            // Captcha is verified
            const { emailName, emailAddress, emailContent } = req.body;

            try {
                // Send email
                await Nodemailer(emailName, emailAddress, emailContent);
                return res.status(200).redirect("/emailSuccess");
            } catch (error) {
                console.error("Error sending email: 📨❌", error);
                return res.status(500).redirect("/emailFail");
            }
        } else {
            // If captcha is not verified
            console.error("Failed to verify reCAPTCHA.");
            return res.status(500).redirect("/emailFail");
        }
    } catch (error) {
        // Handle any other errors
        console.error("Error processing request: ", error);
        return res.status(500).redirect("/emailFail");
    }
});

app.get('/emailSuccess', (req, res) => {
    const title = "Email Success!"
    res.render('contact/emailSentSuccess', { title})
})

app.get('/emailFail', (req, res) => {
    const title = "Email Failed to send :("
    res.render('contact/emailSentFail', { title})
})

// 404 handling
app.all('*', (req, res, next) => {
    next(new Error('Page Not Found'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Something Went Wrong :(';
    res.status(statusCode).render('error', { err });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
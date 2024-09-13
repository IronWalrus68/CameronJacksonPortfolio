require('dotenv').config();

// Dependencies
const express = require('express');
const app = express();
const path = require('path');
const ejsMate = require('ejs-mate');
const Joi = require('joi');
const Nodemailer = require('./utils/nodeMailer');
const reCAPTCHA = require('./utils/reCAPTCHA_V2');

// Middleware setup
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    const title = 'Home'
    res.render('home', { title });
});
app.get('/blank', (req, res) => {
    const title = 'blank'
    res.render('blank', { title });
});
app.get('/portfolio', (req, res) => {
    const title = 'portfolio'
    res.render('portfolio/portfolio', { title });
});
app.get('/contact', (req, res) => {
    const title = 'contact'
    res.render('contact/contact', { title });
});

app.post('/email', async (req, res) => {
    // Check for honeypot
    if (req.body.honeypot) {
        // If honeypot is filled out, the user is probably a bot.
        return res.status(400).redirect("/emailFail");
    }
    const response_key = req.body["g-recaptcha-response"];
    const { emailName, emailAddress, emailContent } = req.body;
    try {
        await reCAPTCHA(response_key)
        await Nodemailer(emailName, emailAddress, emailContent);
        return res.status(200).redirect("/emailSuccess");
    } catch (err) {
        console.log("error with either checking reCAPTCHA or sending mail")
        console.log(err)
        return res.status(500).redirect("/emailFail");
    }
});

app.get('/emailSuccess', (req, res) => {
    const title = "Email Success!"
    res.render('contact/emailSentSuccess', { title })
})

app.get('/emailFail', (req, res) => {
    const title = "Email Failed to send :("
    res.render('contact/emailSentFail', { title })
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
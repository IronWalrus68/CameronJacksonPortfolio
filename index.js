require('dotenv').config();

// Dependencies
const express = require('express');
const app = express();
const path = require('path');
const ejsMate = require('ejs-mate');
const Joi = require('joi'); // Ready for schema validations later
const nodemailer = require('nodemailer');
const axios = require('axios');

// Middleware setup
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// GET Routes
app.get('/', (req, res) => {
    res.render('home', { title: 'Home' });
});
app.get('/mc', (req, res) => {
    res.render('mc', { title: 'PPP MC!' });
});
app.get('/pricing', (req, res) => {
    res.render('pricing', { title: 'Pricing' });
});
app.get('/pat-info', (req, res) => {
    res.render('pat-info', { title: 'PAT Info' });
});
app.get('/contact', (req, res) => {
    res.render('contact', { title: 'Contact' });
});
app.get('/terms', (req, res) => {
    res.render('terms', { title: 'Terms & Conditions' });
});
app.get('/booking', (req, res) => {
    res.render('booking', { title: 'Booking' });
});
app.get('/blank', (req, res) => {
    res.render('blank', { title: 'Blank' });
});

// POST Route: Appointment Submissions (Fixed from router to app)
app.post('/request-appointment', async (req, res) => {
    const { email, date, itemCount, message, 'g-recaptcha-response': captchaResponse } = req.body;

   // 1. Double-check Server-side Google reCAPTCHA validation
if (!captchaResponse) {
    return res.status(400).send("Please complete the anti-spam reCAPTCHA verification.");
}

try {
    // FIX: Make sure axios POSTs data exactly to the subpath, not the root domain
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify`;
    
    const recaptchaCheck = await axios({
        method: 'post',
        url: verifyUrl,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        data: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaResponse}`
    });
    
    if (!recaptchaCheck.data.success) {
        return res.status(400).send("reCAPTCHA validation failed. Bots are blocked.");
    }

    // 2. Setup your Nodemailer transporter parameters for Zoho EU...

        const mailTransporter = nodemailer.createTransport({
            host: 'smtp.zoho.eu', 
            port: 465, 
            secure: true, 
            auth: {
                user: process.env.emailUser,
                pass: process.env.emailPassword 
            }
        });

        // 3. Compose clean internal notification email layout
        const internalEmailTemplate = {
            from: `"CamJ Website Bookings" <${process.env.emailUser}>`,
            to: process.env.personalEmail, 
            replyTo: email, // Lets you click "Reply" to email the client instantly
            subject: `⚡ New Booking Inquiry — Date Request: ${date}`,
            text: `You have received a new service request appointment inquiry.\n\n` +
                  `Client Email: ${email}\n` +
                  `Requested Work Target Date: ${date}\n` +
                  `Estimated Appliance Count Volume Bracket: ${itemCount}\n\n` +
                  `Project Brief Description Details:\n"${message}"`
        };

        // 4. Execute standard email transmission
        await mailTransporter.sendMail(internalEmailTemplate);
        
        // SUCCESS HANDLING: Render the success page view
        return res.render('booking-success', { title: 'Inquiry Received' });

    } catch (errorDetails) {
        console.error("Mail Server Error Trap Logged:", errorDetails);
        
        // FAILURE HANDLING: Render the failure page view instead of standard error code text
        return res.render('booking-failed', { title: 'Submission Failed' });
    }
});

// 404 handling
app.all('*', (req, res, next) => {
    const err = new Error('Page Not Found');
    err.statusCode = 404;
    next(err);
});

// Error handling middleware
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Something Went Wrong :(';
    res.status(statusCode).render('error', { err, title: 'Error' }); // Added title placeholder to prevent error layout breaking
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});

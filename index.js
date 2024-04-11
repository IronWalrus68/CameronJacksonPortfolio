require('dotenv').config();

// Dependencies
const express = require('express');
const app = express();
const path = require('path');
const ejsMate = require('ejs-mate');
const Joi = require('joi');
const nodemailer = require('nodemailer')
const rateLimit = require("express-rate-limit");
const morgan = require('morgan');
const axios = require('axios').default;

// Middleware setup
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(morgan('combined'));

// email ratelimter middleware 
const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1, // limit each IP to 1 requests per windowMs
  message: "Too many email requests created from this IP, please try again after 15 minutes"
});

// email form
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: true,
    auth: {
        user: "camsjobhunting@gmail.com",
        pass: process.env.gmailKey,
    },
});

// Routes
app.get('/', (req, res) => {
    const title = 'Home'
    res.render('home', {title});
});
app.get('/blank', async (req, res) => {
    const title = 'camj';
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const currentTime = new Date().toISOString(); // Get current time in ISO format
    
    try {
        // Fetch IP geolocation data
        const ipInfoResponse = await axios.get(`https://ipinfo.io/${ipAddress}/json`);
        const ipInfoData = ipInfoResponse.data;

        // Log user information
        console.log('User IP address:', ipAddress);
        console.log('User-Agent:', userAgent);
        console.log('Request time:', currentTime);
        console.log('Geolocation:', ipInfoData);

        // Perform proxy and VPN detection using IPHub API
        const iphubApiKey = process.env.iphubApiKey;
        const iphubResponse = await axios.get('http://v2.api.iphub.info/ip/' + ipAddress, {
            headers: {
                'X-Key': iphubApiKey
            }
        });
        console.log('IPHub Response:', iphubResponse.data);

        // Extract ISP information
        const isp = ipInfoData.org || 'Unknown';
        console.log('ISP:', isp);
    } catch (error) {
        console.error('Error fetching IP geolocation data:', error.message);
    }

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

app.post('/email', emailLimiter, async (req, res) => {
    try {
        // Check for honeypot
        if (req.body.honeypot) {
            // If honeypot is filled out, it's probably a bot.
            return res.status(400).redirect("/emailFail");
        }

        // Extract form data
        const { emailName, emailAddress, emailContent } = req.body;

        // console.log(`users name: ${emailName} -| users email: ${emailAddress} -| users message: ${emailContent}`)

        // Set up email data
        const mailOptions = {
            from: emailAddress,              // sender address from the form
            to: "camsjobhunting@gmail.com",  // your address
            subject: `Message from ${emailName}`, // Subject line
            text: `response address: ${emailAddress}, from: ${emailName},Content: ${emailContent}`,      // plain text body
            // html: "<p>Email Content in HTML if needed</p>", // If you want to send HTML content
            html: `<h2>Email from:</h2> <br>${emailName}
            <h2>Return address:</h2> <br>${emailAddress}
            <h2>Content: </h2> <br> <p>${emailContent}</p>`
        };

        // Send the email
        await transporter.sendMail(mailOptions);

        // Send a response to the client
        res.status(200).redirect("/emailSuccess");
    } catch (error) {
        console.error("Error redirecting email:", error);
        res.status(500).redirect("/emailFail");
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
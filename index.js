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
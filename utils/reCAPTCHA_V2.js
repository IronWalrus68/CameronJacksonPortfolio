require('dotenv').config(); 

    let reCAPTCHA = async function (response_key){
        const secret_key = process.env.recaptchaSecret;

        const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secret_key}&response=${response_key}`;

        // Making POST request to verify captcha
        const google_response = await fetch(url, { method: "post" }).then(response => response.json());

        if (google_response.success) {
            // Captcha is verified
            return;
        } else {
            // If captcha is not verified
            console.error("Failed to verify reCAPTCHA.");
            throw error;
        }
    } // end of reCAPTCHA func
module.exports = reCAPTCHA;
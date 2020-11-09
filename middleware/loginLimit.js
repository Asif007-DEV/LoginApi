const  loginLimits = require("express-rate-limit");

const limit  = loginLimits({
    windowMs : 1*60*1000,
    max : 5,
    message :{
        code : 429,
        message : "Too many requests, please try after 5 minutes."
    }
});


module.exports = limit;
const nodemailer = require("nodemailer");
const express = require("express");
const sendgridTransport = require("nodemailer-sendgrid-transport");

const transporter = nodemailer.createTransport(sendgridTransport({
    auth:{
      api_key : process.env.SENDGRIDE_API_KEY
    }
  }));


const otpModule={};

function generateOTP()
{
    var otp ="";
    for(let i=1; i<=6; i++)
    {
        otp = otp + Math.floor(Math.random()*10);     
    }
    return otp;
}

otpModule.getOtp = function(email){
  myEmail = process.env.MY_EMAIL;
  const otp = generateOTP();

  transporter.sendMail({
    to:email,
    from:myEmail,
    subject:"Send one time password otp",
    html:`<h1>your one time password otp send to your register email ${otp}</h1>`
  });
  
  return otp;
}

module.exports = otpModule;
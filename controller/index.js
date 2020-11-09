const bcrypt = require("bcryptjs");
const usermodule = require('../models/queries');
const otpModule = require("../middleware/sentOtp");
const jwt = require("jsonwebtoken");
const fs = require("fs");

exports.signup = (req, res, next)=>{
    const {username, email, password, role} = req.body;
    if(!username) return res.status(422).send({ code : 422, status : 'failed', message : 'Please enter username'});
    if(!email) return res.status(422).send({ code : 422, status : 'failed', message : 'Please enter email'});
    if(!password) return res.status(422).send({ code : 422, status : 'failed', message : 'Please enter password'});

    usermodule.getUser(email).exec().then(user=>{
        if(user) return res.status(422).send({code : 422, status : 'failed', Message: 'user already exist...'});
        bcrypt.genSalt(10,(err,salt)=>{
            if(err) return res.json({error: err});
            bcrypt.hash(password,salt,(err,hashPass)=>{
                usermodule.addUser(username, email, hashPass, role).save().then(result=>{
                    res.status(200).json({message: "User registrate successfully"});
                }).catch(err=>{
                    res.status(500).json({error:err});
                });   
            });
        });        
    }).catch(err =>{
        res.status(500).json({error:err});
    })
}


exports.signin = (req,res)=>{
    const {email,password}= req.body;    
    if(!email) return res.status(422).send({ code : 422, status : 'failed', message : 'Please enter email'});
    if(!password) return res.status(422).send({ code : 422, status : 'failed', message : 'Please enter password'});
    usermodule.getUser(email).exec().then(user=>{
        if(!user) return res.status(401).send({code : 401, status : "failed",message:"user does not exist..."});
            bcrypt.compare(password,user.password).then(match=>{
                if(!match){    
                    if(user.attempt === undefined || user.attempt === 0){
                        usermodule.updateAttempts(email,1).exec();
                        return res.status(401).send({code : 401, status : "failed",message:"Password not match...",Attempts : `${5-1} Attempts left`});
                    }
                    if(user.attempt){
                        let count = 1 + user.attempt;
                        usermodule.updateAttempts(email,count).exec();
                        if(count > 4){
                            if(count === 5){
                                setTimeout(()=>{
                                    usermodule.updateAttempts(email,0).exec();    
                                },0.5*60*1000);
                            }
                            return res.status(400).json({message:"Too many requests, please try after 30 seconds."});
                        }
                        return res.status(401).send({code : 401, status : "failed",message:"Password not match...",Attempts : `${5-count} Attempts left`});
                    }                 
                } 
                if(match){ 
                    if(user.attempt <= 0 || user.attempt === undefined){
                        const token = jwt.sign({
                                email : user.email,
                                username : user.username,
                                id : user._id,
                                role : user.role
                            },
                            process.env.JWT_KEY,
                            {
                                expiresIn : "1h"
                            }
                        );
                        if(user.role === "admin") return res.status(200).json({message:"admin login successfully...",token : token,user : user});
                        if(user.role === "user") return res.status(200).json({message:"user login successfully...",token : token,user : user});
                    }
                    else if(user.attempt < 5){
                        usermodule.updateAttempts(email,0).exec();
                        const token = jwt.sign(
                            {
                                email : user.email,
                                username : user.username,
                                id : user._id,
                                role : user.role
                            },
                            process.env.JWT_KEY,
                            {
                                expiresIn : "1h"
                            }
                        );
                        if(user.role === "admin") return res.status(200).json({message:"admin login successfully...",token : token,user : user});
                        if(user.role === "user") return res.status(200).json({message:"user login successfully...",token : token,user : user});
                    }
                    if(user.attempt > 4){
                        return res.status(400).json({message:"Too many requests, please try after 30 seconds."})
                    }
                }
            }).catch(err =>{
                console.log(err);
                res.status(500).json({message:"compare message", error:err});
            });
    }).catch(err =>{
        res.status(500).json({ message:"get user message", error:err});
    });
}


exports.dashboard = (req,res,next)=>{
    console.log(req.userData);
    if(req.userData.role != "admin") return res.status(400).json({
        message : "authentication failed Only Admin can access dashboard"
    })
    res.status(200).json({
        message : "User authenticate Successfully",
        welcome : "welcome... "+req.userData.role
    });
}


exports.changePassword = (req, res, next)=>{
    const {newPassword,currentPassword} = req.body;
    usermodule.getUser(req.userData.email).exec().then(user=>{
        bcrypt.compare(currentPassword,user.password,(err,match)=>{
            if(err) return res.status(401).send({code : 401, status : "failed",error:err});
            if(!match) return res.status(401).send({code : 401, status : "failed",message:"Password not match..."});
            if(match){
                bcrypt.genSalt(10,(err,salt)=>{
                    if(err) return res.status(400).json({error:err});
                    bcrypt.hash(newPassword,salt,(err,hashPass)=>{
                        user.password = newPassword ? hashPass : user.password;
                        user.save().then(result=>{
                            res.status(200).json({message:"Password update successfully..."})
                        }).catch(err=>{ 
                            res.status(400).json({message:"somthing went wrong"});
                        });
                    });
                });
            } 
        });
    }).catch(err =>{
        res.status(500).json({error:err});
    });
}

exports.forgotPassword = (req, res, next)=>{
    const email = req.body.email;
    usermodule.getUser(email).exec().then(user=>{
        if(!user) return res.status(200).json({message:"Email not exist.."})
        const otp = otpModule.getOtp(email);
        const otpEmail = {otp:otp,email:email}
        fs.writeFile("userDetail.txt",JSON.stringify(otpEmail),(err,data)=>{
            if(err) throw err;
            console.log("Otp write successfully..");
        });   
        res.status(200).json({message:"Your one time password otp has been send to your register email"});
    }).catch(err=>{
        res.status(400).json({message:"Somthing went wrong",error:err});
    });
}

exports.resetPassword = (req, res, next)=>{
    const {otp, newPassword} = req.body;
    let otpEmail = fs.readFileSync("userDetail.txt","utf-8");
        otpEmail = JSON.parse(otpEmail);
    if(otpEmail.otp === otp){
        fs.writeFileSync("userDetail.txt",JSON.stringify(""));
        usermodule.getUser(otpEmail.email).exec().then(user=>{
            bcrypt.genSalt(10,(err,salt)=>{
                if(err) return res.status(400).json({error:err});
                bcrypt.hash(newPassword,salt,(err,hashPass)=>{
                    user.password =  hashPass;
                    user.save().then(result=>{
                        res.status(200).json({message:"Password update successfully..."})
                    }).catch(err=>{ 
                        res.status(400).json({message:"somthing went wrong"});
                    });
                });
            });
        }).catch(err =>{
            res.status(500).json({error:err});
        });
    }else{
        res.status(400).json({message : "Please Enter correct otp.."});
    }
}
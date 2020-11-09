const user = require("../schemas/user");

let usermodule = {}

usermodule.getUser = function (email) {
   return user.findOne({email:email});  
}
usermodule.addUser = function (username, email, hashPass, role){
   const userDetails = new user({
      username:username,
      email: email,
      password: hashPass,
      role:role
   });
   return userDetails;
}
usermodule.updateAttempts = function(email,count){
   return user.findOneAndUpdate({email:email},{attempt:count} );
}

module.exports = usermodule;
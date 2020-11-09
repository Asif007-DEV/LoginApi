const express = require("express");
const { signup, signin, dashboard, changePassword, forgotPassword, resetPassword } = require("../controller");
const check_auth = require("../middleware/check-auth");
const loginLimit = require("../middleware/loginLimit");

const routes = express.Router();

routes.post("/register",signup);
routes.post("/login" ,signin);
routes.get("/dashboard",check_auth,dashboard);
routes.patch("/changepassword",check_auth,changePassword);
routes.post("/forgotpassword",forgotPassword);
routes.patch("/resetpassword",resetPassword);

module.exports = routes;
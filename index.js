require('dotenv').config()
const express = require("express");
const mongoose = require("mongoose");
const app = express();

const userRouter = require("./route");


mongoose.connect(process.env.MONGO_URL,{useUnifiedTopology:true,useNewUrlParser:true})
.then(()=>console.log("Database Connected"));

app.use(express.json());
app.use(express.urlencoded({extended:false}));

app.use("/api",userRouter);


const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log("server is runing on port: ",PORT));

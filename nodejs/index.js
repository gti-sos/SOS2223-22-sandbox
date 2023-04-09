var express = require('express');
var bodyParser = require("body-parser");
const metodosCGM = require('../backend/routeCGM');// GET,PUT,DELETE,POST Carlos Gata Masero 
const metodosACB = require("../backend/routeACB");// GET,PUT,DELETE,POST Antonio Carranza Barroso
var app = express();
var port = process.env.PORT || 12345;
const BASE_API_URL = "/api/v1";

app.use("/",express.static("./public"));

app.use(bodyParser.json());
app.listen(port,()=>{
    console.log(`Listening in port ${port}`);
});

metodosCGM(app);
metodosACB(app);
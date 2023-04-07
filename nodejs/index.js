var express = require('express');
var bodyParser = require("body-parser");
const backend = require('../backend/routeCGM');// GET,PUT,DELETE,POST Carlos Gata Masero
var app = express();
var port = process.env.PORT || 12345;
const BASE_API_URL = "/api/v1";

app.use("/",express.static("./public"));

app.use(bodyParser.json());
app.listen(port,()=>{
    console.log(`Listening in port ${port}`);
});

backend(app);
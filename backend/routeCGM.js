var express = require('express');
var bodyParser = require("body-parser");
const backend = require('./routeCGM');
var app = express();
var port = process.env.PORT || 12345;
const BASE_API_URL = "/api/v1";


const cgmFilePath = 'ddbb/stats-cgm.json';
const fs = require('fs');
var Datastore = require('nedb'), cgm = new Datastore();


module.exports = (app) =>{

app.use(bodyParser.json());                                


// /////////////////////////////////////////////////////////                                       //////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////// DATOS Y PETICIONES CARLOS GATA MASERO //////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////                                       //////////////////////////////////////////////////////////

// Redirect
app.get(BASE_API_URL + "/ict-promotion-strategy-stats/docs", (req, res) => {
    console.log("New GET request to /ict-promotion-strategy-stats/docs");
    res.redirect("https://documenter.getpostman.com/view/26062709/2s93RNzFC5");
});


//GET loadInitial Data
app.get(BASE_API_URL+"/ict-promotion-strategy-stats/loadInitialData",(req,res)=>{
    cgm.find({}, (err, docs) => {
        if (err) {
          console.log(`Error getting /ict-promotion-strategy-stats: ${err}`);
          res.sendStatus(500);
        } else if (docs.length === 0) {
          const fs = require('fs');
          const cgmData = JSON.parse(fs.readFileSync(cgmFilePath));
          const initialcgm = cgmData;
          cgm.insert(initialcgm, (err, newDocs) => {
            if (err) {
              console.log(`Error inserting initial data into ict-promotion-strategy-stats: ${err}`);
              res.sendStatus(500);
            } else {
              console.log(`Inserted ${newDocs.length} initial ict-promotion-strategy-stats`);
              res.sendStatus(200);
            }
          });
        } else {
          console.log(`cgm collection already has ${docs.length} documents`);
          res.sendStatus(200);
        }
      });
});

//GET recurso especifico
app.get(BASE_API_URL+"/ict-promotion-strategy-stats",(req,res)=>{
    const { year, territory, ict_manufacturing_industry, wholesale_trade, edition_of_computer_program, limit = 10000, offset = 0 } = req.query;
    const query = {};

    if (year) {
        query.year = parseInt(year);
    }
    if (territory) {
        query.territory = { $regex: new RegExp(territory, 'i') };   
    }
    if (ict_manufacturing_industry) {
        query.ict_manufacturing_industry = parseFloat(ict_manufacturing_industry);
    }
    if (wholesale_trade) {
        query.wholesale_trade = parseFloat(wholesale_trade);
    }
    if (edition_of_computer_program) {
        query.edition_of_computer_program = parseFloat(edition_of_computer_program);
    }
    const limitValue = parseInt(limit);
    const offsetValue = parseInt(offset);
    cgm
        .find(query)
        .sort({year: 1}) // ordenar por id en orden ascendentee
        .limit(limitValue)
        .skip(offsetValue)
        .exec((err, cgm) => {
        if (err) {
            console.log(`No cgm found: ${err}`);
            res.sendStatus(404);
        } else {
            console.log(`cgm returned = ${cgm.length}`);
            res.json(cgm.map((j) => {
                delete j._id;
                return j;
            }));
        }
    });
});

// GET busqueda por values

app.get('/api/v1/ict-promotion-strategy-stats/:value/:value2?', (req, res) => {
    const { value, value2 } = req.params;
    console.log(value);
    const query = { $where: function() {
      const keys = Object.keys(this);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (typeof this[key] === 'number' && parseFloat(value) === this[key]) {
          return true;
        } else if (typeof this[key] === 'string' && this[key].toLowerCase().includes(value.toLowerCase())) {
          if (value2) {
            const nextKey = keys[i + 1];
            if (nextKey && typeof this[nextKey] === 'number' && parseInt(value2) === this[nextKey]) {
              return true;
            }
          } else {
            return true;
          }
        } else if (typeof this[value] === 'string' && typeof parseInt(value2) === 'number' && Number.isInteger(parseInt(value2))) {
          if (this[value] === value && parseInt(this[value2]) === parseInt(value2)) {
            return true;
          }
        }
      }
      return false;
    }};
    //CAMBIOS REALIZADOS PARA OBJETOS
    cgm.find(query, (err, cgm) => {
      if (err) {
        console.log(`Error getting /cgm: ${err}`);
        res.sendStatus(500);
      } else if (cgm.length === 0) {
        res.sendStatus(404);
      } else {
        console.log(`cgm returned = ${cgm.length}`)
        
        if (typeof value === 'string' && typeof parseInt(value2) === 'number' && Number.isInteger(parseInt(value2))) {
          if (cgm.length === 1) { // Si solo se proporciona un año y existe solo un objeto, devolver el objeto
            delete cgm[0]._id;
            res.json(cgm[0]);
          } else { // De lo contrario, devolver el array de objetos
            res.json(cgm.map((j) => {
              delete j._id;
              return j;
            }));
          }
        } else if (!value2 && cgm.length === 1) { // Si solo se proporciona un año y existe solo un objeto, devolver el objeto
          delete cgm[0]._id;
          res.json(cgm[0]);
        } else { // De lo contrario, devolver el array de objetos
          res.json(cgm.map((j) => {
            delete j._id;
            return j;
          }));
        }
      }
    });
  });
  
//POST añadir datos
app.post(BASE_API_URL + "/ict-promotion-strategy-stats", (req, res) => {
    const ns = req.body;

    if (!ns.year || !ns.territory || !ns.ict_manufacturing_industry || !ns.wholesale_trade || !ns.edition_of_computer_program) {
      return res.sendStatus(400);
    }
    // Check if the same resource already exists in the database
    cgm.findOne({territory: ns.territory, year: ns.year, 
    ict_manufacturing_industry: ns.ict_manufacturing_industry, 
    wholesale_trade: ns.wholesale_trade, 
    edition_of_computer_program: ns.edition_of_computer_program }, (err, resource) => {
        
        if (err) {
            console.log(`Error getting resource ${ns.year}: ${err}`);
            res.sendStatus(500);
        } else if (resource) {
            res.sendStatus(409);
        } else {
            cgm.insert(ns, (err, data) => {
                if (err) {
                    console.log(`Error inserting data: ${err}`);
                    res.sendStatus(500);
                } else {
                    res.sendStatus(201);
                    console.log("Nuevo post /ict-promotion-strategy-stats");
                }
            });
        }
    });
});

//POST fallo
app.post(BASE_API_URL+"/ict-promotion-strategy-stats/*",(req,res)=>{
    res.sendStatus(405, "Method not allowed"); // respuesta ERROR 405
});

//DELETE  array completo
app.delete(BASE_API_URL+"/ict-promotion-strategy-stats", (req, res) => {
    cgm.remove({}, { multi: true }, (err, numRemoved) => {
      if (err) {
          console.error(err);
          return res.sendStatus(500);
      }
      return res.sendStatus(200);
  });
  });
  
  //DELETE  DE UN RECURSO
  app.delete(BASE_API_URL + "/ict-promotion-strategy-stats/:year", (req, res) => {
    const bd_year = Number(req.params.year);
  cgm.remove({ year: bd_year }, {}, (err, numRemoved) => {
      if (err) {
          console.error(err);
          return res.sendStatus(500);
      }
      if (numRemoved === 0) {
          return res.sendStatus(400);
      }
      return res.sendStatus(200);
  });
});

// PUT fallido
app.put(BASE_API_URL + "/ict-promotion-strategy-stats", (req, res) => {
    res.sendStatus(405);
});
  
//PUT a lista de recursos
app.put(BASE_API_URL + "/ict-promotion-strategy-stats/:year",(req,res)=>{
    const bd_year = Number(req.params.year); // Obtener el ID de la URL
    const updatedBd = req.body; // Obtener ict actualizado desde cuerpo o

    // Actualizar el objeto ict en la base de datos
    cgm.update({ year: bd_year }, { $set: updatedBd }, {}, (err, numReplaced) => {
    if (err) {
        console.error(err);
        return res.sendStatus(500);
    }
    if (numReplaced === 0) {
        return res.sendStatus(400);
    }
    return res.sendStatus(200);
    });
});

}

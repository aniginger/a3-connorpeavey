const express = require('express'),
  { MongoClient, ObjectId } = require("mongodb"),
  app = express(),
  gpaData = [];

app.use(express.static('public'));
app.use(express.static('views'));
app.use(express.json());
require('dotenv').config();


const uri = `mongodb+srv://${process.env.USERNAME}:${process.env.PASSWORD}@${process.env.HOST}`
const client = new MongoClient( uri )

let collection = null

async function run() {
  await client.connect()
  collection = await client.db("gpadb").collection("gpaEntries")

  // route to get all docs
  if (collection !== null) {
    const docs = await collection.find({}).toArray()
    console.log(docs);
  }
}

run()

app.use( (req,res,next) => {
  if( collection !== null ) {
    next()
  }else{
    res.status( 503 ).send()
  }
})

app.post( '/add', async (req,res) => {
  const result = await collection.insertOne( req.body )
  res.json( result )
})


app.listen(process.env.PORT || 3000);

var gpa = 0.0;


// Add new element to the table
app.post('/submit', express.json(), (req, res) => {
  gpaData.push(req.body);
  gpa = calculateGpa(gpaData);

  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(JSON.stringify(req.body));
});

// Adjust latest table element
app.post('/adjust', express.json(), (req, res) => {
  gpaData[gpaData.length - 1] = req.body;
  gpa = calculateGpa(gpaData);

  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(JSON.stringify(req.body));
});

// Delete latest element from the table
app.post('/delete', express.text(), (req, res) => {
  let entryToDelete = Number(JSON.parse(req.body));
  gpaData.splice(entryToDelete - 1, 1);
  gpa = calculateGpa(gpaData);

  res.writeHead(200, {'Content-Type': 'application/text'});
  res.end(entryToDelete.toString());
});

// Fetch data for the GPA table
app.get('/display', (req, res) => {
  res.writeHead(200, {'Content-Type': 'application/text'});
  res.end(JSON.stringify(gpaData));
});

// Fetch GPA value
app.get('/gpa', (req, res) => {
  res.writeHead(200, {'Content-Type': 'application/text'});
  let roundedGpa = Math.round(gpa * 100) / 100;
  res.end(roundedGpa.toString());
});


// Determine what the user's GPA is based on the provided info
const calculateGpa = function(jsonData)
{
  let totalPoints = 0;
  let totalCredits = 0;
  jsonData.forEach(entry => {
    let currentPoints = 0;
    let grade = entry.grade.toLowerCase();

    if (grade === "a") {
      currentPoints = 4;
    } else if (grade === "b") {
      currentPoints = 3;
    } else if (grade === "c") {
      currentPoints = 2;
    } else if (grade === "d") {
      currentPoints = 1;
    }

    let amountCredits = Number(entry.credits);
    currentPoints *= amountCredits;
    totalPoints += currentPoints;
    totalCredits += amountCredits;
  });
  return totalPoints / totalCredits;
}
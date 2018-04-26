var express = require('express');
var nodemailer = require('nodemailer');
var app = express();
var fs = require("fs");
var mongoose = require('mongoose');
var bodyParser = require("body-parser");
var db;

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

mongoose.connect('mongodb://127.0.0.1:27017/users')
    .then((mongoose) => {
        db = mongoose;
        console.log("Successfully connected to the database");
    })
    .catch(err => {
        console.log('Could not connect to the database. Exiting now...', err);
        process.exit();
    });

const UserSchema = mongoose.Schema({
    name: String,
    age: String
}, {
        timestamps: true
    });

module.exports = mongoose.model('User', UserSchema);

app.get('/documentation', (req, res) => {
    res.render('common.jade');
});

app.get('/listUsers', function (req, res) {
    // fs.readFile(__dirname + "/" + "users.json", 'utf8', function (err, data) {
    //     // console.log(data);
    //     res.end(data);
    // });
    mongoose.models.User.find()
        .then(users => {
            res.status(201).send(users);
        }).catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving users."
            });
        });
})

app.post('/addUser', function (req, res) {
    var document = mongoose.models.User(req.body);
    mongoose.models.User.db.collection("users").insertOne(document, function (error, response) {
        if (err) {
            res.status(500).send({
                message: err.message || "Some error occurred while inserting user."
            });
            throw err;
        }
        res.status(201).send('1 document inserted');
    });
})

app.post('/findUsers', function (req, res) {
    var query = { name: req.body.name };
    mongoose.models.User.find(query)
        .then(users => {
            res.status(201).send(users);
        }).catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving users."
            });
        });
})

var server = app.listen(8081, function () {

    var host = server.address().address;
    var port = server.address().port;

    // console.log("Example app listening at http://%s:%s", host, port)

})

// var transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: 'youremail@gmail.com',
//         pass: 'yourpassword'
//     }
// });

// var mailOptions = {
//     from: 'youremail@gmail.com',
//     to: 'sender@gmail.com',
//     subject: 'Sending Email using Node.js',
//     text: 'That was easy!'
// };

// transporter.sendMail(mailOptions, function (error, info) {
//     if (error) {
//         console.log(error);
//     } else {
//         console.log('Email sent: ' + info.response);
//     }
// });
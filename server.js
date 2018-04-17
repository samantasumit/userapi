var express = require('express');
var app = express();
var fs = require("fs");
var mongoose = require('mongoose');
var mongoose;
mongoose.connect('mongodb://127.0.0.1:27017/users')
    .then((mongoose) => {
        mongoose = mongoose;
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

// var MongoClient = require('mongodb').MongoClient
//     , format = require('util').format;
// MongoClient.connect('mongodb://127.0.0.1:27017/users', function (err, db) {
//     if (err) {
//         throw err;
//     } else {
//         console.log("successfully connected to the database");

//     }
//     db.close();
// });

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

var server = app.listen(8081, function () {

    var host = server.address().address;
    var port = server.address().port;

    // console.log("Example app listening at http://%s:%s", host, port)

})
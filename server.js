var express = require('express');
var nodemailer = require('nodemailer');
var app = express();
var fs = require("fs");
var mongoose = require('mongoose');
var cors = require('cors');
var bodyParser = require("body-parser");
var db;

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(require('cors')());

app.use(bodyParser.json());

mongoose.connect('mongodb://sumit:sumit@ds157475.mlab.com:57475/users')
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
            res.status(200).send({ users: users });
        }).catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving users."
            });
        });
})

app.post('/addUser', function (req, res) {
    var document = mongoose.models.User(req.body);
    mongoose.models.User.db.collection("users").insertOne(document, function (error, response) {
        if (error) {
            res.status(500).send({
                message: error.message || "Some error occurred while inserting user."
            });
            throw error;
        }
        res.status(200).send({ message: 'Success' });
    });
})

app.put('/removeUser', function (req, res) {
    var query = { _id: req.body.userId };
    mongoose.models.User.remove(query)
        .then(users => {
            res.status(200).send({ users: users });
        }).catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving users."
            });
        });
})

app.post('/findUsers', function (req, res) {
    var criterion = {
        $or: [{
            name: {
                "$regex": req.body.searchInput,
                "$options": "i"
            }
        },
        {
            age: {
                "$regex": req.body.searchInput,
                "$options": "i"
            }
        }]
    };
    mongoose.models.User.find(criterion)
        .then(users => {
            res.status(200).send({ users: users });
        }).catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving users."
            });
        });
})

var server = app.listen(process.env.PORT || 8081, function () {

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
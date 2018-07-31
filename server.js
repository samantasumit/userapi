var express = require('express');
var nodemailer = require('nodemailer');
var app = express();
var io = require('socket.io').listen(app.listen(process.env.PORT || 8081));
var fs = require("fs");
var formidable = require('formidable');
var mongoose = require('mongoose');
var cors = require('cors');
var bodyParser = require("body-parser");
var fetch = require('isomorphic-fetch');
var htmlPdf = require('html-pdf');
var nunjucks = require('nunjucks');
var handlebars = require('handlebars');
var Dropbox = require('dropbox').Dropbox;
var FileReader = require('filereader');
var ExifImage = require('exif').ExifImage;
var jo = require('jpeg-autorotate');
var db;

var dropbox = new Dropbox({ accessToken: 'SABgz77iLaAAAAAAAAAAKhFeMEb8fNBSeLDjGm5yEabkihv0ygCa-eBUfI5wvNIp' });
// dropbox.filesListFolder({ path: '' })
//     .then(function (response) {
//         console.log(response);
//     })
//     .catch(function (error) {
//         console.log(error);
//     });

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(require('cors')());

app.use(bodyParser.json());

io.of('/chat').on('connection', function (socket) {
    socket.emit('news', 'Test Connection!');
    socket.on('send', function (data) {
        socket.broadcast.emit('news', data);
    });
});

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

app.post('/uploadFile', function (req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
       
    });
    form.on('file', function (name, file) {

        var reader = new FileReader();
        reader.onload = function (event) {

            jo.rotate(event.target.result, {}, function(error, buffer, orientation) {
                if (error) {
                    console.log('An error occurred when rotating the file: ' + error.message);
                    fs.writeFile(__dirname + "/tmp/output.jpg", event.target.result, function(err) {
                        if(err) {
                            return console.log(err);
                        }
                
                        console.log("The file was saved!");
                    });
                    return;
                }
                console.log('Orientation was: ' + orientation);
            
                // upload the buffer to s3, save to disk or more ...
              
                fs.writeFile(__dirname + "/tmp/output.jpg", buffer, function(err) {
                    if(err) {
                        return console.log(err);
                    }
            
                    console.log("The file was saved!");
                });
            });

            try {
                new ExifImage({ image: event.target.result }, function (error, exifData) {
                    if (error) {
                        res.status(500).send({
                            message: error.message || "Some error occurred."
                        });
                    }
                    else {
                        res.status(200).send({ exifData: exifData });
                    }
                });
            } catch (error) {
                res.status(500).send({
                    message: error.message || "Some error occurred."
                });
            }
        }
        reader.readAsArrayBuffer(file);
  
        // dropbox.filesCreateFolder({ path: "/" + file.name.substring(0, 4), autorename: true })
        //     .then((response1) => {
        //         // dropbox.filesUpload({ path: "/" + file.name, contents: fs.createReadStream(file.path), mode: 'overwrite' })
        //         dropbox.filesUpload({ path: "/" + file.name.substring(0, 4) + "/" + file.name, contents: fs.createReadStream(file.path), mode: 'overwrite' })
        //             .then((response) => {
        //                 dropbox.sharingCreateSharedLink({ path: "/" + file.name.substring(0, 4) + "/" + file.name, short_url: true })
        //                     .then((response) => {
        //                         res.status(200).send({ message: 'Success' });
        //                     })
        //                     .catch((err) => {
        //                         res.status(500).send({
        //                             message: err.error_summary || "Some error occurred while inserting user."
        //                         });
        //                     })
        //             })
        //             .catch((err) => {
        //                 res.status(500).send({
        //                     message: err || "Some error occurred while inserting user."
        //                 });
        //             })
        //     })
        //     .catch((err1) => {
        //         res.status(500).send({
        //             message: err1 || "Some error occurred while inserting user."
        //         });
        //     })
    });
})

app.get('/downloadFile', function (req, res) {

    dropbox.sharingGetSharedLinks({ path: "/" + "team/team.png" })
        .then((response) => {
            console.log(response);
            res.status(200).send({ message: 'Success', file: response.links });
        })
        .catch((err) => {
            console.log(err);
            res.status(500).send({
                message: err.error_summary || "Some error occurred while inserting user."
            });
        })

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

// var server = app.listen(process.env.PORT || 8081, function () {

//     var host = server.address().address;
//     var port = server.address().port;

//     // console.log("Example app listening at http://%s:%s", host, port)

// })

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

// htmlPdf.create(HTML, options).toFile("./pdfinvoice/" + "WayBill" + ".pdf", function (error) {
//     if (error) {
//         return;
//     }
//     else {
//         console.log('pdf generated succesfully');
//     }
// });

app.get('/renderHtml', function (req, res) {
    res.sendFile(__dirname + '/views/client.html');
})

app.post('/postRenderHtml', function (req, res) {
    var transactionId = req.body.transactionID;
    var hmtl = `
        <!DOCTYPE html>
        <html>
        
        <head>
            <meta http-equiv="Content-Type" content="text/html; charset=windows-1252">
        </head>
        
        <body>
            <form action="https://demo-ipg.comtrust.ae/PaymentEx/MerchantPay/Payment?lang=en&layout=C0STCBLEI" method="post">
                <input id="TransactionID" type='hidden' name='TransactionID' value=`+ transactionId + ` />
                <input id="submit" type='submit' value='Submit' />
            </form>
        </body>
        
        </html>
    `;
    res.send(hmtl);
})
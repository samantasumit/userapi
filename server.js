var express = require('express');
var nodemailer = require('nodemailer');
var app = express();
var fs = require("fs");
var formidable = require('formidable');
var mongoose = require('mongoose');
var cors = require('cors');
var bodyParser = require("body-parser");
var fetch = require('isomorphic-fetch');
var Dropbox = require('dropbox').Dropbox;
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
        dropbox.filesCreateFolder({ path: "/" + file.name.substring(0,4), autorename: true })
            .then((response1) => {
                // dropbox.filesUpload({ path: "/" + file.name, contents: fs.createReadStream(file.path), mode: 'overwrite' })
                dropbox.filesUpload({ path: "/" + file.name.substring(0,4) + "/" + file.name, contents: fs.createReadStream(file.path), mode: 'overwrite' })
                    .then((response) => {
                        dropbox.sharingCreateSharedLink({ path: "/" + file.name.substring(0,4) + "/" +file.name, short_url: true })
                            .then((response) => {
                                res.status(200).send({ message: 'Success' });
                            })
                            .catch((err) => {
                                res.status(500).send({
                                    message: err.error_summary || "Some error occurred while inserting user."
                                });
                            })
                    })
                    .catch((err) => {
                        res.status(500).send({
                            message: err || "Some error occurred while inserting user."
                        });
                    })
            })
            .catch((err1) => {
                res.status(500).send({
                    message: err1 || "Some error occurred while inserting user."
                });
            })
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


var htmlPdf = require('html-pdf');
var nunjucks = require('nunjucks');
var handlebars = require('handlebars');

var deliveryReport = "";
deliveryReport += "<html>";
deliveryReport += "<style>";
deliveryReport += "    td {";
deliveryReport += "        white-space: normal;";
deliveryReport += "        word-wrap: break-word;";
deliveryReport += "        max-width: 70px;";
deliveryReport += "        text-align: left;";
deliveryReport += "        padding-left: 25px;";
deliveryReport += "    }";
deliveryReport += "";
deliveryReport += "    table {";
deliveryReport += "        white-space: nowrap !important;";
deliveryReport += "        table-layout: auto;";
deliveryReport += "    }";
deliveryReport += "<\/style>";
deliveryReport += "<meta http-equiv=\"Content-Type\" content=\"text\/html; charset=utf-8\">";
deliveryReport += "<body>";
deliveryReport += "<div style=\"padding-left: 25%;\"><img src=\"https:\/\/tookan.s3.amazonaws.com\/task_images\/WbNW1504623499889-2136271926229047427873931130188n.png\"";
deliveryReport += "        style=\"height:73px; width:310px\"\/><\/div>";
deliveryReport += "<div style=\"padding-left: 29%;\"  >";
deliveryReport += "<p>ce@completeshipping.ca<\/p>";
deliveryReport += "<\/div>";
deliveryReport += "<div style=\"padding-left: 25%;\" >";
deliveryReport += "<p>11506 - 38 Street Edmonton, AB T5W 2G7<\/p>";
deliveryReport += "<\/div>";
deliveryReport += "<div>";
deliveryReport += "<table style=\" width:100%\">";
deliveryReport += "    <tbody >";
deliveryReport += "    <tr >";
deliveryReport += "        <td style=\"text-align:justify; width:25%; padding-left:25%\">Date:<\/td>";
deliveryReport += "        <td style=\"text-align:justify; width:75%; padding-left:5.5%\">{{PickupDateTime}}<\/td>";
deliveryReport += "    <\/tr>";
deliveryReport += "    <\/tbody>";
deliveryReport += "<\/table>";
deliveryReport += "<\/div>";
deliveryReport += "<table style=\"padding-left: 25%; width:100%\">";
deliveryReport += "    <tbody>";
deliveryReport += "    <tr >";
deliveryReport += "        <td style=\"padding-left:0;\">Hi<\/td>";
deliveryReport += "        ";
deliveryReport += "    <\/tr>";
deliveryReport += "    <\/tbody>";
deliveryReport += "    <\/table>";
deliveryReport += "<table style=\"padding-left: 25%; width:100%\">";
deliveryReport += "    <tbody>";
deliveryReport += "    <tr>";
deliveryReport += "        <td style=\"padding-left:0;\">Complete Express successfully deliveried your items.<\/td>";
deliveryReport += "        ";
deliveryReport += "    <\/tr>";
deliveryReport += "    <\/tbody>";
deliveryReport += "    <\/table>";
deliveryReport += "";
deliveryReport += "<table style=\"width: 100%; padding-top:2%\">";
deliveryReport += "    <tbody>";
deliveryReport += "    <tr>";
deliveryReport += "        <td style=\"text-align:justify\">Way Bill No:<\/td>";
deliveryReport += "        <td style=\"text-align:justify\">";
deliveryReport += "            <p>{{DeliveryTaskID}}<\/p>";
deliveryReport += "        <\/td>";
deliveryReport += "    <\/tr>";
deliveryReport += "    <tr>";
deliveryReport += "        <td style=\"text-align:justify\">Shipper:<\/td>";
deliveryReport += "        <td style=\"text-align:justify\">";
deliveryReport += "            <p>{{PickupCustomerName}}<\/p>";
deliveryReport += "        <\/td>";
deliveryReport += "    <\/tr>";
deliveryReport += "    <tr>";
deliveryReport += "        <td style=\"text-align:justify\">Shipper Address:<\/td>";
deliveryReport += "        <td style=\"text-align:justify\">";
deliveryReport += "            <p>{{PickupCustomerAddress}}<\/p>";
deliveryReport += "        <\/td>";
deliveryReport += "    <\/tr>";
deliveryReport += "    <tr>";
deliveryReport += "        <td style=\"text-align:justify\">Consignee:<\/td>";
deliveryReport += "        <td style=\"text-align:justify\">";
deliveryReport += "            <p>{{DeliveryCustomerName}}<\/p>";
deliveryReport += "        <\/td>";
deliveryReport += "    <\/tr>";
deliveryReport += "    <tr>";
deliveryReport += "        <td style=\"text-align:justify\">Consignee Address:<\/td>";
deliveryReport += "        <td style=\"text-align:justify\">";
deliveryReport += "            <p>{{DeliveryCustomerAddress}}<\/p>";
deliveryReport += "        <\/td>";
deliveryReport += "    <\/tr>";
deliveryReport += "    <tr>";
deliveryReport += "        <td style=\"text-align:justify\">Description:<\/td>";
deliveryReport += "        <td style=\"text-align:justify\">";
deliveryReport += "            <p>{{PickupTaskDescription}}<\/p>";
deliveryReport += "        <\/td>";
deliveryReport += "    <\/tr>";
deliveryReport += "    <tr>";
deliveryReport += "        <td style=\"text-align:justify\">Total Time Taken:<\/td>";
deliveryReport += "        <td style=\"text-align:justify\">";
deliveryReport += "            <p>{{TotalTimeTaken}}<\/p>";
deliveryReport += "        <\/td>";
deliveryReport += "    <\/tr>";
deliveryReport += "    <tr>";
deliveryReport += "        <td style=\"text-align:justify\">Total Distance Travelled:<\/td>";
deliveryReport += "        <td style=\"text-align:justify\">";
deliveryReport += "            <p>{{TotalDistanceTravelled}}<\/p>";
deliveryReport += "        <\/td>";
deliveryReport += "    <\/tr>";
deliveryReport += "    <\/tbody>";
deliveryReport += "<\/table>";
deliveryReport += "";
deliveryReport += "<p>&nbsp;<\/p>";
deliveryReport += "";
deliveryReport += "<table style=\"width:100%; \">";
deliveryReport += "    <tbody>";
deliveryReport += "    <tr>";
deliveryReport += "        <td>Delivery Chargers:<\/td>";
deliveryReport += "        <td>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;";
deliveryReport += "            &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;";
deliveryReport += "            &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;";
deliveryReport += "        <\/td>";
deliveryReport += "    <\/tr>";
deliveryReport += "    <tr>";
deliveryReport += "        <td>GST:<\/td>";
deliveryReport += "        <td>&nbsp;<\/td>";
deliveryReport += "    <\/tr>";
deliveryReport += "    <tr>";
deliveryReport += "        <td>Total Charges:<\/td>";
deliveryReport += "        <td>&nbsp;<\/td>";
deliveryReport += "    <\/tr>";
deliveryReport += "    <\/tbody>";
deliveryReport += "<\/table>";
deliveryReport += "";
deliveryReport += "<table style=\"width:100%;\">";
deliveryReport += "    <tbody>";
deliveryReport += "    <tr>";
deliveryReport += "        <td style=\"width:50%\">Shipper<\/td>";
deliveryReport += "        <td style=\"padding-left: 1.4%;width:50%\"> <img alt=\"\" src={{PickupSignImage}} style=\"height:60px; width:130px\"\/>";
deliveryReport += "        <\/td>";
deliveryReport += "    <\/tr>";
deliveryReport += "    <tr>";
deliveryReport += "        <td style=\"width:50%\">Receiver<\/td>";
deliveryReport += "        <td style=\"padding-left: 1.4%;width:50%\"><img alt=\"\" src={{DeliverySignImage}} style=\"height:60px; width:130px\"\/><\/td>";
deliveryReport += "    <\/tr>";
deliveryReport += "    <\/tbody>";
deliveryReport += "<\/table>";
deliveryReport += "";
deliveryReport += "<\/body>";
deliveryReport += "<\/html>";

var htmlData = {};
htmlData["PickupDateTime"] = "pickup_job_time";
htmlData["DeliveryTaskID"] = "delivery_job_id";
htmlData["PickupCustomerName"] = "pickup_customer_name";
htmlData["PickupCustomerAddress"] = "pickup_customer_address";
htmlData["DeliveryCustomerName"] = "delivery_customer_name";
htmlData["DeliveryCustomerAddress"] = "delivery_customer_address";
htmlData["PickupTaskDescription"] = "pickup_job_description";

var started_datetime = new Date().getTime();
var completed_datetime = new Date().getTime();


htmlData["TotalTimeTaken"] = "timeDifference";
htmlData["TotalDistanceTravelled"] = "delivery_total_distance_travelled";

htmlData["PickupSignImage"] = "sd";
htmlData["DeliverySignImage"] = "sd";

var HTML = handlebars.compile(deliveryReport)(htmlData);

var options = {
    format: "Letter"
};

nunjucks.configure(__dirname + '/views');
var HTML = nunjucks.render('client4.html');


// htmlPdf.create(HTML, options).toFile("./pdfinvoice/" + "WayBill" + ".pdf", function (error) {
//     if (error) {
//         return;
//     }
//     else {
//         console.log('pdf generated succesfully');
//     }
// });

app.get('/renderHtml', function (req, res) {
    res.sendFile(__dirname+'/views/client4.html');
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
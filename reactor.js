const express = require('express');
const admin = require('firebase-admin');
const mailer = require('nodemailer');

const serviceAccount = require('./private/flight-7d05d-firebase-adminsdk-1krt5-e003f33985.json');
const transporterInfo = require('./private/transporter.json');
const port = process.env.port || 3000;

var app = express();
var transporter = mailer.createTransport(transporterInfo);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://flight-7d05d.firebaseio.com'
});

var db = admin.database();

var contactRef = db.ref('contacts');
var notesRef = db.ref('adminNotes/sent');
var contactsReceived = [];

contactRef.on('child_added', function (snap, prevKey) {
    contactsReceived.push(snap.val());
    let sentMessage = db.ref('adminNotes/sent/' + snap.key);
    sentMessage.once('value', function (snapp) {
        //console.log(snapp.val());
        if (!snapp.val()) {
            //console.log('sending an email');
            var mail = {
                from: `${snap.val().name} <${snap.val().email}>`,
                //to: 'info.flight.run@gmail.com, tvmendoza99@gmail.com',
                to: 'info.flight.run@gmail.com',
                subject: `${snap.val().name} - New contact from flight.run`,
                html:
                `
                <h1>New Message!!!</h1><br/>
                Name: ${snap.val().name}<br/>
                Phone: ${snap.val().phone}<br/>
                Email: ${snap.val().email}<br/>
                Message:<br/>
                ${snap.val().message}<br/>
                `
            }

            transporter.sendMail(mail, function (error, info) {
                if (error) {
                    return console.log(error);
                }
                console.log('Message sent: ' + info.response);
            });

            sentMessage.set({
                date_sent: Date.now(),
                name: snap.val().name,
                email: snap.val().email
            });
        } else {
            console.log('no email sent');
        }
    });
});

Date.prototype.yyyymmdd = function () {
    if (!this)
        return '';
    var mm = this.getMonth() + 1; // getMonth() is zero-based
    var dd = this.getDate();

    return [
        (mm > 9 ? '' : '0') + mm,
        (dd > 9 ? '' : '0') + dd,
        this.getFullYear()
    ].join('/');
};

app.get('/', (req, res) => {
    var contactsString = '';
    contactsReceived.forEach(function (contact) {
        contactsString = contactsString + `
        <hr/>
        Date: ${new Date(contact.date_received).yyyymmdd()}<br/>
        Name: ${contact.name}<br/>
        Message: ${contact.message}<br/>
        
        `
    }, this);
    res.send(contactsString);

});

app.listen(port, () => {
    console.log(`Reactor is up on port ${port}`);
});
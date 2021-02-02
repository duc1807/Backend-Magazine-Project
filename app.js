const express = require("express");

const app = express();

const multer = require('multer')

const { google } = require("googleapis");

const OAuth2Data = require("./credentials.json");

const CLIENT_ID = OAuth2Data.web.client_id;
const CLIENT_SECRET = OAuth2Data.web.client_secret;
const REDIRECT_URI = OAuth2Data.web.redirect_uris[0];

var name, pic

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI,
);

var authed = false

var Storage = multer.diskStorage({
    destination: function (req, file, callback) {
      callback(null, "./images");
    },
    filename: function (req, file, callback) {
      callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    },
  });
  
  var upload = multer({
    storage: Storage,
  }).single("file"); //Field name and max count

const SCOPES = "https://www.googleapis.com/auth/drive.file " +
               "https://www.googleapis.com/auth/userinfo.profile"

app.set("view engine", "ejs");

app.get("/", (req, res) => {
    if(!authed) {
        var url = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES
        })
        console.log(url)

        res.render('index', {url: url})
    } 
    else {
        var oauth2 = google.oauth2({
            auth: oAuth2Client,
            version: 'v2'
        })

        // user info 

        oauth2.userinfo.get((err, response) => {
            if(err) throw err

            console.log(response.data)

            name = response.data.name
            pic = response.data.picture

            res.render('success', {name: name, pic: pic})
        })
    }
});

app.get('/google/callback', (req,res) => {
    const code = req.query.code

    if(code) {
        // get access token
        oAuth2Client.getToken(code, (err, tokens) => {
            if(err) {
                console.log("Authentication error")
                console.log(err)
            }
            else {
                console.log("Authentication successful")
                console.log(tokens)
                oAuth2Client.setCredentials(tokens)

                authed = true

                res.redirect('/')
            }
        })
    }
})

app.post('/upload', (req,res) => {
    upload(req, res, function(err) {
        if(err) throw err
        console.log("file: ", req.file.path)

    })
})

app.listen(5000, () => {
  console.log("App started on port 5000");
});

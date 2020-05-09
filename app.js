const express = require('express')
const dotenv = require("dotenv")
const SpotifyWebApi = require('spotify-web-api-node');
const {MongoClient} = require('mongodb');

const app = express()
const PORT = process.env.PORT || 3000;
dotenv.config();
const uri = `mongodb://${process.env.MONGOUSER}:${process.env.MONGOPASS}@ds119072.mlab.com:19072/general-purpose`;
const client = new MongoClient(uri,{ useNewUrlParser: true, useUnifiedTopology: true });


main();


async function main() {
  
  try {
    await client.connect();
    
} catch (e) {
    console.error(e);
}

  const db = client.db("general-purpose").collection("spotifyApi")
  let record = await db.findOne({spotify: "tokens"})

  let refreshInterval = null;
  const redirectUri = process.env.NODE_ENV === "dev" ? "http://localhost:3000/code" : 'https://spotify-api-pnodseth-dev.herokuapp.com/code'
  const spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENTID,
    clientSecret: process.env.CLIENTSECRET,
    accessToken: record.accessToken,
    refreshToken: record.refreshToken,
    redirectUri
  });
  var scopes = ['user-read-private', 'user-read-email', 'user-top-read']
  
  
  
  app.get('/auth', (req, res) => {
    var authorizeURL = spotifyApi.createAuthorizeURL(scopes);
    res.redirect(authorizeURL)
  })
  
  app.get("/code", (req,res) => {
    const code = req.query.code
  
  
    spotifyApi.authorizationCodeGrant(code).then(
      async function(data) {
  
        // Set the access token on the API object to use it in later calls
        spotifyApi.setAccessToken(data.body['access_token']);
        spotifyApi.setRefreshToken(data.body['refresh_token']);

        /* Also persist to db */
        result = await db.updateOne({ spotify: "tokens" }, { $set: {accessToken:data.body['access_token'], refreshToken: data.body['refresh_token'] } });
  
        if (refreshInterval !== null) {
          clearInterval(refreshInterval)
        }
        refreshInterval = setInterval(() => {
          spotifyApi.refreshAccessToken().then(
            async function(data) {
              console.log('The access token has been refreshed!');
  
              // Save the access token so that it's used in future calls
              spotifyApi.setAccessToken(data.body['access_token']);
              result = await db.updateOne({ spotify: "tokens" }, { $set: {accessToken:data.body['access_token']} });
            },
            function(err) {
              console.log('Could not refresh access token', err);
            }
          );
        }, 1000 * 60 * 30) // every 30 minutes
        res.send("code ok!")
      },
      function(err) {
        console.log('Something went wrong!', err);
        res.send("error")
      }
  );
  
  })
  
  app.get("/mytracks", function(req,res) {
    spotifyApi.getMyTopTracks({}).then(data => {
     res.json(data.body)
    }, function(err) {
      res.status(400)
      res.send(err)
      console.log("something went wrong ", err)
    })
  })
  
  app.get("/myartists", function(req,res) {
    spotifyApi.getMyTopArtists({}).then(data => {
     res.json(data.body)
    }, function(err) {
      res.status(400)
      res.send(err)
      console.log("something went wrong ", err)
    })
  })
  
  app.get("/", function(req,res) {
    res.send("hello")
  })
    
  
    app.listen(PORT, () => console.log(`Example app listening at port ${PORT}`))
}
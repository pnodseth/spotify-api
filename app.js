const express = require('express')
const dotenv = require("dotenv")
const SpotifyWebApi = require('spotify-web-api-node');

const app = express()
const PORT = process.env.PORT || 3000;
dotenv.config();

let refreshInterval = null;
const redirectUri = process.env.NODE_ENV === "dev" ? "http://localhost:3000/code" : 'https://spotify-api-pnodseth-dev.herokuapp.com/code'


const spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENTID,
  clientSecret: process.env.CLIENTSECRET,
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
    function(data) {

      // Set the access token on the API object to use it in later calls
      spotifyApi.setAccessToken(data.body['access_token']);
      spotifyApi.setRefreshToken(data.body['refresh_token']);

      if (refreshInterval !== null) {
        clearInterval(refreshInterval)
      }
      refreshInterval = setInterval(() => {
        spotifyApi.refreshAccessToken().then(
          function(data) {
            console.log('The access token has been refreshed!');

            // Save the access token so that it's used in future calls
            spotifyApi.setAccessToken(data.body['access_token']);
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
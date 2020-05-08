const express = require('express')
const dotenv = require("dotenv")

const app = express()
const PORT = process.env.PORT || 3000;
dotenv.config();

var SpotifyWebApi = require('spotify-web-api-node');
var spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENTID,
  clientSecret: process.env.CLIENTSECRET,
  redirectUri: 'https://spotify-api-pnodseth-dev.herokuapp.com/code',
  accessToken: "BQD042QTtxxdsLMigvJJYXdoyU-hH-uNp26MEZPqF9W5B3y6fHZGFrF8yHAWrgCvSLHxfSVQwELHYKSXtAw5d_1S0VizPReCBXBVji15f0WC_PluAGQIi2mZRLte-oEWT0mhpZiRWr_jgOVooFlw7ICFVPfrC8kuhend",
  refreshToken: "AQBMwq90SXJJAsNfxGDavgvGAMdVyChhkH8HvvA2mVX2I5HmU_tkUnV7mrOPaWejlPTfA17OegpNbb80TZqRkGxp2b8WQTcX5ghJzALKq89KyewciCDG-SE60sp0Nu25MWs"
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
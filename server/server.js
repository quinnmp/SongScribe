const axios = require("axios");
const qs = require("qs");
const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const cors = require("cors");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({ origin: "http://127.0.0.1:5173" }));
require("dotenv").config();

const clientID = process.env.SPOTIFY_API_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const authToken = Buffer.from(`${clientID}:${clientSecret}`, "utf-8").toString(
    "base64"
);

let accessToken = "";

let playerData = undefined;

async function getAuth(code, state) {
    try {
        const data = qs.stringify({
            grant_type: "authorization_code",
            code: code,
            redirect_uri: "http://localhost:5000/callback",
        });
        const tokenURL = "https://accounts.spotify.com/api/token?" + data;

        const response = await axios.post(
            tokenURL,
            {},
            {
                headers: {
                    Authorization: `Basic ${authToken}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );
        return response.data.access_token;
    } catch (error) {
        console.log(error);
    }
}

async function getPlayerState() {
    const apiURL = `https://api.spotify.com/v1/me/player`;

    try {
        const response = await axios.get(apiURL, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        playerData = response.data;
    } catch (error) {
        console.log(error);
    }
}

function makeID(length) {
    let result = "";
    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(
            Math.floor(Math.random() * charactersLength)
        );
        counter += 1;
    }
    return result;
}

app.get("/login", function (req, res) {
    var state = makeID(16);
    var scope = "user-read-playback-state";

    res.redirect(
        "https://accounts.spotify.com/authorize?" +
            qs.stringify({
                response_type: "code",
                client_id: clientID,
                scope: scope,
                redirect_uri: "http://localhost:5000/callback",
                state: state,
            })
    );
});

app.get("/callback", async function (req, res) {
    accessToken = await getAuth(req.query.code, req.query.state);
    res.redirect("/api");
});

app.get("/api", (req, res) => {
    if (accessToken == "") {
        res.redirect("/login");
    }
    getPlayerState();
    res.send(playerData);
});

app.listen(5000, () => {
    console.log("Server started on port 5000");
});

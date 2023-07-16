const axios = require("axios");
const qs = require("qs");
const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({ origin: "http://127.0.0.1:5173" }));
require("dotenv").config();

mongoose.connect(
    `mongodb+srv://miles:${process.env.DB_PASSWORD}@userscribes.rzgicer.mongodb.net/`
);

const userScribesSchema = new mongoose.Schema({
    id: String,
    songs: [
        {
            id: String,
            quickSummary: String,
            review: String,
            notes: [
                {
                    timestamp: String,
                    length: Number,
                    note: String,
                },
            ],
        },
    ],
});

const UserScribe = mongoose.model("UserScribe", userScribesSchema);

let userScribeArray = new Array();
async function retrieveUserScribes() {
    try {
        userScribeArray = await UserScribe.find({}).exec();
    } catch (e) {
        console.log(e);
    }
}

const clientID = process.env.SPOTIFY_API_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const authToken = Buffer.from(`${clientID}:${clientSecret}`, "utf-8").toString(
    "base64"
);

let accessToken = "";

let playerData = undefined;

async function getAuth(code) {
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
        return response.data;
    } catch (error) {
        console.log(error);
    }
}

async function getAlbumData(id) {
    const apiURL = `https://api.spotify.com/v1/albums/` + id;

    try {
        const response = await axios.get(apiURL, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return response.data;
    } catch (error) {
        console.log(error);
    }
}

async function getUserData() {
    const apiURL = `https://api.spotify.com/v1/me`;

    try {
        const response = await axios.get(apiURL, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return response.data;
    } catch (error) {
        console.log(error);
    }
}

async function seekToPosition(timeInMS) {
    const apiURL = `https://api.spotify.com/v1/me/player/seek`;

    const data = {
        position_ms: timeInMS,
    };

    try {
        await axios.put(apiURL, null, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            params: data,
        });
    } catch (error) {
        console.log(error.response.data);
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
    var scope =
        "user-read-playback-state user-modify-playback-state user-read-private user-read-email";

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

app.get("/api", async (req, res) => {
    if (accessToken == "") {
        res.redirect("/login");
    } else {
        retrieveUserScribes();
        const userData = await getUserData();
        const playerData = await getPlayerState();
        let albumData = {};
        if (playerData) {
            if (playerData.item) {
                albumData = await getAlbumData(playerData.item.album.id);
            }
        }

        let trackIDArray = [];
        if (albumData) {
            if (albumData.tracks) {
                albumData.tracks.items.map((track) => {
                    trackIDArray.push(track.id);
                });
            }
        }

        let databaseData = {
            quickSummary: "",
            review: "",
            notes: [],
        };
        let playingSongID = "";
        let albumReviews = [];
        let songsWithData = [];

        if (playerData.item) {
            playingSongID = playerData.item.id;
        }
        await userScribeArray.forEach((scribe) => {
            if (scribe.id === userData.id) {
                scribe.songs.forEach((song) => {
                    if (song.id === playingSongID) {
                        databaseData = song;
                    }
                    if (trackIDArray.includes(song.id)) {
                        albumReviews.push({
                            id: song.id,
                            quick_summary: song.quickSummary,
                            review_count: song.notes.length,
                        });
                        songsWithData.push(song.id);
                    }
                });
            }
        });

        res.send(
            JSON.stringify({
                spotify_player_data: playerData,
                spotify_album_data: albumData,
                database_data: databaseData,
                album_reviews: albumReviews,
                songs_with_data: songsWithData,
            })
        );
    }
});

app.put("/api", (req, res) => {
    if (accessToken == "") {
        res.redirect("/login");
    }
    seekToPosition(req.body.timeInMS);
    res.send(JSON.stringify({ status: "success" }));
});

app.post("/api", async (req, res) => {
    console.log(req.body);
    retrieveUserScribes();
    const userData = await getUserData();
    let containsUser = false;
    let containsSong = false;
    userScribeArray.forEach((scribe) => {
        if (scribe.id === userData.id) {
            containsUser = true;
        }
    });
    if (!containsUser) {
        const userScribe = new UserScribe({
            id: userData.id,
            songs: [],
        });
        userScribe.save();
    }
    userScribeArray.forEach((scribe) => {
        if (scribe.id === userData.id) {
            scribe.songs.forEach((song) => {
                if (song.id === req.body.id) {
                    containsSong = true;
                    song.quickSummary = req.body.quickSummary;
                    song.review = req.body.review;
                    song.notes = req.body.notes;
                }
            });
            if (!containsSong) {
                scribe.songs.push({
                    id: req.body.id,
                    quickSummary: req.body.quickSummary,
                    review: req.body.review,
                    notes: req.body.notes,
                });
            }
            scribe.save();
        }
    });
    res.send(JSON.stringify({ status: "success" }));
});

app.listen(5000, () => {
    console.log("Server started on port 5000");
});

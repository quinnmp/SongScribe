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
        console.log(e.response.data);
    }
}

const clientID = process.env.SPOTIFY_API_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const authToken = Buffer.from(`${clientID}:${clientSecret}`, "utf-8").toString(
    "base64"
);

let accessToken = "";
let refreshToken = "";

let albumData = "";
let userData = "";
let albumID = -1;

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
        return {
            access_token: response.data.access_token,
            refresh_token: response.data.refresh_token,
        };
    } catch (e) {
        console.log(e.response.data);
    }
}

async function getRefreshedToken(refreshToken) {
    try {
        const data = qs.stringify({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
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
    } catch (e) {
        console.log(e.response.data);
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
    } catch (e) {
        console.log(e.response.data);
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
    } catch (e) {
        console.log(e.response.data);
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
    } catch (e) {
        console.log(e.response.data);
    }
}

async function getLastPlayedSong() {
    const apiURL = `https://api.spotify.com/v1/me/player/recently-played`;

    try {
        const response = await axios.get(apiURL, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return response.data.items[0].track;
    } catch (e) {
        console.log(e.response.data);
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
    } catch (e) {
        console.log(e.response.data);
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
    console.log("GET /login");
    var state = makeID(16);
    var scope =
        "user-read-playback-state user-modify-playback-state user-read-private user-read-email user-read-recently-played";

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
    console.log("GET /callback");
    let authData = await getAuth(req.query.code, req.query.state);
    if (authData) {
        accessToken = authData.access_token;
        refreshToken = authData.refresh_token;
    }
    res.redirect("/api");
});

app.get("/api", async (req, res) => {
    console.log("GET /api");
    if (accessToken === "") {
        console.log("No token, retrieving");
        res.redirect("/login");
        return;
    } else {
        try {
            console.log("Retrieving database data");
            retrieveUserScribes();
            if (userData === "") {
                console.log("Getting user data");
                userData = await getUserData();
            } else {
                console.log("User data not empty, no update needed");
            }
            console.log("Getting player data");
            let playerData = await getPlayerState();
            if (!playerData.item) {
                console.log("Bad playerData");
                playerData = { item: await getLastPlayedSong() };
            }
            if (playerData.item.album.id !== albumID) {
                console.log("Getting album data");
                albumData = await getAlbumData(playerData.item.album.id);
                albumID = playerData.item.album.id;
            } else {
                console.log("Album has not changed, no update needed");
            }

            let trackIDArray = [];
            albumData.tracks.items.map((track) => {
                trackIDArray.push(track.id);
            });
            let databaseData = {
                quickSummary: "",
                review: "",
                notes: [],
            };
            let playingSongID = "";
            let albumReviews = [];
            let songsWithData = [];

            playingSongID = playerData.item.id;
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
        } catch (e) {
            console.log(
                "Token is expired or something else went wrong in the retrieval process"
            );
            console.log(e);
            accessToken = await getRefreshedToken(refreshToken);
        }
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
    if (!req.quickSummary && !req.review && !req.notes) {
        console.log("Empty note, POST rejected");
        res.send(JSON.stringify({ status: "failure" }));
    } else {
        await retrieveUserScribes();
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
            await userScribe.save();
            await retrieveUserScribes();
        }
        userScribeArray.forEach(async (scribe) => {
            if (scribe.id === userData.id) {
                console.log("Account found!");
                scribe.songs.forEach((song) => {
                    if (song.id === req.body.id) {
                        console.log("Song exists already, updating info");
                        containsSong = true;
                        song.quickSummary = req.body.quickSummary;
                        song.review = req.body.review;
                        song.notes = req.body.notes;
                    }
                });
                if (!containsSong) {
                    console.log("Song does not exist, pushing new data");
                    scribe.songs.push({
                        id: req.body.id,
                        quickSummary: req.body.quickSummary,
                        review: req.body.review,
                        notes: req.body.notes,
                    });
                }
                await scribe.save();
            }
        });
        res.send(JSON.stringify({ status: "success" }));
    }
});

app.listen(5000, () => {
    console.log("Server started on port 5000");
});

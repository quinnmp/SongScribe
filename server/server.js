const axios = require("axios");
const qs = require("qs");
const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./user.js");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
require("dotenv").config();

const corsUrl =
    process.env.NODE_ENV !== "production"
        ? "http://localhost:5173"
        : "https://songscribe.onrender.com";
const mainUrl =
    process.env.NODE_ENV !== "production"
        ? "http://localhost:5000"
        : "https://songscribe-api.onrender.com";
app.use(cors({ origin: corsUrl }));

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

let userScribeArray = "";

async function retrieveUserScribes() {
    try {
        userScribeArray = await UserScribe.find({}).exec();
        console.log("Database data updated");
    } catch (e) {
        console.log(e.response.data);
    }
}

const clientID = process.env.SPOTIFY_API_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const authToken = Buffer.from(`${clientID}:${clientSecret}`, "utf-8").toString(
    "base64"
);

let geniusClientID = process.env.GENIUS_API_ID;
let geniusClientSecret = process.env.GENIUS_CLIENT_SECRET;

let userIDs = {};
let userObjects = {};

let lastCodeReq = "";
let lastGeniusCodeReq = "";

async function getAuth(code) {
    try {
        const data = qs.stringify({
            grant_type: "authorization_code",
            code: code,
            redirect_uri: corsUrl,
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

async function getGeniusAuth(code) {
    try {
        const data = qs.stringify({
            grant_type: "authorization_code",
            code: code,
            client_secret: geniusClientSecret,
            client_id: geniusClientID,
            redirect_uri: corsUrl,
            response_type: "code",
        });
        const tokenURL = "https://api.genius.com/oauth/token?" + data;

        const response = await axios.post(
            tokenURL,
            {},
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );
        return {
            access_token: response.data.access_token,
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

async function getPlayerState(accessToken) {
    const apiURL = `https://api.spotify.com/v1/me/player`;
    let userID = userIDs[accessToken];

    try {
        const response = await axios.get(apiURL, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        if (response.data.progress_ms) {
            return response.data;
        } else {
            console.log("Bad playerData, returning stale data");
            return userObjects[userID].playerData;
        }
    } catch (e) {
        try {
            console.log(e.response.data);
        } catch (secondaryException) {
            console.log(e);
        }
    }
}

async function getAlbumData(id, accessToken) {
    const apiURL = `https://api.spotify.com/v1/albums/` + id;

    try {
        const response = await axios.get(apiURL, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        response.data.tracks.items = await getUnlimitedTracklist(id);
        return response.data;
    } catch (e) {
        console.log(e.response.data);
    }
}

async function getUnlimitedTracklist(id) {
    const apiURL = `https://api.spotify.com/v1/albums/` + id + `/tracks`;
    let items = [];

    const data = {
        limit: 50,
    };

    try {
        const response = await axios.get(apiURL, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            params: data,
        });
        items = response.data.items;
        let next = response.data.next;
        while (next) {
            try {
                let secondaryResponse = await axios.get(next, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                next = secondaryResponse.data.next;
                items = items.concat(secondaryResponse.data.items);
            } catch (e) {
                console.log("Error in getting tracklist");
                console.log(e);
            }
        }
    } catch (e) {
        console.log(e.response.data);
    }

    return items;
}

async function getSongData(id, accessToken) {
    const apiURL = `https://api.spotify.com/v1/tracks/` + id;

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

async function getRecentNoteData(userID, accessToken) {
    console.log("Getting recent note data");

    let recentNoteData = [];
    for (const scribe of userScribeArray) {
        if (scribe.id === userID) {
            for (let i = scribe.songs.length - 1; i >= 0; i--) {
                const songData = await getSongData(
                    scribe.songs[i].id,
                    accessToken
                );
                recentNoteData.push(songData);
                if (recentNoteData.length >= 5) {
                    break;
                }
            }
            return recentNoteData;
        }
    }
}

async function getUserData(accessToken) {
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

function cleanSongTitle(title) {
    // Define a regular expression pattern to match "remastered" or "remaster" with optional year
    const remasterPattern = /\(?\s*remaster(ed)?(\s*\d+)?\s*\)?/gi;

    // Define a regular expression pattern to match "- [year]"
    const yearPattern = /\s*-\s*\d+/g;

    // Define a regular expression pattern to match featured artists
    const featuredArtistPattern =
        /\s*\(?\s*(with|feat|ft\.?)\s*[\w\s\.-]+\)?/gi;

    // Replace the matched "remastered" or "remaster" pattern with an empty string
    let cleanedTitle = title.replace(remasterPattern, "");

    // Replace the matched "- [year]" pattern with an empty string
    cleanedTitle = cleanedTitle.replace(yearPattern, "");

    // Replace the matched featured artist pattern with an empty string
    cleanedTitle = cleanedTitle.replace(featuredArtistPattern, "");

    // Remove any extra whitespace from the beginning and end of the cleaned title
    return cleanedTitle.trim();
}

async function getSongLyrics(queue, userID) {
    let searchTerm = "";
    if (queue) {
        let name = cleanSongTitle(userObjects[userID].queueSongData.name);
        searchTerm =
            name + " " + userObjects[userID].queueSongData.artists[0].name;
    } else {
        let name = cleanSongTitle(userObjects[userID].playerData.item.name);
        searchTerm =
            name + " " + userObjects[userID].playerData.item.artists[0].name;
    }
    const apiURL = `https://api.genius.com/search?q=` + searchTerm;

    try {
        const response = await axios.get(apiURL, {
            headers: {
                Authorization: `Bearer ${geniusAccessToken}`,
            },
        });
        try {
            console.log("Getting song Lyrics");
            const secondaryResponse = await axios.get(
                response.data.response.hits[0].result.url
            );
            console.log("Response recieved");
            lyricDataArray = secondaryResponse.data.split(
                "<div data-lyrics-container="
            );
            let fullLyrics = "";
            lyricDataArray.map((lyricSection, index) => {
                if (index !== 0) {
                    lyricSection = lyricSection.split(/>(.*)/s)[1];
                    lyricSection = lyricSection.split("</div>")[0];
                    lyricSection = lyricSection.replace(/<a[^>]*>/g, "");
                    lyricSection = lyricSection.replace(/<span[^>]*>/g, "");
                    lyricSection = lyricSection.replace("</a>", "");
                    lyricSection = lyricSection.replace("</span>", "");
                    fullLyrics = fullLyrics
                        .concat(lyricSection)
                        .concat("<br />");
                }
            });
            fullLyrics = await fullLyrics.replace('"', '\\"');
            fullLyrics = await fullLyrics.replace("\\", "\\\\");
            return { fullLyricHTML: fullLyrics };
        } catch (e) {
            console.log("Song lyrics not found");
        }
    } catch (e) {
        console.log(e);
    }
}

async function seekToPosition(timeInMS, accessToken) {
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

function handleAuthURI() {
    console.log("Auth Spotify");
    const state = makeID(16);
    const scope =
        "user-read-playback-state user-modify-playback-state user-read-private user-read-email";

    return (
        "https://accounts.spotify.com/authorize?" +
        qs.stringify({
            response_type: "code",
            client_id: clientID,
            scope: scope,
            redirect_uri: corsUrl,
            state: state,
        })
    );
}

function handleGeniusAuthURI(userID) {
    const apiURL = `https://api.genius.com/oauth/authorize`;

    const state = makeID(16);
    const scope = "";

    return (
        apiURL +
        "?" +
        qs.stringify({
            response_type: "code",
            client_id: geniusClientID,
            scope: scope,
            redirect_uri: corsUrl,
            state: state,
        })
    );
}

async function handleQueue(withLyrics, userID) {
    const apiURL = `https://api.spotify.com/v1/me/player/queue`;
    console.log("Updating queue data");

    try {
        const response = await axios.get(apiURL, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        if (
            response.data.queue.length !== 0 &&
            response.data.queue[0].album.id
        ) {
            userObjects[userID].queueAlbumData = await getAlbumData(
                response.data.queue[0].album.id,
                accessToken
            );
            userObjects[userID].queueSongData = response.data.queue[0];
            if (withLyrics) {
                userObjects[userID].queueLyricData = await getSongLyrics(
                    true,
                    userID
                );
            }
        }
        return response.data;
    } catch (e) {
        console.log("Could not read queue!");
    }
}

app.get("/callback", async function (req, res) {
    // Prevent subsequent duplicate requests
    if (lastCodeReq === req.query.code) {
        return;
    }
    lastCodeReq = req.query.code;
    console.log("GET /callback");
    let authData = await getAuth(req.query.code, req.query.state);
    if (authData) {
        res.send(
            JSON.stringify({
                access_token: authData.access_token,
                refresh_token: authData.refresh_token,
            })
        );
    }
});

app.get("/genius_callback", async function (req, res) {
    // Prevent subsequent duplicate requests
    if (lastGeniusCodeReq === req.query.code) {
        return;
    }
    lastGeniusCodeReq = req.query.code;
    console.log("GET /genius_callback");
    let authData = await getGeniusAuth(req.query.code, req.query.state);
    if (authData) {
        res.send(
            JSON.stringify({
                access_token: authData.access_token,
            })
        );
    }
});

app.get("/api", async (req, res) => {
    console.log("GET /api");
    accessToken = req.query.access_token;
    geniusAccessToken = req.query.genius_access_token;
    refreshToken = req.query.refresh_token;

    let userID = userIDs[accessToken];

    if (!userObjects[userID] || !userObjects[userID].newSong) {
        if (accessToken === "null") {
            console.log("No token, retrieving");
            let spotify_auth_uri = handleAuthURI();
            res.send(JSON.stringify({ uri: spotify_auth_uri }));
        } else if (
            req.query.get_lyrics == "true" &&
            geniusAccessToken === "null"
        ) {
            console.log("No Genius token, retrieving");
            let genius_auth_uri = handleGeniusAuthURI(userID);
            res.send(JSON.stringify({ uri: genius_auth_uri }));
        } else {
            try {
                if (!userScribeArray) {
                    console.log("Retrieving database data");
                    await retrieveUserScribes();
                }
                if (!userID) {
                    console.log("Getting user data");
                    userData = await getUserData(accessToken);
                    userIDs[accessToken] = userData.id;
                    userID = userIDs[accessToken];
                    if (!userObjects[userID]) {
                        userObjects[userID] = new User();
                    }
                    userObjects[userID].recentNoteData =
                        await getRecentNoteData(userID, accessToken);
                }
                console.log("Getting player data");
                userObjects[userID].playerData = await getPlayerState(
                    accessToken
                );
                if (userObjects[userID].playerData !== "") {
                    if (
                        userObjects[userID].playerData.item.album.id !==
                        userObjects[userID].albumID
                    ) {
                        if (
                            userObjects[userID].queueAlbumData &&
                            userObjects[userID].playerData.item.album.id ===
                                userObjects[userID].queueAlbumData.id
                        ) {
                            userObjects[userID].albumData =
                                userObjects[userID].queueAlbumData;
                        } else {
                            console.log("Getting album data");
                            userObjects[userID].albumData = await getAlbumData(
                                userObjects[userID].playerData.item.album.id,
                                accessToken
                            );
                        }
                        userObjects[userID].albumID =
                            userObjects[userID].albumData.id;
                    }
                    let trackIDArray = [];
                    userObjects[userID].albumData.tracks.items.map((track) => {
                        trackIDArray.push(track.id);
                    });
                    let databaseData = {
                        quickSummary: "",
                        review: "",
                        notes: [],
                    };
                    let albumReviews = [];
                    let songsWithData = [];
                    if (
                        userObjects[userID].playingSongID !==
                            userObjects[userID].playerData.item.id ||
                        req.query.new_client
                    ) {
                        userObjects[userID].newSong = true;
                        if (
                            userObjects[userID].queueLyricData &&
                            userObjects[userID].queueSongData.id ===
                                userObjects[userID].playerData.item.id
                        ) {
                            if (req.query.get_lyrics == "true") {
                                userObjects[userID].lyricData =
                                    userObjects[userID].queueLyricData;
                                userObjects[userID].queueLyricData = "";
                            }
                            userObjects[userID].playingSongID =
                                userObjects[userID].queueSongData.id;
                        } else {
                            if (req.query.get_lyrics == "true") {
                                console.log("New song, getting lyric data");
                                userObjects[userID].lyricData =
                                    await getSongLyrics(false, userID);
                            }
                            userObjects[userID].playingSongID =
                                userObjects[userID].playerData.item.id;
                        }
                    }
                    console.log("Loading database data");
                    await userScribeArray.forEach((scribe) => {
                        if (scribe.id === userData.id) {
                            scribe.songs.forEach((song) => {
                                if (
                                    song.id ===
                                    userObjects[userID].playingSongID
                                ) {
                                    databaseData = song;
                                }
                                if (trackIDArray.includes(song.id)) {
                                    albumReviews.push({
                                        id: song.id,
                                        quick_summary: song.quickSummary,
                                        review: song.review,
                                        notes: song.notes,
                                        review_count: song.notes.length,
                                    });
                                    songsWithData.push(song.id);
                                }
                            });
                        }
                    });
                    if (userObjects[userID].newSong) {
                        userObjects[userID].newSong = false;
                        handleQueue(req.query.get_lyrics == "true", userID);
                    }
                    res.send(
                        JSON.stringify({
                            spotify_player_data: userObjects[userID].playerData,
                            spotify_album_data: userObjects[userID].albumData,
                            database_data: databaseData,
                            album_reviews: albumReviews,
                            songs_with_data: songsWithData,
                            recent_notes: userObjects[userID].recentNoteData,
                            song_lyrics_html: userObjects[userID].lyricData,
                        })
                    );
                } else {
                    res.send(
                        JSON.stringify({ status: "failure, no active device" })
                    );
                }
            } catch (e) {
                if (!userObjects[userID] || !userObjects[userID].newSong) {
                    console.log(
                        "Token is expired or something else went wrong in the retrieval process"
                    );
                    console.log(e);
                    let refreshTokenRes = await getRefreshedToken(refreshToken);
                    res.send(JSON.stringify({ access_token: refreshTokenRes }));
                } else {
                    console.log(e);
                }
            }
        }
    }
});

app.put("/api", async (req, res) => {
    console.log("PUT /api");
    accessToken = req.query.access_token;
    if (accessToken === "null") {
        res.send(JSON.stringify({ status: "failure, no accessToken" }));
    } else {
        await seekToPosition(req.body.timeInMS, accessToken);
        res.send(JSON.stringify({ status: "success" }));
    }
});

app.put("/playback-control", async (req, res) => {
    console.log("PUT /playback-control");
    accessToken = req.query.access_token;
    let userID = userIDs[accessToken];
    const paused = req.body.paused;
    const apiURL = paused
        ? `https://api.spotify.com/v1/me/player/play`
        : `https://api.spotify.com/v1/me/player/pause`;
    let data = {};
    if (paused) {
        data = {
            position_ms: userObjects[userID].playerData.progress_ms,
        };
    }
    try {
        await axios.put(apiURL, data, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });
        res.send(JSON.stringify({ status: "success" }));
    } catch (e) {
        console.log(e.response);
        res.send(JSON.stringify({ status: "failure" }));
    }
});

app.post("/api", async (req, res) => {
    accessToken = req.body.access_token;
    let userID = userIDs[accessToken];
    if (!userObjects[userID].currentlyProcessingNote) {
        userObjects[userID].currentlyProcessingNote = true;
        let reqData = await req.body;
        if (!reqData.quickSummary) {
            console.log("No summary");
        }
        if (!reqData.review) {
            console.log("No review");
        }
        if (reqData.notes.length === 0) {
            console.log("No notes");
        }
        await retrieveUserScribes();
        const userData = await getUserData(accessToken);
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
        let noteEmpty =
            (!reqData.quickSummary &&
                !reqData.review &&
                reqData.notes.length === 0) ||
            !reqData.id;
        let skipPush = false;
        let currentlyProcessingNoteFlag = true;
        userScribeArray.forEach(async (scribe) => {
            if (scribe.id === userData.id) {
                console.log("Account found!");
                scribe.songs.forEach(async (song, index) => {
                    if (song.id === req.body.id) {
                        if (noteEmpty) {
                            console.log("Empty note, deleting song");
                            scribe.songs.splice(index, 1);
                            skipPush = true;
                        } else {
                            containsSong = true;
                            if (
                                song.quickSummary === req.body.quickSummary &&
                                song.review === req.body.review &&
                                JSON.stringify(song.notes) ===
                                    JSON.stringify(req.body.notes)
                            ) {
                                console.log("No new data, POST rejected");
                                setTimeout(() => {
                                    userObjects[
                                        userID
                                    ].currentlyProcessingNote = false;
                                }, 10000);
                                currentlyProcessingNoteFlag = false;
                                res.send(JSON.stringify({ status: "failure" }));
                            } else {
                                console.log(
                                    "Song exists already, updating info"
                                );
                                song.quickSummary = req.body.quickSummary;
                                song.review = req.body.review;
                                song.notes = req.body.notes;
                            }
                        }
                    }
                });
                if (!containsSong && !skipPush) {
                    console.log("Song does not exist, pushing new data");
                    if (noteEmpty) {
                        console.log("Empty note, POST rejected");
                        setTimeout(
                            () =>
                                (userObjects[
                                    userID
                                ].currentlyProcessingNote = false),
                            10000
                        );
                        currentlyProcessingNoteFlag = false;
                        res.send(JSON.stringify({ status: "failure" }));
                        return;
                    }
                    scribe.songs.push({
                        id: req.body.id,
                        quickSummary: req.body.quickSummary,
                        review: req.body.review,
                        notes: req.body.notes,
                    });
                }
                if (currentlyProcessingNoteFlag) {
                    await scribe.save();
                    await retrieveUserScribes();
                    userObjects[userID].recentNoteData =
                        await getRecentNoteData(userID, accessToken);
                    setTimeout(() => {
                        userObjects[userID].currentlyProcessingNote = false;
                    }, 10000);
                    currentlyProcessingNoteFlag = false;
                    console.log("Sending success");
                    res.send(JSON.stringify({ status: "success" }));
                }
            }
        });
    } else {
        console.log("Currently processing note");
        res.send(JSON.stringify({ status: "failure" }));
    }
});

app.get("/logout", async (req, res) => {
    accessToken = req.query.access_token;
    let userID = userIDs[accessToken];

    console.log("GET /logout");
    delete userObjects[userID];
    delete userIDs[accessToken];
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log("Server started on port " + PORT);
    console.log(process.env.NODE_ENV);
});

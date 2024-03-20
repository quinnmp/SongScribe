const axios = require("axios");
const qs = require("qs");
const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
require("dotenv").config();

const corsUrl =
    process.env.NODE_ENV !== "production"
        ? "http://localhost:5173"
        : "https://songscribe.onrender.com";
const mainUrl =
    process.env.NODE_ENV !== "production"
        ? "http://localhost:5000"
        : "https://songscribe-api.onrender.com";
app.use(cors({origin: corsUrl}));

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

let accessToken = "";
let refreshToken = "";

let geniusAuthAttempted = false;
let geniusAccessToken = "";

let albumData = "";
let queueAlbumData = "";
let queueSongData = "";
let userData = "";
let playerData = "";
let lyricData = "";
let queueLyricData = "";
let playingSongID = "";
let recentNoteData = [];
let albumID = -1;

let newSong = false;
let loggedOut = false;

let currentlyProcessingNote = false;

async function getAuth(code) {
    try {
        const data = qs.stringify({
            grant_type: "authorization_code",
            code: code,
            redirect_uri:
                process.env.NODE_ENV !== "production"
                    ? "http://localhost:5000/callback"
                    : "https://songscribe-api.onrender.com/callback",
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

async function getPlayerState() {
    const apiURL = `https://api.spotify.com/v1/me/player`;

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
            return playerData;
        }
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

async function getSongData(id) {
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

async function getRecentNoteData() {
    console.log("Getting recent note data");

    recentNoteData = [];
    for (const scribe of userScribeArray) {
        if (scribe.id === userData.id) {
            for (let i = scribe.songs.length - 1; i > 0; i--) {
                const songData = await getSongData(scribe.songs[i].id);
                recentNoteData.push(songData);
                if (recentNoteData.length >= 5) {
                    break;
                }
            }
            return recentNoteData;
        }
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

function cleanSongTitle(title) {
    // Define a regular expression pattern to match "remastered" or "remaster" with optional year
    const remasterPattern = /\(?\s*remaster(ed)?(\s*\d+)?\s*\)?/gi;

    // Define a regular expression pattern to match "- [year]"
    const yearPattern = /\s*-\s*\d+/g;

    // Define a regular expression pattern to match featured artists
    const featuredArtistPattern = /\s*\(?\s*(with|feat|ft\.?)\s*[\w\s\.-]+\)?/gi;

    // Replace the matched "remastered" or "remaster" pattern with an empty string
    let cleanedTitle = title.replace(remasterPattern, '');

    // Replace the matched "- [year]" pattern with an empty string
    cleanedTitle = cleanedTitle.replace(yearPattern, '');

    // Replace the matched featured artist pattern with an empty string
    cleanedTitle = cleanedTitle.replace(featuredArtistPattern, '');

    // Remove any extra whitespace from the beginning and end of the cleaned title
    return cleanedTitle.trim();
}

async function getSongLyrics(queue) {
    let searchTerm = "";
    if (queue) {
        let name = cleanSongTitle(queueSongData.name)
        searchTerm = name + " " + queueSongData.artists[0].name;
    } else {
        let name = cleanSongTitle(playerData.item.name)
        searchTerm =
            name + " " + playerData.item.artists[0].name;
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
            return {fullLyricHTML: fullLyrics};
        } catch (e) {
            console.log("Song lyrics not found");
        }
    } catch (e) {
        console.log(e);
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

function handleAuthURI() {
    const state = makeID(16);
    const scope =
        "user-read-playback-state user-modify-playback-state user-read-private user-read-email";

    return (
        "https://accounts.spotify.com/authorize?" +
        qs.stringify({
            response_type: "code",
            client_id: clientID,
            scope: scope,
            redirect_uri:
                process.env.NODE_ENV !== "production"
                    ? "http://localhost:5000/callback"
                    : "https://songscribe-api.onrender.com/callback",
            state: state,
        })
    );
}

function handleGeniusAuthURI() {
    const apiURL = `https://api.genius.com/oauth/authorize`;

    const state = makeID(16);
    const scope = "";

    geniusAuthAttempted = true;
    return (
        apiURL + "?" +
        qs.stringify({
            response_type: "code",
            client_id: geniusClientID,
            scope: scope,
            redirect_uri: corsUrl,
            state: state,
        })
    );
}

async function handleQueue() {
    const apiURL = `https://api.spotify.com/v1/me/player/queue`;

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
            console.log("Updating queue data");
            queueAlbumData = await getAlbumData(
                response.data.queue[0].album.id
            );
            queueSongData = response.data.queue[0];
            queueLyricData = await getSongLyrics(true);
        }
        return response.data;
    } catch (e) {
        console.log(e);
    }
}

app.get("/callback", async function (req, res) {
    console.log("GET /callback");
    let authData = await getAuth(req.query.code, req.query.state);
    if (authData) {
        accessToken = authData.access_token;
        refreshToken = authData.refresh_token;
    }
});

app.get("/genius_callback", async function (req, res) {
    console.log("GET /genius_callback");
    let authData = await getGeniusAuth(req.query.code, req.query.state);
    if (authData) {
        geniusAccessToken = authData.access_token;
    } else {
        geniusAuthAttempted = false;
    }
});

app.get("/api", async (req, res) => {
    console.log("GET /api");
    if (!loggedOut) {
        if (accessToken === "") {
            console.log("No token, retrieving");
            let spotify_auth_uri = handleAuthURI();
            res.send(JSON.stringify({uri: spotify_auth_uri}));

        } else if (geniusAccessToken === "") {
            if (!geniusAuthAttempted) {
                console.log("No Genius token, retrieving");
                let genius_auth_uri = handleGeniusAuthURI();
                res.send(JSON.stringify({uri: genius_auth_uri}));

            } else {
                axios.get(mainUrl + "/genius_callback");
            }
        } else {
            try {
                if (!userScribeArray) {
                    console.log("Retrieving database data");
                    await retrieveUserScribes();
                }
                if (userData === "") {
                    console.log("Getting user data");
                    userData = await getUserData();
                    recentNoteData = await getRecentNoteData();
                }
                console.log("Getting player data");
                playerData = await getPlayerState();
                if (playerData !== "") {
                    if (playerData.item.album.id !== albumID) {
                        if (
                            queueAlbumData &&
                            playerData.item.album.id === queueAlbumData.id
                        ) {
                            albumData = queueAlbumData;
                        } else {
                            console.log("Getting album data");
                            albumData = await getAlbumData(
                                playerData.item.album.id
                            );
                        }
                        albumID = albumData.id;
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
                    let albumReviews = [];
                    let songsWithData = [];
                    if (playingSongID !== playerData.item.id) {
                        newSong = true;
                        if (
                            queueLyricData &&
                            queueSongData.id === playerData.item.id
                        ) {
                            lyricData = queueLyricData;
                            playingSongID = queueSongData.id;
                            queueLyricData = "";
                        } else {
                            console.log("New song, getting lyric data");
                            lyricData = await getSongLyrics(false);
                            playingSongID = playerData.item.id;
                        }
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
                                        review: song.review,
                                        notes: song.notes,
                                        review_count: song.notes.length,
                                    });
                                    songsWithData.push(song.id);
                                }
                            });
                        }
                    });
                    if (newSong) {
                        newSong = false;
                        handleQueue();
                    }
                    res.send(
                        JSON.stringify({
                            spotify_player_data: playerData,
                            spotify_album_data: albumData,
                            database_data: databaseData,
                            album_reviews: albumReviews,
                            songs_with_data: songsWithData,
                            recent_notes: recentNoteData,
                            song_lyrics_html: lyricData,
                        })
                    );
                } else {
                    res.send(
                        JSON.stringify({status: "failure, no active device"})
                    );
                }
            } catch (e) {
                if (!loggedOut) {
                    console.log(
                        "Token is expired or something else went wrong in the retrieval process"
                    );
                    console.log(e);
                    accessToken = await getRefreshedToken(refreshToken);
                    res.send(JSON.stringify({status: "failure"}));
                } else {
                    console.log("User logged out.");
                }
            }
        }
    }
});

app.put("/api", async (req, res) => {
    if (accessToken === "") {
        res.send(JSON.stringify({status: "failure, no accessToken"}));
    } else {
        await seekToPosition(req.body.timeInMS);
        res.send(JSON.stringify({status: "success"}));
    }
});

app.put("/playback-control", async (req, res) => {
    console.log("PUT /playback-control");
    const paused = req.body.paused;
    const apiURL = paused
        ? `https://api.spotify.com/v1/me/player/play`
        : `https://api.spotify.com/v1/me/player/pause`;
    let data = {};
    if (paused) {
        data = {
            position_ms: playerData.progress_ms,
        };
    }
    try {
        await axios.put(apiURL, data, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });
        res.send(JSON.stringify({status: "success"}));
    } catch (e) {
        console.log(e.response);
        res.send(JSON.stringify({status: "failure"}));
    }
});

app.post("/api", async (req, res) => {
    if (!currentlyProcessingNote) {
        currentlyProcessingNote = true;
        console.log(req.body);
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
                                setTimeout(
                                    () => (currentlyProcessingNote = false),
                                    10000
                                );
                                currentlyProcessingNoteFlag = false;
                                res.send(JSON.stringify({status: "failure"}));

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
                            () => (currentlyProcessingNote = false),
                            10000
                        );
                        currentlyProcessingNoteFlag = false;
                        res.send(JSON.stringify({status: "failure"}));
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
                    await getRecentNoteData();
                    setTimeout(() => (currentlyProcessingNote = false), 10000);
                    currentlyProcessingNoteFlag = false;
                    console.log("Sending success");
                    res.send(JSON.stringify({status: "success"}));
                }
            }
        });
    } else {
        console.log("Currently processing note");
        res.send(JSON.stringify({status: "failure"}));
    }
});

app.get("/logout", async (req, res) => {
    console.log("GET /logout");
    userData = "";
    accessToken = "";
    loggedOut = true;
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log("Server started on port " + PORT);
    console.log(process.env.NODE_ENV);
});

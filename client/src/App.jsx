import { useEffect, useState } from "react";

// Components
import AlbumSidebar from "./components/AlbumSidebar.jsx";
import NoteModal from "./components/NoteModal.jsx";
import EditNoteModal from "./components/EditNoteModal.jsx";
import SidebarNote from "./components/SidebarNote.jsx";
import NavBar from "./components/NavBar.jsx";
import NoteArea from "./components/NoteArea.jsx";
import PlaybackBar from "./components/PlaybackBar.jsx";
import SongNoteArea from "./components/SongNoteArea.jsx";
import AlbumTab from "./components/AlbumTab.jsx";
import RecentNote from "./components/RecentNote.jsx";
import PlaybackControl from "./components/PlaybackControl.jsx";
import ErrorModal from "./components/ErrorModal.jsx";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import DisconnectTab from "./components/DisconnectTab.jsx";
import LoggedOutModal from "./components/LoggedOutModal.jsx";

function App() {
    // Initialize Components
    const [songID, setSongID] = useState("");
    const [playbackProgress, setPlaybackProgress] = useState(-1);
    const [playbackProgressString, setPlaybackProgressString] = useState("");
    const [tempTimeStamp, setTempTimeStamp] = useState("");
    const [trackLength, setTrackLength] = useState(-1);
    const [albumCoverURL, setAlbumCoverURL] = useState("");
    const [totalTracks, setTotalTracks] = useState(-1);
    const [trackNumber, setTrackNumber] = useState(-1);
    const [songTitle, setSongTitle] = useState("");
    const [albumTitle, setAlbumTitle] = useState("");
    const [artists, setArtists] = useState([]);
    const [releaseDate, setReleaseDate] = useState("");
    const [notes, setNotes] = useState([]);
    const [scrubbing, setScrubbing] = useState(false);
    const [tracklist, setTracklist] = useState([]);
    const [albumReviews, setAlbumReviews] = useState([]);
    const [albumArtists, setAlbumArtists] = useState([]);
    const [songsWithData, setSongsWithData] = useState([]);
    const [recentData, setRecentData] = useState([]);
    const [paused, setPaused] = useState(false);
    const [sliderProgress, setSliderProgress] = useState(-1);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isLessThanXL, setIsLessThanXL] = useState(window.innerWidth < 1200);
    const [lyricHTML, setLyricHTML] = useState(``);
    const [showLyrics, setShowLyrics] = useState(false);
    const [processingPlayback, setProcessingPlayback] = useState(false);
    const [newClient, setNewClient] = useState(true);
    const [loggedOut, setLoggedOut] = useState(false);

    // Set up URLs
    const apiUrl =
        process.env.NODE_ENV !== "production"
            ? "http://localhost:5000"
            : "https://songscribe-api.onrender.com";
    const mainUrl =
        process.env.NODE_ENV !== "production"
            ? "http://localhost:5173"
            : "https://songscribe.onrender.com";

    useEffect(() => {
        if (loggedOut) {
            return;
        }
        if (!processingPlayback && window.location.href.includes("?code=")) {
            setProcessingPlayback(true);
            let urlCode = window.location.href.split("?code=");
            let state = urlCode[1].split("&state=")[1];
            urlCode = urlCode[1].split("&state=")[0];
            const queryParams = new URLSearchParams({
                code: urlCode,
                state: state,
            });
            const requestOptions = {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            };
            if (urlCode.length > 64) {
                fetch(apiUrl + "/callback?" + queryParams, requestOptions)
                    .then((response) => {
                        return response.json();
                    })
                    .then((data) => {
                        localStorage.setItem("access_token", data.access_token);
                        localStorage.setItem(
                            "refresh_token",
                            data.refresh_token
                        );
                        setProcessingPlayback(false);
                        window.history.pushState(
                            { path: mainUrl },
                            "",
                            mainUrl
                        );
                    });
            } else {
                fetch(
                    apiUrl + "/genius_callback?" + queryParams,
                    requestOptions
                )
                    .then((response) => {
                        return response.json();
                    })
                    .then((data) => {
                        console.log(data);
                        console.log(data.access_token);
                        localStorage.setItem(
                            "genius_access_token",
                            data.access_token
                        );
                        setProcessingPlayback(false);
                        window.history.pushState(
                            { path: mainUrl },
                            "",
                            mainUrl
                        );
                    });
            }
        }

        // Main playback state handler, called every second
        function getPlaybackState() {
            if (processingPlayback) {
                console.log("Loop overrun");
                return;
            } else {
                setProcessingPlayback(true);
            }

            // Make the Spotify request
            const queryParams = new URLSearchParams({
                get_lyrics: showLyrics,
                access_token: localStorage.getItem("access_token"),
                refresh_token: localStorage.getItem("refresh_token"),
                genius_access_token: localStorage.getItem(
                    "genius_access_token"
                ),
                new_client: newClient,
            });
            const requestOptions = {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            };
            const apiUrlMain = apiUrl + "/api?";
            fetch(apiUrlMain + queryParams, requestOptions)
                .then((response) => {
                    return response.json();
                })
                .then((data) => {
                    // If we received some URI in the response, we gotta go there
                    if (data.uri) {
                        setProcessingPlayback(false);
                        window.location.replace(data.uri);
                    } else if (data.access_token) {
                        setProcessingPlayback(false);
                        localStorage.setItem("access_token", data.access_token);
                    } else {
                        try {
                            // If we got player progress, everything is connected
                            // and the user is listening to music.
                            // Update all data accordingly
                            if (data.spotify_player_data.progress_ms) {
                                if (newClient) {
                                    setNewClient(false);
                                }
                                // If the response song ID is not our cached ID, we have a new song
                                // Update song-specific data
                                if (
                                    data.spotify_player_data.item.id !== songID
                                ) {
                                    console.log("New song, clearing data");
                                    // We want to submit automatically on song change
                                    submitNote();

                                    // Update song metadata
                                    setSongID(data.spotify_player_data.item.id);
                                    setScrubbing(false);
                                    setTrackLength(
                                        data.spotify_player_data.item
                                            .duration_ms
                                    );
                                    setAlbumCoverURL(
                                        data.spotify_player_data.item.album
                                            .images[0].url
                                    );
                                    setTotalTracks(
                                        data.spotify_player_data.item.album
                                            .total_tracks
                                    );
                                    setSongTitle(
                                        data.spotify_player_data.item.name
                                    );
                                    setAlbumTitle(
                                        data.spotify_player_data.item.album.name
                                    );
                                    setReleaseDate(
                                        data.spotify_player_data.item.album
                                            .release_date
                                    );
                                    setTracklist(
                                        data.spotify_album_data.tracks.items
                                    );

                                    let tempArtists = [];
                                    data.spotify_player_data.item.artists.map(
                                        (artist) => {
                                            tempArtists.push(artist.name);
                                        }
                                    );
                                    setArtists(tempArtists);

                                    let tempAlbumArtists = [];
                                    data.spotify_album_data.artists.map(
                                        (artist) => {
                                            tempAlbumArtists.push(artist.name);
                                        }
                                    );
                                    setAlbumArtists(tempAlbumArtists);

                                    // Load user data for this song if it exists
                                    if (data.database_data.quickSummary) {
                                        $("#quick-summary-input").val(
                                            data.database_data.quickSummary
                                        );
                                    } else {
                                        $("#quick-summary-input").val("");
                                    }

                                    if (data.database_data.review) {
                                        $("#review-input").val(
                                            data.database_data.review
                                        );
                                    } else {
                                        $("#review-input").val("");
                                    }

                                    if (data.database_data.notes) {
                                        setNotes(data.database_data.notes);
                                    }

                                    // If we're on the first disc, use the track number directly
                                    // In any other case, we have to get the track number ourselves
                                    if (
                                        data.spotify_player_data.item
                                            .disc_number === 1
                                    ) {
                                        setTrackNumber(
                                            data.spotify_player_data.item
                                                .track_number
                                        );
                                    } else {
                                        for (
                                            let i = 0;
                                            i <
                                            data.spotify_album_data.tracks.items
                                                .length;
                                            i++
                                        ) {
                                            if (
                                                data.spotify_player_data.item
                                                    .name ===
                                                data.spotify_album_data.tracks
                                                    .items[i].name
                                            ) {
                                                setTrackNumber(i + 1);
                                                break;
                                            }
                                        }
                                    }
                                }

                                // If this isn't a new song, the only things that can change are:
                                // - Paused status
                                // - Scrubbing status
                                // - Playback progress
                                setPaused(!data.spotify_player_data.is_playing);

                                // The user isn't scrubbing if within 2 seconds of the actual time
                                // (TODO: Gotta be a better way to do this)
                                if (
                                    Math.abs(
                                        data.spotify_player_data.progress_ms -
                                            sliderProgress
                                    ) < 2000
                                ) {
                                    setScrubbing(false);
                                }

                                if (!scrubbing) {
                                    setPlaybackProgress(
                                        data.spotify_player_data.progress_ms
                                    );
                                }

                                // We need to turn playback progress into a string
                                setPlaybackProgressString(
                                    Math.floor(
                                        (scrubbing
                                            ? sliderProgress
                                            : data.spotify_player_data
                                                  .progress_ms) /
                                            1000 /
                                            60
                                    ) +
                                        ":" +
                                        (Math.floor(
                                            ((scrubbing
                                                ? sliderProgress
                                                : data.spotify_player_data
                                                      .progress_ms) /
                                                1000) %
                                                60
                                        ) < 10
                                            ? "0"
                                            : "") +
                                        Math.floor(
                                            ((scrubbing
                                                ? sliderProgress
                                                : data.spotify_player_data
                                                      .progress_ms) /
                                                1000) %
                                                60
                                        )
                                );

                                // We always want to be updating these user datas
                                setAlbumReviews(data.album_reviews);
                                setSongsWithData(data.songs_with_data);
                                setRecentData(data.recent_notes);
                                if (data.song_lyrics_html) {
                                    setLyricHTML(
                                        data.song_lyrics_html.fullLyricHTML
                                    );
                                } else {
                                    setLyricHTML("No lyrics found.");
                                }
                            }
                        } catch (e) {
                            console.log(e);
                        } finally {
                            setProcessingPlayback(false);
                        }
                    }
                });
        }

        const interval = setInterval(() => getPlaybackState(), 1000);

        // Set up actual page events
        $(document).ready(function () {
            // Set size flags when resizing
            const handleResize = () => {
                setIsMobile(window.innerWidth < 768);
                setIsLessThanXL(window.innerWidth < 1200);
            };
            window.addEventListener("resize", handleResize);

            // Show error screen if no song has played yet
            if (songID === "") {
                let errorModalTriggerButton = $("#errorModalTriggerButton");
                errorModalTriggerButton.click();
            } else {
                let errorModalDismissButton = $("#errorModalCloseButton");
                errorModalDismissButton.click();
            }

            // Handle draggable playback bar
            $(".form-range")
                .off("change")
                .on("change", async function (event) {
                    await setUserPlaybackProgress(event.currentTarget.value);
                    setPlaybackProgress(event.currentTarget.value);
                });
            $(".form-range")
                .off("input")
                .on("input", async function (event) {
                    setPlaybackProgressString(
                        Math.floor(sliderProgress / 1000 / 60) +
                            ":" +
                            (Math.floor((sliderProgress / 1000) % 60) < 10
                                ? "0"
                                : "") +
                            Math.floor((sliderProgress / 1000) % 60)
                    );
                    setScrubbing(true);
                    setPlaybackProgress(event.currentTarget.value);
                    setSliderProgress(event.currentTarget.value);
                });

            // Simple hover/focus triggers
            $('[data-bs-toggle="tooltip"]').tooltip({
                trigger: "hover",
            });
            $("#noteInterface")
                .off("shown.bs.modal")
                .on("shown.bs.modal", function () {
                    $("#timestampInput").val(
                        $("#timestampInput").prop("defaultValue")
                    );
                    $("#noteInput").focus();
                });

            // Handle saving notes
            $(".save-note")
                .off("click")
                .click(async function () {
                    let noteData = $(".note-form").serializeArray();
                    setNotes([
                        ...notes,
                        new Note(
                            noteData[0].value,
                            noteData[1].value,
                            noteData[2].value === ""
                                ? "(no note)"
                                : noteData[2].value
                        ),
                    ]);
                    $("#noteInput").val("");
                });

            // Allows users to save markdown-based text version of their review
            // Supports both individual songs and full albums
            $("#song-copy-to-clipboard")
                .off("click")
                .click(async function () {
                    let copyText = "# " + songTitle + "\n";

                    // Check for featured artists
                    artists.map((artist) => {
                        if (!albumArtists.includes(artist)) {
                            if (copyText[copyText.length - 1] === "\n") {
                                copyText = copyText + "## Featuring ";
                            }
                            copyText = copyText.concat(artist + ", ");
                        }
                    });
                    if (copyText[copyText.length - 1] !== "\n") {
                        copyText = copyText.substring(0, copyText.length - 2);
                        copyText = copyText.concat("\n");
                    }

                    // Check for album artists who aren't on this song
                    albumArtists.map((artist) => {
                        if (!artists.includes(artist)) {
                            if (copyText[copyText.length - 1] === "\n") {
                                copyText = copyText + "## Without ";
                            }
                            copyText = copyText.concat(artist + ", ");
                        }
                    });
                    if (copyText[copyText.length - 1] !== "\n") {
                        copyText = copyText.substring(0, copyText.length - 2);
                        copyText = copyText.concat("\n");
                    }
                    copyText = copyText.concat(
                        "## Quick Summary\n" +
                            $("#quick-summary-input").val() +
                            "\n\n" +
                            "## Review\n" +
                            $("#review-input").val() +
                            "\n\n" +
                            "## Notes\n"
                    );
                    if (notes.length > 0) {
                        notes.map((note) => {
                            copyText = copyText.concat(
                                "- " + note.timestamp + ": "
                            );
                            copyText = copyText.concat(note.note + "\n");
                        });
                    } else {
                        copyText = copyText.concat("No notes.");
                    }
                    navigator.clipboard.writeText(copyText);
                });
            $("#album-copy-to-clipboard")
                .off("click")
                .click(async function () {
                    let trackData = "";
                    let copyText = "";
                    copyText = copyText.concat("# " + albumTitle + "\n");
                    copyText = copyText.concat("# ");
                    albumArtists.map(
                        (artist, i) =>
                            (copyText = copyText.concat(
                                i !== albumArtists.length - 1
                                    ? artist + ", "
                                    : artist + "\n"
                            ))
                    );
                    copyText = copyText.concat("# " + releaseDate + "\n\n");
                    copyText = copyText.concat("# Annotated Tracklist \n");
                    tracklist.map((track, i) => {
                        if (songsWithData.includes(track.id)) {
                            trackData =
                                albumReviews[
                                    albumReviews.findIndex(
                                        (obj) => obj.id === track.id
                                    )
                                ];
                            copyText = copyText.concat(
                                "# " + track.name + "\n"
                            );
                            let songArtists = [];
                            tracklist[i].artists.map((artist) => {
                                songArtists.push(artist.name);
                            });

                            // Check for featured artists
                            songArtists.map((artist) => {
                                if (!albumArtists.includes(artist)) {
                                    if (
                                        copyText[copyText.length - 1] === "\n"
                                    ) {
                                        copyText = copyText + "## Featuring ";
                                    }
                                    copyText = copyText.concat(artist + ", ");
                                }
                            });
                            if (copyText[copyText.length - 1] !== "\n") {
                                copyText = copyText.substring(
                                    0,
                                    copyText.length - 2
                                );
                                copyText = copyText.concat("\n");
                            }

                            // Check for album artists who aren't on this song
                            albumArtists.map((artist) => {
                                if (!songArtists.includes(artist)) {
                                    if (
                                        copyText[copyText.length - 1] === "\n"
                                    ) {
                                        copyText = copyText + "## Without ";
                                    }
                                    copyText = copyText.concat(artist + ", ");
                                }
                            });
                            if (copyText[copyText.length - 1] !== "\n") {
                                copyText = copyText.substring(
                                    0,
                                    copyText.length - 2
                                );
                                copyText = copyText.concat("\n");
                            }
                            copyText = copyText.concat(
                                "## Quick Summary\n" +
                                    trackData.quick_summary +
                                    "\n\n" +
                                    "## Review\n" +
                                    trackData.review +
                                    "\n\n" +
                                    "## Notes\n"
                            );
                            if (trackData.notes.length > 0) {
                                trackData.notes.map((note) => {
                                    copyText = copyText.concat(
                                        "- " + note.timestamp + ": "
                                    );
                                    copyText = copyText.concat(
                                        note.note + "\n"
                                    );
                                });
                            } else {
                                copyText = copyText.concat("No notes.");
                            }
                            copyText = copyText.concat("\n");
                        }
                    });
                    navigator.clipboard.writeText(copyText);
                });

            // Submit note
            $("#save-song-data")
                .off("click")
                .click(
                    debounce(async function () {
                        await submitNote();
                    }, 1000)
                );

            // Save note
            $("#noteInput")
                .off("keydown")
                .on("keydown", function (event) {
                    if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        $(".save-note").click();
                    }
                });

            // Lyric show toggle
            $("#showLyrics").change(function () {
                var isChecked = $(this).prop("checked");
                setShowLyrics(isChecked);
            });

            // Allow for editing of notes
            notes.map((note, i) => {
                let buttonID = "#edit-note" + i;
                let formID = "#note-form" + i;
                let textareaID = "#noteInput" + i;
                $(textareaID).on("keydown", function (event) {
                    if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        $(buttonID).click();
                    }
                });
                $("#editNoteInterface" + i)
                    .off("shown.bs.modal")
                    .on("shown.bs.modal", function () {
                        $("#noteInput" + i).focus();
                    });
                $(buttonID)
                    .off("click")
                    .click(async function () {
                        let noteData = $(formID).serializeArray();
                        let editedNote = new Note(
                            noteData[0].value,
                            noteData[1].value,
                            noteData[2].value === ""
                                ? "(no note)"
                                : noteData[2].value
                        );
                        console.log(notes);
                        let tempNotesArray = notes;
                        tempNotesArray.splice(i, 0, editedNote);
                        tempNotesArray.splice(i + 1, 1);
                        setNotes(tempNotesArray);
                    });
            });
        });

        // Handle note submission
        function submitNote() {
            return new Promise((resolve, reject) => {
                const requestOptions = {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id: songID,
                        quickSummary: $("#quick-summary-input").val(),
                        review: $("#review-input").val(),
                        notes: notes,
                        access_token: localStorage.getItem("access_token"),
                    }),
                };
                let noteEmpty =
                    (!$("#quick-summary-input").val() &&
                        !$("#review-input").val() &&
                        notes.length === 0) ||
                    !songID;
                if (!noteEmpty) {
                    try {
                        const response = fetch(apiUrl + "/api", requestOptions);
                        resolve(response);
                    } catch (error) {
                        console.error("Error submitting note:", error);
                        reject(error);
                    }
                } else {
                    resolve("Empty note");
                }
            });
        }

        return () => {
            clearInterval(interval);
        };
    }, [
        songID,
        scrubbing,
        artists,
        albumArtists,
        notes,
        sliderProgress,
        processingPlayback,
        showLyrics,
        loggedOut,
    ]);

    class Note {
        constructor(timestamp, length, note) {
            this.timestamp = timestamp;
            this.length = length;
            this.note = note;
        }
    }

    const debounce = (func, wait) => {
        let timeout;

        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };

            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    // Handle playback progress mutation
    function setUserPlaybackProgress(timestamp) {
        return new Promise((resolve, reject) => {
            const queryParams = new URLSearchParams({
                access_token: localStorage.getItem("access_token"),
            });
            const requestOptions = {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ timeInMS: timestamp }),
            };
            console.log("Making request for " + timestamp);
            try {
                const response = fetch(
                    apiUrl + "/api?" + queryParams,
                    requestOptions
                );
                console.log("Got request for " + timestamp);
                setScrubbing(false);
                resolve(response);
            } catch (error) {
                console.error("Error setting user playback progress:", error);
                reject(error);
            }
        });
    }

    // Handle playback control mutation (playing/pausing)
    function controlPlayback() {
        return new Promise((resolve, reject) => {
            const queryParams = new URLSearchParams({
                access_token: localStorage.getItem("access_token"),
            });
            const requestOptions = {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paused: paused }),
            };
            try {
                const response = fetch(
                    apiUrl + "/playback-control?" + queryParams,
                    requestOptions
                );
                resolve(response);
            } catch (error) {
                console.error("Error controlling playback:", error);
                reject(error);
            }
        });
    }

    function sendLogoutRequest() {
        const queryParams = new URLSearchParams({
            access_token: localStorage.getItem("access_token"),
        });
        const requestOptions = {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        };
        const apiUrlLogout = apiUrl + "/logout?" + queryParams;
        fetch(apiUrlLogout, requestOptions);
    }

    function setNoteTimeStamp() {
        setTempTimeStamp(playbackProgressString);
    }

    function timestampToMilliseconds(timestamp) {
        const minutes = timestamp.split(":")[0];
        const seconds = timestamp.split(":")[1];
        return minutes * 1000 * 60 + seconds * 1000;
    }

    return (
        <>
            <Header />
            <div className="container">
                <NavBar />
                <div className="tab-content" id="myTabContent">
                    <div
                        className="tab-pane fade show active"
                        id="song-tab-pane"
                        role="tabpanel"
                        aria-labelledby="song-tab"
                        tabIndex="0"
                    >
                        <div className="form-check mt-4 mb-1">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="showLyrics"
                                defaultChecked={false}
                            ></input>
                            <label
                                className="form-check-label"
                                htmlFor="showLyrics"
                            >
                                Show Lyrics? [Experimental]
                            </label>
                        </div>
                        <div className="row">
                            <div className={showLyrics ? "col-6" : "col-12"}>
                                <div className="row">
                                    <div className="col-md-3 col-4 word-wrap">
                                        <AlbumSidebar
                                            albumCoverURL={albumCoverURL}
                                            trackNumber={trackNumber}
                                            totalTracks={totalTracks}
                                            songTitle={songTitle}
                                            albumTitle={albumTitle}
                                            artists={artists}
                                            releaseDate={releaseDate}
                                        />

                                        {!isMobile && !showLyrics && (
                                            <>
                                                {notes.map((note, i) => (
                                                    <SidebarNote
                                                        note={note}
                                                        notes={notes}
                                                        key={i}
                                                        index={i}
                                                        onClick={() =>
                                                            setUserPlaybackProgress(
                                                                timestampToMilliseconds(
                                                                    note.timestamp
                                                                )
                                                            )
                                                        }
                                                    />
                                                ))}
                                                <div className="d-flex justify-content-center mt-3">
                                                    <button
                                                        className="btn btn-primary"
                                                        id="song-copy-to-clipboard"
                                                    >
                                                        Save scribe to clipboard
                                                    </button>
                                                </div>
                                                <h1 className="mt-5 mb-3 small-text">
                                                    Recently added tracks
                                                </h1>
                                                {(!recentData ||
                                                    recentData.length ===
                                                        0) && (
                                                    <p>
                                                        No recent data. Happy
                                                        Scribing!
                                                    </p>
                                                )}
                                                {recentData &&
                                                    recentData.length > 0 &&
                                                    recentData.map(
                                                        (song, i) => (
                                                            <RecentNote
                                                                key={i}
                                                                albumCoverURL={
                                                                    song.album
                                                                        .images[0]
                                                                        .url
                                                                }
                                                                songTitle={
                                                                    song.name
                                                                }
                                                                artist={
                                                                    song
                                                                        .artists[0]
                                                                        .name
                                                                }
                                                            />
                                                        )
                                                    )}
                                            </>
                                        )}
                                    </div>
                                    <div className="col-md-9 col-8 px-md-5 px-sm-3">
                                        <NoteArea
                                            notes={notes}
                                            trackLength={trackLength}
                                            leftSpace={
                                                (playbackProgress /
                                                    trackLength) *
                                                ($(".form-range").width() -
                                                    8 -
                                                    8)
                                            }
                                            noteOnClick={(timestamp) =>
                                                setUserPlaybackProgress(
                                                    timestampToMilliseconds(
                                                        timestamp
                                                    )
                                                )
                                            }
                                            addNoteTimestamp={setNoteTimeStamp}
                                        />
                                        <div className="row">
                                            <PlaybackBar
                                                playbackProgress={
                                                    playbackProgress
                                                }
                                                trackLength={trackLength}
                                                playbackProgressString={
                                                    playbackProgressString
                                                }
                                                backFiveOnClick={() => {
                                                    let newProgress = Math.max(
                                                        0,
                                                        playbackProgress - 5000
                                                    );
                                                    setScrubbing(true);
                                                    setUserPlaybackProgress(
                                                        newProgress
                                                    );
                                                    setPlaybackProgress(
                                                        newProgress
                                                    );
                                                    setPlaybackProgressString(
                                                        Math.floor(
                                                            newProgress /
                                                                1000 /
                                                                60
                                                        ) +
                                                            ":" +
                                                            (Math.floor(
                                                                (newProgress /
                                                                    1000) %
                                                                    60
                                                            ) < 10
                                                                ? "0"
                                                                : "") +
                                                            Math.floor(
                                                                (newProgress /
                                                                    1000) %
                                                                    60
                                                            )
                                                    );
                                                }}
                                            />
                                            <SongNoteArea />
                                        </div>
                                    </div>
                                    {(isMobile || showLyrics) && (
                                        <div className="row">
                                            <div className="col-12 word-wrap">
                                                {notes.map((note, i) => (
                                                    <SidebarNote
                                                        note={note}
                                                        notes={notes}
                                                        key={i}
                                                        index={i}
                                                        onClick={() =>
                                                            setUserPlaybackProgress(
                                                                timestampToMilliseconds(
                                                                    note.timestamp
                                                                )
                                                            )
                                                        }
                                                    />
                                                ))}
                                                <div className="d-flex justify-content-center mt-5">
                                                    <button
                                                        className="btn btn-primary"
                                                        id="song-copy-to-clipboard"
                                                    >
                                                        Save scribe to clipboard
                                                    </button>
                                                </div>
                                                <h1 className="mt-5 mb-3 small-text">
                                                    Recently added tracks
                                                </h1>
                                                {(!recentData ||
                                                    recentData.length ===
                                                        0) && (
                                                    <p>
                                                        No recent data. Happy
                                                        Scribing!
                                                    </p>
                                                )}
                                                {recentData &&
                                                    recentData.length >= 0 &&
                                                    recentData.map(
                                                        (song, i) => (
                                                            <RecentNote
                                                                key={i}
                                                                albumCoverURL={
                                                                    song.album
                                                                        .images[0]
                                                                        .url
                                                                }
                                                                songTitle={
                                                                    song.name
                                                                }
                                                                artist={
                                                                    song
                                                                        .artists[0]
                                                                        .name
                                                                }
                                                            />
                                                        )
                                                    )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {showLyrics && (
                                <div className="col-6 mt-5">
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: "<p>" + lyricHTML + "</p>",
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    <AlbumTab
                        albumCoverURL={albumCoverURL}
                        albumTitle={albumTitle}
                        artists={albumArtists}
                        releaseDate={releaseDate}
                        tracklist={tracklist}
                        songsWithData={songsWithData}
                        albumReviews={albumReviews}
                        isLessThanXL={isLessThanXL}
                    />
                    <DisconnectTab
                        onClick={() => {
                            sendLogoutRequest();

                            localStorage.setItem("access_token", "null");
                            localStorage.setItem("refresh_token", "null");
                            localStorage.setItem("genius_access_token", "null");
                            setLoggedOut(true);
                            let loggedOutModalTriggerButton = $(
                                "#loggedOutModalTriggerButton"
                            );
                            loggedOutModalTriggerButton.click();
                        }}
                    />
                </div>
            </div>
            <div className="mt-5 mb-5"></div>
            <Footer />
            <NoteModal tempTimeStamp={tempTimeStamp} />
            {notes.map((note, i) => (
                <EditNoteModal
                    key={i}
                    index={i}
                    timestamp={note.timestamp}
                    length={note.length}
                    note={note.note}
                />
            ))}
            <PlaybackControl
                paused={paused}
                onClick={() => controlPlayback()}
            />
            <ErrorModal />
            <LoggedOutModal />
        </>
    );
}

export default App;

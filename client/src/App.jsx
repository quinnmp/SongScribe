import { useEffect, useState, useRef } from "react";
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

function App() {
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
    const [uploadingNote, setUploadingNote] = useState(false);
    const [tracklist, setTracklist] = useState([]);
    const [albumReviews, setAlbumReviews] = useState([]);
    const [albumArtists, setAlbumArtists] = useState([]);
    const [songsWithData, setSongsWithData] = useState([]);
    const [recentData, setRecentData] = useState([]);
    const [shouldSubmit, setShouldSubmit] = useState(false);
    const [paused, setPaused] = useState(false);
    const [sliderProgress, setSliderProgress] = useState(-1);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isLessThanXL, setIsLessThanXL] = useState(window.innerWidth < 1200);
    const [notesUpdated, setNotesUpdated] = useState(false);
    const [lyricHTML, setLyricHTML] = useState(``);
    const [showLyrics, setShowLyrics] = useState(true);
    const songIDRef = useRef(songID);
    const apiUrl =
        process.env.NODE_ENV !== "production"
            ? "http://localhost:5000"
            : "https://songscribe-api.onrender.com";
    const mainUrl =
        process.env.NODE_ENV !== "production"
            ? "http://127.0.0.1:5173"
            : "https://songscribe.onrender.com";

    useEffect(() => {
        let urlCode = window.location.href.split("?code=");
        if (urlCode.length > 1) {
            urlCode[1] = urlCode[1].slice(0, 64);
            const queryParams = new URLSearchParams({ code: urlCode[1] });
            const requestOptions = {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            };
            fetch(apiUrl + "/genius_callback?" + queryParams, requestOptions);
            window.location = mainUrl;
        }
        function getPlaybackState() {
            console.log("Get playback state");
            const requestOptions = {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            };
            const apiUrlMain = apiUrl + "/api";
            fetch(apiUrlMain, requestOptions)
                .then((response) => {
                    return response.json();
                })
                .then(async (data) => {
                    if (data.uri) {
                        window.location.replace(data.uri);
                    } else {
                        try {
                            if (data.spotify_player_data.progress_ms) {
                                if (
                                    data.spotify_player_data.item.id != songID
                                ) {
                                    console.log("New song, clearing data");
                                    await submitNote();
                                    setSongID(data.spotify_player_data.item.id);
                                    let tempID =
                                        data.spotify_player_data.item.id;
                                    handleShouldSubmit(tempID);
                                    setScrubbing(false);
                                    setNotesUpdated(false);
                                    setNotes([]);
                                    setArtists([]);
                                    setAlbumArtists([]);
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
                                if (
                                    notes.length === 0 &&
                                    data.database_data.notes.length !== 0 &&
                                    !notesUpdated
                                ) {
                                    await setNotes(data.database_data.notes);
                                    setNotesUpdated(true);
                                }
                                setPaused(!data.spotify_player_data.is_playing);
                                setRecentData(data.recent_notes);
                                if (
                                    Math.abs(
                                        data.spotify_player_data.progress_ms -
                                            sliderProgress
                                    ) < 2000
                                ) {
                                    setScrubbing(false);
                                }
                                if (
                                    !scrubbing &&
                                    data.spotify_player_data.progress_ms
                                ) {
                                    setPlaybackProgress(
                                        data.spotify_player_data.progress_ms
                                    );
                                }
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
                                setTrackLength(
                                    data.spotify_player_data.item.duration_ms
                                );
                                setAlbumCoverURL(
                                    data.spotify_player_data.item.album
                                        .images[0].url
                                );
                                console.log(
                                    data.song_lyrics_html.fullLyricHTML
                                );
                                setLyricHTML(
                                    data.song_lyrics_html.fullLyricHTML
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

                                if (artists.length === 0) {
                                    let tempArtists = [];
                                    data.spotify_player_data.item.artists.map(
                                        (artist) => {
                                            tempArtists.push(artist.name);
                                        }
                                    );
                                    setArtists(tempArtists);
                                }

                                if (albumArtists.length === 0) {
                                    let tempAlbumArtists = [];
                                    data.spotify_album_data.artists.map(
                                        (artist) => {
                                            tempAlbumArtists.push(artist.name);
                                        }
                                    );
                                    setAlbumArtists(tempAlbumArtists);
                                }

                                setReleaseDate(
                                    data.spotify_player_data.item.album
                                        .release_date
                                );
                                setTracklist(
                                    data.spotify_album_data.tracks.items
                                );
                                setAlbumReviews(data.album_reviews);
                                setSongsWithData(data.songs_with_data);
                            }
                        } catch (e) {
                            console.log(e);
                        }
                    }
                });
        }
        const interval = setInterval(() => getPlaybackState(), 1000);

        $(document).ready(function () {
            const handleResize = () => {
                setIsMobile(window.innerWidth < 768);
                setIsLessThanXL(window.innerWidth < 1200);
            };
            window.addEventListener("resize", handleResize);

            if (songID === "") {
                let errorModalTriggerButton = $("#errorModalTriggerButton");
                errorModalTriggerButton.click();
            } else {
                let errorModalDismissButton = $("#errorModalCloseButton");
                errorModalDismissButton.click();
            }
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
            $("#save-song-data")
                .off("click")
                .click(
                    debounce(async function () {
                        await submitNote();
                    }, 1000)
                );
            $("#noteInput")
                .off("keydown")
                .on("keydown", function (event) {
                    if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        $(".save-note").click();
                    }
                });
            $("#showLyrics").change(function () {
                var isChecked = $(this).prop("checked");
                setShowLyrics(isChecked);
            });
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

        async function submitNote() {
            console.log("In submitNote. shouldSubmit is " + shouldSubmit);
            if (!uploadingNote) {
                if (shouldSubmit === true) {
                    setUploadingNote(true);
                    setShouldSubmit(false);
                    handleShouldSubmit(songID);
                    const requestOptions = {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            id: songID,
                            quickSummary: $("#quick-summary-input").val(),
                            review: $("#review-input").val(),
                            notes: notes,
                        }),
                    };
                    await fetch(apiUrl + "/api", requestOptions)
                        .then((response) => {
                            setUploadingNote(false);
                            return response.json();
                        })
                        .then((data) => console.log(data));
                } else {
                    console.log("Submit sent too soon. Did not submit.");
                }
            } else {
                console.log("Note currently being uploaded, rejected");
            }
        }

        return () => {
            clearInterval(interval);
        };
    }, [
        songID,
        scrubbing,
        artists,
        albumArtists,
        shouldSubmit,
        notes,
        sliderProgress,
        notesUpdated,
    ]);

    class Note {
        constructor(timestamp, length, note) {
            this.timestamp = timestamp;
            this.length = length;
            this.note = note;
        }
    }

    async function handleShouldSubmit(tempID) {
        setTimeout(() => {
            if (tempID === songIDRef.current) {
                setShouldSubmit(true);
            }
        }, 2000);
    }

    useEffect(() => {
        songIDRef.current = songID;
    }, [songID]);

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

    async function setUserPlaybackProgress(timestamp) {
        const requestOptions = {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ timeInMS: timestamp }),
        };
        console.log("Making request for " + timestamp);
        await fetch(apiUrl + "/api", requestOptions)
            .then((response) => {
                console.log("Got request for " + timestamp);
                setScrubbing(false);
                return response.json();
            })
            .then((data) => data);
    }

    async function controlPlayback() {
        const requestOptions = {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paused: paused }),
        };
        await fetch(apiUrl + "/playback-control", requestOptions)
            .then((response) => {
                return response.json();
            })
            .then((data) => data);
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
                                defaultChecked="true"
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
                                                <h1 className="mt-5 mb-3 small-text">
                                                    Recently added tracks
                                                </h1>
                                                {recentData.length === 0 && (
                                                    <p>
                                                        No recent data. Happy
                                                        Scribing!
                                                    </p>
                                                )}
                                                {recentData.map((song, i) => (
                                                    <RecentNote
                                                        key={i}
                                                        albumCoverURL={
                                                            song.album.images[0]
                                                                .url
                                                        }
                                                        songTitle={song.name}
                                                        artist={
                                                            song.artists[0].name
                                                        }
                                                    />
                                                ))}
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
                                                <h1 className="mt-5 mb-3 small-text">
                                                    Recently added tracks
                                                </h1>
                                                {recentData.map((song, i) => (
                                                    <RecentNote
                                                        key={i}
                                                        albumCoverURL={
                                                            song.album.images[0]
                                                                .url
                                                        }
                                                        songTitle={song.name}
                                                        artist={
                                                            song.artists[0].name
                                                        }
                                                    />
                                                ))}
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
            <ErrorModal></ErrorModal>
        </>
    );
}

export default App;

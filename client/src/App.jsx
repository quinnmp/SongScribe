import { useEffect, useState } from "react";
import AlbumSidebar from "./components/AlbumSidebar.jsx";
import NoteModal from "./components/NoteModal.jsx";
import EditNoteModal from "./components/EditNoteModal.jsx";
import SidebarNote from "./components/SidebarNote.jsx";
import NavBar from "./components/NavBar.jsx";
import NoteArea from "./components/NoteArea.jsx";
import PlaybackBar from "./components/PlaybackBar.jsx";

function App() {
    const [songID, setSongID] = useState("");
    const [playbackProgress, setPlaybackProgress] = useState(-1);
    const [playbackProgressString, setPlaybackProgressString] = useState("");
    const [tempTimeStamp, setTempTimeStamp] = useState("");
    const [trackLength, setTrackLength] = useState(-1);
    const [playbackPercent, setPlaybackPercent] = useState("");
    const [albumCoverURL, setAlbumCoverURL] = useState("");
    const [totalTracks, setTotalTracks] = useState(-1);
    const [trackNumber, setTrackNumber] = useState(-1);
    const [songTitle, setSongTitle] = useState("");
    const [albumTitle, setAlbumTitle] = useState("");
    const [artist, setArtist] = useState("");
    const [releaseDate, setReleaseDate] = useState("");
    const [notes, setNotes] = useState([]);
    const [scrubbing, setScrubbing] = useState(false);
    const [uploadingNote, setUploadingNote] = useState(false);
    const [tracklist, setTracklist] = useState([]);
    const [albumReviews, setAlbumReviews] = useState([]);
    const [songsWithData, setSongsWithData] = useState([]);

    useEffect(() => {
        let sliderProgress = 0;
        function getPlaybackState() {
            const requestOptions = {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            };
            fetch("http://localhost:5000/api", requestOptions)
                .then((response) => {
                    return response.json();
                })
                .then((data) => {
                    if (data.spotify_player_data.item.id != songID) {
                        setNotes([]);
                        $("#quick-summary-input").val("");
                        $("#review-input").val("");
                    }
                    setSongID(data.spotify_player_data.item.id);
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
                    setPlaybackProgressString(
                        Math.floor(
                            (scrubbing
                                ? sliderProgress
                                : data.spotify_player_data.progress_ms) /
                                1000 /
                                60
                        ) +
                            ":" +
                            (Math.floor(
                                ((scrubbing
                                    ? sliderProgress
                                    : data.spotify_player_data.progress_ms) /
                                    1000) %
                                    60
                            ) < 10
                                ? "0"
                                : "") +
                            Math.floor(
                                ((scrubbing
                                    ? sliderProgress
                                    : data.spotify_player_data.progress_ms) /
                                    1000) %
                                    60
                            )
                    );
                    setTrackLength(data.spotify_player_data.item.duration_ms);
                    setPlaybackPercent(
                        ((scrubbing
                            ? sliderProgress
                            : data.spotify_player_data.progress_ms) /
                            data.spotify_player_data.item.duration_ms) *
                            95 +
                            "%"
                    );
                    setAlbumCoverURL(
                        data.spotify_player_data.item.album.images[0].url
                    );
                    setTotalTracks(
                        data.spotify_player_data.item.album.total_tracks
                    );
                    setTrackNumber(data.spotify_player_data.item.track_number);
                    setSongTitle(data.spotify_player_data.item.name);
                    setAlbumTitle(data.spotify_player_data.item.album.name);
                    setArtist(data.spotify_player_data.item.artists[0].name);
                    setReleaseDate(
                        data.spotify_player_data.item.album.release_date
                    );
                    setTracklist(data.spotify_album_data.tracks.items);
                    setAlbumReviews(data.album_reviews);
                    setSongsWithData(data.songs_with_data);
                    if ($("#quick-summary-input").val() === "") {
                        $("#quick-summary-input").val(
                            data.database_data.quickSummary
                        );
                    }
                    if ($("#review-input").val() === "") {
                        $("#review-input").val(data.database_data.review);
                    }
                    if (notes.length === 0) {
                        data.database_data.notes.map((note) =>
                            setNotes([...notes, note])
                        );
                    }
                });
        }
        getPlaybackState();
        const interval = setInterval(() => getPlaybackState(), 1000);

        class Note {
            constructor(timestamp, length, note) {
                this.timestamp = timestamp;
                this.length = length;
                this.note = note;
            }
        }

        $(document).ready(function () {
            $(".form-range")
                .off("change")
                .on("change", async function (event) {
                    await setUserPlaybackProgress(event.currentTarget.value);
                    await setPlaybackProgress(event.currentTarget.value);
                });
            $(".form-range")
                .off("input")
                .on("input", async function (event) {
                    await setScrubbing(true);
                    setPlaybackProgress(event.currentTarget.value);
                    sliderProgress = event.currentTarget.value;
                });
            $('[data-bs-toggle="tooltip"]').tooltip({
                trigger: "hover",
            });
            $("#noteInterface")
                .off("shown.bs.modal")
                .on("shown.bs.modal", function () {
                    $("#noteInput").focus();
                });
            $(".save-note")
                .off("click")
                .click(async function () {
                    let noteData = $(".note-form").serializeArray();
                    await setNotes([
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
                        if (!uploadingNote) {
                            setUploadingNote(true);
                            await submitNote();
                            setUploadingNote(false);
                        }
                    }, 1000)
                );
            $("#noteInput")
                .off("keydown")
                .on("keydown", function (event) {
                    if (event.key === "Enter") {
                        $(".save-note").click();
                    }
                });
            notes.map((note, i) => {
                let buttonID = "#edit-note" + i;
                let formID = "#note-form" + i;
                let textareaID = "#noteInput" + i;
                $(textareaID).on("keydown", function (event) {
                    if (event.key === "Enter") {
                        $(buttonID).click();
                    }
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
                        await setNotes(notes.splice(i, 0, editedNote));
                        await setNotes(notes.splice(i, 1));
                    });
            });
        });
        return () => {
            clearInterval(interval);
        };
    }, [notes, scrubbing, uploadingNote]);

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
        await fetch("http://localhost:5000/api", requestOptions)
            .then((response) => {
                return response.json();
            })
            .then((data) => console.log(data));
    }

    async function submitNote() {
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
        await fetch("http://localhost:5000/api", requestOptions)
            .then((response) => {
                return response.json();
            })
            .then((data) => console.log(data));
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
            <div className="container">
                <NavBar />
                <div className="tab-content" id="myTabContent">
                    <div
                        className="tab-pane fade show active"
                        id="home-tab-pane"
                        role="tabpanel"
                        aria-labelledby="home-tab"
                        tabIndex="0"
                    >
                        <div className="row mt-5">
                            <div className="col-3 word-wrap">
                                <AlbumSidebar
                                    albumCoverURL={albumCoverURL}
                                    trackNumber={trackNumber}
                                    totalTracks={totalTracks}
                                    songTitle={songTitle}
                                    albumTitle={albumTitle}
                                    artist={artist}
                                    releaseDate={releaseDate}
                                />
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
                            </div>
                            <div className="col-9 px-md-5 px-sm-3">
                                <NoteArea
                                    notes={notes}
                                    trackLength={trackLength}
                                    leftSpace={
                                        (playbackProgress / trackLength) *
                                        ($(".form-range").width() - 8 - 8)
                                    }
                                    noteOnClick={(timestamp) =>
                                        setUserPlaybackProgress(
                                            timestampToMilliseconds(timestamp)
                                        )
                                    }
                                    addNoteTimestamp={setNoteTimeStamp}
                                />
                                <div className="row">
                                    <PlaybackBar
                                        playbackProgress={playbackProgress}
                                        trackLength={trackLength}
                                        playbackProgressString={
                                            playbackProgressString
                                        }
                                    />
                                    <div className="py-5 px-md-5 px-sm-1">
                                        <label
                                            htmlFor="quick-summary-input"
                                            className="form-label mt-md-3 mt-0"
                                        >
                                            <h2 className="text-start">
                                                Quick summary
                                            </h2>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="quick-summary-input"
                                            name="quick-summary"
                                        ></input>
                                        <label
                                            htmlFor="review-input"
                                            className="form-label mt-md-5 mt-2"
                                        >
                                            <h2>Review</h2>
                                        </label>
                                        <textarea
                                            className="form-control"
                                            id="review-input"
                                            rows="10"
                                            name="review"
                                        ></textarea>
                                        <button
                                            type="button"
                                            className="btn btn-primary mt-3"
                                            id="save-song-data"
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div
                        className="tab-pane fade"
                        id="profile-tab-pane"
                        role="tabpanel"
                        aria-labelledby="profile-tab"
                        tabIndex="0"
                    >
                        <img
                            className="img-fluid rounded mx-auto mt-5 mb-3 d-block"
                            src={albumCoverURL}
                            alt="album cover"
                            id="album-page-cover"
                        />
                        <h1>{albumTitle}</h1>
                        <h1>{artist}</h1>
                        <h1 className="mb-4">{releaseDate}</h1>
                        {tracklist.map((track, i) => (
                            <>
                                <hr className="mx-3" />
                                <div className="row">
                                    <div className="col-1">
                                        <h2 key={i}>{i + 1}.</h2>
                                    </div>
                                    <div className="vr"></div>
                                    <div className="col-5">
                                        <h2 key={i}>{track.name}</h2>
                                    </div>
                                    <div className="vr"></div>
                                    <div className="col-5">
                                        {songsWithData.includes(track.id) && (
                                            <h2 key={i}>
                                                {
                                                    albumReviews[
                                                        songsWithData.findIndex(
                                                            (item) =>
                                                                item == track.id
                                                        )
                                                    ].quick_summary
                                                }
                                            </h2>
                                        )}
                                    </div>
                                    <div className="vr"></div>
                                    <div className="col-1">
                                        {songsWithData.includes(track.id) && (
                                            <>
                                                <h2
                                                    key={i}
                                                    className="d-inline-block"
                                                >
                                                    {
                                                        albumReviews[
                                                            songsWithData.findIndex(
                                                                (item) =>
                                                                    item ==
                                                                    track.id
                                                            )
                                                        ].review_count
                                                    }
                                                </h2>

                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="25"
                                                    height="25"
                                                    fill="#d8e9a8"
                                                    className="bi bi-chat-right-text mb-3 ms-2"
                                                    viewBox="0 0 16 16"
                                                >
                                                    <path d="M2 1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h9.586a2 2 0 0 1 1.414.586l2 2V2a1 1 0 0 0-1-1H2zm12-1a2 2 0 0 1 2 2v12.793a.5.5 0 0 1-.854.353l-2.853-2.853a1 1 0 0 0-.707-.293H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h12z" />
                                                    <path d="M3 3.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zM3 6a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 6zm0 2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z" />
                                                </svg>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </>
                        ))}
                        <hr className="mx-3 mb-5" />
                    </div>
                </div>
            </div>
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
        </>
    );
}

export default App;

import { useEffect, useState } from "react";
import AlbumSidebar from "./components/AlbumSidebar.jsx";
import NoteModal from "./components/NoteModal.jsx";
import EditNoteModal from "./components/EditNoteModal.jsx";
import SidebarNote from "./components/SidebarNote.jsx";

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
                    if (data.spotify_data.item.id != songID) {
                        setNotes([]);
                        $("#quick-summary-input").val("");
                        $("#review-input").val("");
                    }
                    setSongID(data.spotify_data.item.id);
                    if (
                        Math.abs(
                            data.spotify_data.progress_ms - sliderProgress
                        ) < 2000
                    ) {
                        setScrubbing(false);
                    }
                    if (!scrubbing) {
                        setPlaybackProgress(data.spotify_data.progress_ms);
                    }
                    setPlaybackProgressString(
                        Math.floor(
                            (scrubbing
                                ? sliderProgress
                                : data.spotify_data.progress_ms) /
                                1000 /
                                60
                        ) +
                            ":" +
                            (Math.floor(
                                ((scrubbing
                                    ? sliderProgress
                                    : data.spotify_data.progress_ms) /
                                    1000) %
                                    60
                            ) < 10
                                ? "0"
                                : "") +
                            Math.floor(
                                ((scrubbing
                                    ? sliderProgress
                                    : data.spotify_data.progress_ms) /
                                    1000) %
                                    60
                            )
                    );
                    setTrackLength(data.spotify_data.item.duration_ms);
                    setPlaybackPercent(
                        ((scrubbing
                            ? sliderProgress
                            : data.spotify_data.progress_ms) /
                            data.spotify_data.item.duration_ms) *
                            95 +
                            "%"
                    );
                    setAlbumCoverURL(
                        data.spotify_data.item.album.images[0].url
                    );
                    setTotalTracks(data.spotify_data.item.album.total_tracks);
                    setTrackNumber(data.spotify_data.item.track_number);
                    setSongTitle(data.spotify_data.item.name);
                    setAlbumTitle(data.spotify_data.item.album.name);
                    setArtist(data.spotify_data.item.artists[0].name);
                    setReleaseDate(data.spotify_data.item.album.release_date);
                    if ($("#quick-summary-input").val() === "") {
                        $("#quick-summary-input").val(
                            data.database_data.quickSummary
                        );
                    }
                    if ($("#review-input").val() === "") {
                        $("#review-input").val(data.database_data.review);
                    }
                    if (notes.length === 0) {
                        console.log("empty notes");
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

    function timestampToPlaybackPercent(timestamp) {
        return (timestampToMilliseconds(timestamp) / trackLength) * 95 + "%";
    }

    function timestampToMilliseconds(timestamp) {
        const minutes = timestamp.split(":")[0];
        const seconds = timestamp.split(":")[1];
        return minutes * 1000 * 60 + seconds * 1000;
    }

    return (
        <>
            <div className="container">
                <div className="row mt-5">
                    <div className="col-3">
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
                                        timestampToMilliseconds(note.timestamp)
                                    )
                                }
                            />
                        ))}
                    </div>
                    <div className="col-9">
                        <div className="row" id="add-note-spacer">
                            <div className="col-1"></div>
                            <div
                                className="col-10 align-self-center"
                                style={{ position: "relative" }}
                            >
                                {notes.map((note) => (
                                    <>
                                        <br />
                                        <button
                                            type="button"
                                            className="btn add-note-button"
                                            data-bs-toggle="tooltip"
                                            data-bs-title={note.note}
                                            data-bs-custom-class="custom-tooltip"
                                            style={{
                                                left: timestampToPlaybackPercent(
                                                    note.timestamp
                                                ),
                                                top: "5%",
                                                position: "absolute",
                                            }}
                                            onClick={() =>
                                                setUserPlaybackProgress(
                                                    timestampToMilliseconds(
                                                        note.timestamp
                                                    )
                                                )
                                            }
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="32"
                                                height="32"
                                                fill="currentColor"
                                                className="bi bi-vector-pen"
                                                viewBox="0 0 16 16"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M10.646.646a.5.5 0 0 1 .708 0l4 4a.5.5 0 0 1 0 .708l-1.902 1.902-.829 3.313a1.5 1.5 0 0 1-1.024 1.073L1.254 14.746 4.358 4.4A1.5 1.5 0 0 1 5.43 3.377l3.313-.828L10.646.646zm-1.8 2.908-3.173.793a.5.5 0 0 0-.358.342l-2.57 8.565 8.567-2.57a.5.5 0 0 0 .34-.357l.794-3.174-3.6-3.6z"
                                                />
                                                <path
                                                    fillRule="evenodd"
                                                    d="M2.832 13.228 8 9a1 1 0 1 0-1-1l-4.228 5.168-.026.086.086-.026z"
                                                />
                                            </svg>
                                        </button>
                                    </>
                                ))}
                                <br />
                                <button
                                    type="button"
                                    className="btn add-note-button"
                                    style={{
                                        left: playbackPercent,
                                        top: "5%",
                                        position: "absolute",
                                    }}
                                    data-bs-toggle="modal"
                                    data-bs-target="#noteInterface"
                                    onClick={setNoteTimeStamp}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="32"
                                        height="32"
                                        fill="currentColor"
                                        className="bi bi-plus"
                                        viewBox="0 0 16 16"
                                    >
                                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                                    </svg>
                                </button>
                            </div>
                            <div className="col-1"></div>
                        </div>
                        <div className="row">
                            <div className="col-1">
                                <h3>0:00</h3>
                            </div>
                            <div
                                className="col-10"
                                style={{ position: "relative" }}
                            >
                                <h3
                                    style={{
                                        left: playbackPercent,
                                        top: "60%",
                                        position: "absolute",
                                    }}
                                >
                                    {playbackProgressString}
                                </h3>
                                <input
                                    type="range"
                                    className="form-range"
                                    min="0"
                                    max={trackLength}
                                    value={playbackProgress}
                                ></input>
                            </div>
                            <div className="col-1 text-end">
                                <h3>
                                    {Math.floor(trackLength / 1000 / 60)}:
                                    {Math.floor((trackLength / 1000) % 60) < 10
                                        ? "0"
                                        : ""}
                                    {Math.floor((trackLength / 1000) % 60)}
                                </h3>
                            </div>
                            <div className="p-5">
                                <label
                                    htmlFor="quick-summary-input"
                                    className="form-label mt-5"
                                >
                                    <h2>Quick summary</h2>
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="quick-summary-input"
                                    name="quick-summary"
                                ></input>
                                <label
                                    htmlFor="review-input"
                                    className="form-label mt-5"
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

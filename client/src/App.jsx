import { useEffect, useState } from "react";
import AlbumSidebar from "./components/AlbumSidebar.jsx";
import NoteModal from "./components/NoteModal.jsx";
import EditNoteModal from "./components/EditNoteModal.jsx";

function App() {
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

    useEffect(() => {
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
                    setPlaybackProgress(data.progress_ms);
                    setPlaybackProgressString(
                        Math.floor(data.progress_ms / 1000 / 60) +
                            ":" +
                            (Math.floor((data.progress_ms / 1000) % 60) < 10
                                ? "0"
                                : "") +
                            Math.floor((data.progress_ms / 1000) % 60)
                    );
                    setTrackLength(data.item.duration_ms);
                    setPlaybackPercent(
                        (data.progress_ms / data.item.duration_ms) * 95 + "%"
                    );
                    setAlbumCoverURL(data.item.album.images[0].url);
                    setTotalTracks(data.item.album.total_tracks);
                    setTrackNumber(data.item.track_number);
                    setSongTitle(data.item.name);
                    setAlbumTitle(data.item.album.name);
                    setArtist(data.item.artists[0].name);
                    setReleaseDate(data.item.album.release_date);
                });
        }
        getPlaybackState();
        const interval = setInterval(() => getPlaybackState(), 1000);
        return () => {
            clearInterval(interval);
        };
    }, []);

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

    $(document).ready(function () {
        console.log("Document ready");
        $('[data-bs-toggle="tooltip"]').tooltip({
            trigger: "hover",
        });
        $("#noteInterface").on("shown.bs.modal", function () {
            $("#noteInput").focus();
        });
        $("#timestampInput").on("keydown", function (event) {
            console.log(event);
            $("#timestampInput").val(
                $("#timestampInput").val().concat(event.key)
            );
        });
        $(".save-note").click(async function () {
            let noteData = $(".note-form").serializeArray();
            await setNotes([
                ...notes,
                new Note(
                    noteData[0].value,
                    noteData[1].value,
                    noteData[2].value === "" ? "(no note)" : noteData[2].value
                ),
            ]);
            $("#noteInput").val("");
        });

        notes.map((note, i) => {
            let buttonID = "#edit-note" + i;
            let formID = "#note-form" + i;
            $(buttonID).click(async function () {
                let noteData = $(formID).serializeArray();
                let editedNote = new Note(
                    noteData[0].value,
                    noteData[1].value,
                    noteData[2].value === "" ? "(no note)" : noteData[2].value
                );
                notes.splice(i, 0, editedNote);
                notes.splice(i + 1, 1);
            });
        });
    });

    class Note {
        constructor(timestamp, length, note) {
            this.timestamp = timestamp;
            this.length = length;
            this.note = note;
        }
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
                            <>
                                <h2
                                    className="timestamp d-inline-block"
                                    onClick={() =>
                                        setUserPlaybackProgress(
                                            timestampToMilliseconds(
                                                note.timestamp
                                            )
                                        )
                                    }
                                >
                                    {note.timestamp}
                                </h2>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    fill="#d8e9a8"
                                    className="bi bi-pencil-square"
                                    viewBox="0 0 16 16"
                                    data-bs-toggle="modal"
                                    data-bs-target={"#editNoteInterface" + i}
                                >
                                    <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z" />
                                    <path
                                        fillRule="evenodd"
                                        d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"
                                    />
                                </svg>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    fill="#d8e9a8"
                                    className="bi bi-trash"
                                    viewBox="0 0 16 16"
                                    onClick={() => notes.splice(i, 1)}
                                >
                                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z" />
                                    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z" />
                                </svg>
                                <h3>{note.note}</h3>
                            </>
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
                        </div>
                    </div>
                </div>
            </div>
            <NoteModal tempTimeStamp={tempTimeStamp} />
            {notes.map((note, i) => (
                <EditNoteModal
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

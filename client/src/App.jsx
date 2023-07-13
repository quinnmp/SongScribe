import { useEffect, useState } from "react";
import AlbumSidebar from "./components/AlbumSidebar.jsx";
import NoteModal from "./components/NoteModal.jsx";

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
                // body: JSON.stringify({ title: "Fetch PUT Request Example" }),
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

    async function setUserPlaybackProgress() {
        const requestOptions = {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            // body: JSON.stringify({ title: "Fetch PUT Request Example" }),
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
        const minutes = timestamp.split(":")[0];
        const seconds = timestamp.split(":")[1];
        return (
            ((minutes * 1000 * 60 + seconds * 1000) / trackLength) * 95 + "%"
        );
    }

    $(document).ready(function () {
        // const tooltipTriggerList = document.querySelectorAll(
        //     '[data-bs-toggle="tooltip"]'
        // );
        // const tooltipList = [...tooltipTriggerList].map(
        //     (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
        // );
        // $('[data-bs-toggle="tooltip"]').tooltip({
        //     trigger: "hover",
        // });
        $("#noteInterface").on("shown.bs.modal", function () {
            $("#noteInput").focus();
        });
        $(".save-note").click(async function () {
            let noteData = $(".note-form").serializeArray();
            await setNotes([
                ...notes,
                new Note(
                    noteData[0].value,
                    noteData[1].value,
                    noteData[2].value
                ),
            ]);
            $("#noteInput").val("");
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
                        {notes.map((note) => (
                            <>
                                <h2 className="timestamp">{note.timestamp}</h2>
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
                                            onClick={setUserPlaybackProgress}
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
        </>
    );
}

export default App;

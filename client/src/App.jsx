import { useEffect, useState } from "react";
import { AlbumSidebar } from "./components/AlbumSidebar";

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

    useEffect(() => {
        function getPlaybackState() {
            fetch("http://localhost:5000/api")
                .then((response) => {
                    return response.json();
                })
                .then((data) => {
                    setPlaybackProgress(data.progress_ms);
                    setPlaybackProgressString(
                        Math.floor(data.progress_ms / 1000 / 60) +
                            ":" +
                            (Math.round((data.progress_ms / 1000) % 60) < 10
                                ? "0"
                                : "") +
                            Math.round((data.progress_ms / 1000) % 60)
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

    function setNoteTimeStamp() {
        setTempTimeStamp(playbackProgressString);
    }

    return (
        <>
            <div className="container">
                <div className="row mt-5">
                    <div className="col-3">
                        <img
                            className="img-fluid m-2"
                            src={albumCoverURL}
                            alt="album cover"
                            id="album-cover"
                        />
                        <h1>
                            <sup>{trackNumber}</sup>&#8260;
                            <sub>{totalTracks}</sub>
                        </h1>
                        <h2>{songTitle}</h2>
                        <h3>{albumTitle}</h3>
                        <h3>{artist}</h3>
                        <h3>{releaseDate}</h3>
                    </div>
                    <div className="col-9">
                        <div className="row" id="add-note-spacer">
                            <div className="col-1"></div>
                            <div
                                className="col-10 align-self-center"
                                style={{ position: "relative" }}
                            >
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
            <div
                className="modal fade"
                id="noteInterface"
                data-bs-backdrop="static"
                data-bs-keyboard="false"
                tabIndex="-1"
                aria-labelledby="staticBackdropLabel"
                aria-hidden="true"
            >
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h1
                                className="modal-title fs-5"
                                id="staticBackdropLabel"
                            >
                                Add a note
                            </h1>
                            <button
                                type="button"
                                className="btn-close"
                                data-bs-dismiss="modal"
                                aria-label="Close"
                            ></button>
                        </div>
                        <div className="modal-body">
                            <form className="note-form">
                                <label
                                    htmlFor="timestampInput"
                                    className="form-label"
                                >
                                    Timestamp
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="timestampInput"
                                    name="timestamp"
                                    value={tempTimeStamp}
                                ></input>
                                <label
                                    htmlFor="lengthInput"
                                    className="form-label mt-2"
                                >
                                    Length (0 if instantaneous)
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="lengthInput"
                                    name="length"
                                    value="0"
                                ></input>
                                <label
                                    htmlFor="noteInput"
                                    className="form-label mt-2"
                                >
                                    Note
                                </label>
                                <textarea
                                    className="form-control"
                                    id="noteInput"
                                    rows="3"
                                    name="note"
                                ></textarea>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn close-btn"
                                data-bs-dismiss="modal"
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary save-note"
                                // data-bs-dismiss="modal"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default App;

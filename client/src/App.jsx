import { useEffect, useState } from "react";
import AlbumSidebar from "./components/AlbumSidebar.jsx";
import NoteModal from "./components/NoteModal.jsx";
import EditNoteModal from "./components/EditNoteModal.jsx";
import SidebarNote from "./components/SidebarNote.jsx";
import NavBar from "./components/NavBar.jsx";
import NoteArea from "./components/NoteArea.jsx";
import PlaybackBar from "./components/PlaybackBar.jsx";
import SongNoteArea from "./components/SongNoteArea.jsx";
import AlbumTab from "./components/AlbumTab.jsx";

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
    const [artists, setArtists] = useState([]);
    const [releaseDate, setReleaseDate] = useState("");
    const [notes, setNotes] = useState([]);
    const [scrubbing, setScrubbing] = useState(false);
    const [uploadingNote, setUploadingNote] = useState(false);
    const [tracklist, setTracklist] = useState([]);
    const [albumReviews, setAlbumReviews] = useState([]);
    const [albumArtists, setAlbumArtists] = useState([]);
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
                    try {
                        if (data.spotify_player_data.item.id != songID) {
                            setNotes([]);
                            setArtists([]);
                            setAlbumArtists([]);
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
                        setTrackNumber(
                            data.spotify_player_data.item.track_number
                        );
                        setSongTitle(data.spotify_player_data.item.name);
                        setAlbumTitle(data.spotify_player_data.item.album.name);

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
                            data.spotify_album_data.artists.map((artist) => {
                                tempAlbumArtists.push(artist.name);
                            });
                            setAlbumArtists(tempAlbumArtists);
                        }

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
                    } catch (e) {
                        console.log(e);
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
                    if (event.key === "Enter" && !event.shiftKey) {
                        $(".save-note").click();
                    }
                });
            notes.map((note, i) => {
                let buttonID = "#edit-note" + i;
                let formID = "#note-form" + i;
                let textareaID = "#noteInput" + i;
                $(textareaID).on("keydown", function (event) {
                    if (event.key === "Enter" && !event.shiftKey) {
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
                        await tempNotesArray.splice(i, 0, editedNote);
                        await tempNotesArray.splice(i + 1, 1);
                        await setNotes(tempNotesArray);
                    });
            });
        });
        return () => {
            clearInterval(interval);
        };
    }, [notes, scrubbing, uploadingNote, artists]);

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
            .then((data) => data);
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
                        id="song-tab-pane"
                        role="tabpanel"
                        aria-labelledby="song-tab"
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
                                    artists={artists}
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
                                    <SongNoteArea />
                                </div>
                            </div>
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
                    />
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

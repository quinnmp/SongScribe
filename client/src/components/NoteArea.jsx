function NoteArea(props) {
    function timestampToMilliseconds(timestamp) {
        const minutes = timestamp.split(":")[0];
        const seconds = timestamp.split(":")[1];
        return minutes * 1000 * 60 + seconds * 1000;
    }
    return (
        <>
            <div className="row" id="add-note-spacer">
                <div className="col-md-1 col-2"></div>
                <div
                    className="col-md-10 col-8 align-self-center"
                    style={{ position: "relative" }}
                >
                    {props.notes.map((note) => (
                        <>
                            <br />
                            <button
                                type="button"
                                className="btn add-note-button"
                                data-bs-toggle="tooltip"
                                data-bs-title={note.note}
                                data-bs-custom-class="custom-tooltip"
                                style={{
                                    left:
                                        (timestampToMilliseconds(
                                            note.timestamp
                                        ) /
                                            props.trackLength) *
                                        ($(".form-range").width() - 8 - 8),
                                    top: "5%",
                                    position: "absolute",
                                }}
                                onClick={() =>
                                    props.noteOnClick(note.timestamp)
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
                            left: props.leftSpace,
                            top: "5%",
                            position: "absolute",
                        }}
                        data-bs-toggle="modal"
                        data-bs-target="#noteInterface"
                        onClick={props.addNoteTimestamp}
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
                <div className="col-md-1 col-2"></div>
            </div>
        </>
    );
}

export default NoteArea;

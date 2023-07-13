function NoteModal(props) {
    return (
        <>
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
                                    value={props.tempTimeStamp}
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
                                data-bs-dismiss="modal"
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

export default NoteModal;

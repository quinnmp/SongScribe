function EditNoteModal(props) {
    let id = "editNoteInterface" + props.index;
    let textareaID = "#noteInput" + props.index;
    return (
        <>
            <div
                className="modal fade"
                id={id}
                data-bs-backdrop="static"
                data-bs-keyboard="false"
                tabIndex="-1"
                aria-labelledby={"staticBackdropLabel" + props.index}
                aria-hidden="true"
            >
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h1
                                className="modal-title fs-5"
                                id={"staticBackdropLabel" + props.index}
                            >
                                Edit a note
                            </h1>
                            <button
                                type="button"
                                className="btn-close"
                                data-bs-dismiss="modal"
                                aria-label="Close"
                            ></button>
                        </div>
                        <div className="modal-body">
                            <form id={"note-form" + props.index}>
                                <label
                                    htmlFor={"timestampInput" + props.index}
                                    className="form-label"
                                >
                                    Timestamp
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id={"timestampInput" + props.index}
                                    name="timestamp"
                                    defaultValue={props.timestamp}
                                ></input>
                                <label
                                    htmlFor={"lengthInput" + props.index}
                                    className="form-label mt-2"
                                >
                                    Length (0 if instantaneous)
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id={"lengthInput" + props.index}
                                    name="length"
                                    defaultValue={props.length}
                                ></input>
                                <label
                                    htmlFor={"noteInput" + props.index}
                                    className="form-label mt-2"
                                >
                                    Note
                                </label>
                                <textarea
                                    className="form-control"
                                    id={"noteInput" + props.index}
                                    rows="3"
                                    name="note"
                                    defaultValue={props.note}
                                ></textarea>
                                <input
                                    type="text"
                                    className="visually-hidden"
                                    name="index"
                                    defaultValue={props.index}
                                ></input>
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
                                id={"edit-note" + props.index}
                                className="btn btn-primary edit-note"
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

export default EditNoteModal;

function SongNoteArea() {
    return (
        <>
            <div className="py-5 px-md-5 px-sm-1">
                <label
                    htmlFor="quick-summary-input"
                    className="form-label mt-md-3 mt-0"
                >
                    <h2 className="text-start">Quick summary</h2>
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
        </>
    );
}

export default SongNoteArea;

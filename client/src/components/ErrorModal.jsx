function ErrorModal(props) {
    return (
        <>
            <button
                type="button"
                id="errorModalTriggerButton"
                data-bs-toggle="modal"
                data-bs-target="#errorModal"
            ></button>

            <div className="modal" id="errorModal">
                <div className="modal-dialog">
                    <div className="modal-content p-2">
                        <div className="modal-header">
                            <h1 className="modal-title">
                                Welcome to SongScribe!
                            </h1>
                        </div>
                        <div className="modal-body">
                            <h3 className="fw-normal">
                                We're getting everything set up for you. This could take up to a minute.
                            </h3>
                            <br />
                            <h3 className="fw-normal">
                                While you wait, make sure you have a song playing on Spotify (or this message won't go away!) and you aren't signed into any other account on this browser (or we'll think that's you!) 
                            </h3>
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn close-btn mx-auto"
                                id="errorModalCloseButton"
                                data-bs-dismiss="modal"
                                onClick={props.onClick}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ErrorModal;

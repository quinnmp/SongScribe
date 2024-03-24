function ErrorModal() {
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
                                Looks like you're not listening to anything. Put
                                on a track on Spotify and this page should
                                update!
                            </h3>
                            <br />
                            <h3 className="fw-normal">
                                If you are listening to something, make sure you
                                are logged in to Spotify on this browser.
                            </h3>
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn close-btn mx-auto"
                                id="errorModalCloseButton"
                                data-bs-dismiss="modal"
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

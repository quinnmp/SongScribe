function LoggedOutModal() {
    return (
        <>
            <button
                type="button"
                id="loggedOutModalTriggerButton"
                data-bs-toggle="modal"
                data-bs-target="#loggedOutModal"
            ></button>

            <div className="modal" id="loggedOutModal">
                <div className="modal-dialog">
                    <div className="modal-content p-2">
                        <div className="modal-header">
                            <h1 className="modal-title">Logged Out</h1>
                        </div>
                        <div className="modal-body">
                            <h3 className="fw-normal">
                                Your account has been disconnected and you have
                                been logged out. If you want to reconnect your
                                account, reload the page and you&apos;ll be able
                                to use SongScribe again!
                            </h3>
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn close-btn mx-auto"
                                id="loggedOutModalCloseButton"
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

export default LoggedOutModal;

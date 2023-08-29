function DisconnectTab(props) {
    return (
        <>
            <div
                className="tab-pane fade text-center"
                id="disconnect-tab-pane"
                role="tabpanel"
                aria-labelledby="disconnect-tab"
                tabIndex="0"
            >
                <p className="mt-5">
                    This page allows you to log out and disconnect your Spotify
                    account from SongScribe.
                </p>
                <button
                    className="btn btn-primary mx-auto"
                    onClick={props.onClick}
                >
                    Disconnect Me
                </button>
            </div>
        </>
    );
}

export default DisconnectTab;

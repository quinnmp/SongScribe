function NavBar() {
    return (
        <>
            <ul className="nav nav-tabs mt-5" id="myTab" role="tablist">
                <li className="nav-item" role="presentation">
                    <button
                        className="nav-link active"
                        id="song-tab"
                        data-bs-toggle="tab"
                        data-bs-target="#song-tab-pane"
                        type="button"
                        role="tab"
                        aria-controls="song-tab-pane"
                        aria-selected="true"
                    >
                        Song
                    </button>
                </li>
                <li className="nav-item" role="presentation">
                    <button
                        className="nav-link"
                        id="album-tab"
                        data-bs-toggle="tab"
                        data-bs-target="#album-tab-pane"
                        type="button"
                        role="tab"
                        aria-controls="album-tab-pane"
                        aria-selected="false"
                    >
                        Album
                    </button>
                </li>
                <li className="nav-item" role="presentation">
                    <button
                        className="nav-link"
                        id="disconnect-tab"
                        data-bs-toggle="tab"
                        data-bs-target="#disconnect-tab-pane"
                        type="button"
                        role="tab"
                        aria-controls="disconnect-tab-pane"
                        aria-selected="false"
                    >
                        Disconnect
                    </button>
                </li>
            </ul>
        </>
    );
}

export default NavBar;

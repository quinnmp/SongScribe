function AlbumTab(props) {
    return (
        <>
            <div
                className="tab-pane fade"
                id="album-tab-pane"
                role="tabpanel"
                aria-labelledby="album-tab"
                tabIndex="0"
            >
                <img
                    className="img-fluid rounded mx-auto mt-5 mb-3 d-block"
                    src={props.albumCoverURL}
                    alt="album cover"
                    id="album-page-cover"
                />
                <h1>{props.albumTitle}</h1>
                <h1>{props.artist}</h1>
                <h1 className="mb-4">{props.releaseDate}</h1>
                {props.tracklist.map((track, i) => (
                    <>
                        <hr className="mx-3" />
                        <div className="row">
                            <div className="col-1">
                                <h2 key={i}>{i + 1}.</h2>
                            </div>
                            <div className="vr"></div>
                            <div className="col-5">
                                <h2 key={i}>{track.name}</h2>
                            </div>
                            <div className="vr"></div>
                            <div className="col-5">
                                {props.songsWithData.includes(track.id) && (
                                    <h2 key={i}>
                                        {
                                            props.albumReviews[
                                                props.songsWithData.findIndex(
                                                    (item) => item == track.id
                                                )
                                            ].quick_summary
                                        }
                                    </h2>
                                )}
                            </div>
                            <div className="vr"></div>
                            <div className="col-1">
                                {props.songsWithData.includes(track.id) && (
                                    <>
                                        <h2 key={i} className="d-inline-block">
                                            {
                                                props.albumReviews[
                                                    props.songsWithData.findIndex(
                                                        (item) =>
                                                            item == track.id
                                                    )
                                                ].review_count
                                            }
                                        </h2>

                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="25"
                                            height="25"
                                            fill="#d8e9a8"
                                            className="bi bi-chat-right-text mb-3 ms-2"
                                            viewBox="0 0 16 16"
                                        >
                                            <path d="M2 1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h9.586a2 2 0 0 1 1.414.586l2 2V2a1 1 0 0 0-1-1H2zm12-1a2 2 0 0 1 2 2v12.793a.5.5 0 0 1-.854.353l-2.853-2.853a1 1 0 0 0-.707-.293H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h12z" />
                                            <path d="M3 3.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zM3 6a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 6zm0 2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z" />
                                        </svg>
                                    </>
                                )}
                            </div>
                        </div>
                    </>
                ))}
                <hr className="mx-3 mb-5" />
            </div>
        </>
    );
}

export default AlbumTab;

function AlbumSidebar(props) {
    return (
        <>
            <img
                className="img-fluid m-2"
                src={props.albumCoverURL}
                alt="album cover"
                id="album-cover"
            />
            <h1>
                <sup>{props.trackNumber}</sup>&#8260;
                <sub>{props.totalTracks}</sub>
            </h1>
            <h2>{props.songTitle}</h2>
            <h3>{props.albumTitle}</h3>
            {props.artists.map((artist, i) =>
                i !== props.artists.length - 1 ? (
                    <h3 key={i} className="d-inline-block">
                        {artist},&nbsp;
                    </h3>
                ) : (
                    <h3 key={i} className="d-inline-block">
                        {artist}
                    </h3>
                )
            )}
            <h3>{props.releaseDate}</h3>
        </>
    );
}

export default AlbumSidebar;

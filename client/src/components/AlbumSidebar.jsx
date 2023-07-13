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
            <h3>{props.artist}</h3>
            <h3>{props.releaseDate}</h3>
        </>
    );
}

export default AlbumSidebar;

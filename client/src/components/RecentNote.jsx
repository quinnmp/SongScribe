function RecentNote(props) {
    return (
        <>
            <div className="row mb-3">
                <div className="col-4">
                    <img
                        className="img-fluid"
                        src={props.albumCoverURL}
                        alt="album cover"
                    />
                </div>
                <div className="col-8">
                    <h3>{props.songTitle}</h3>
                    <h3>{props.artist}</h3>
                </div>
            </div>
        </>
    );
}

export default RecentNote;

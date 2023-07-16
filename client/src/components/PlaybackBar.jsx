function PlaybackBar(props) {
    return (
        <>
            <div className="col-md-1 col-2 px-1 py-0">
                <h3>0:00</h3>
            </div>
            <div className="col-md-10 col-8" style={{ position: "relative" }}>
                <h3
                    style={{
                        left:
                            (props.playbackProgress / props.trackLength) *
                            ($(".form-range").width() - 8 - 8),
                        top: "60%",
                        position: "absolute",
                    }}
                >
                    {props.playbackProgressString}
                </h3>
                <input
                    type="range"
                    className="form-range"
                    min="0"
                    max={props.trackLength}
                    value={props.playbackProgress}
                ></input>
            </div>
            <div className="col-md-1 col-2 px-1 py-0 text-end">
                <h3>
                    {Math.floor(props.trackLength / 1000 / 60)}:
                    {Math.floor((props.trackLength / 1000) % 60) < 10
                        ? "0"
                        : ""}
                    {Math.floor((props.trackLength / 1000) % 60)}
                </h3>
            </div>
        </>
    );
}
export default PlaybackBar;

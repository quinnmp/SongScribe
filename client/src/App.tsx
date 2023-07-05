// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useEffect, useState } from "react";

function App() {
    const [backendData, setBackendData] = useState("");

    // useEffect(() => {
    //     function getPlaybackState() {
    //         fetch("/api")
    //             .then((response) => {
    //                 console.log(response);
    //                 response.json();
    //             })
    //             .then((data) => {
    //                 setBackendData(data);
    //             });
    //     }
    //     getPlaybackState();
    //     const interval = setInterval(() => getPlaybackState(), 10000);
    //     return () => {
    //         clearInterval(interval);
    //     };
    // }, []);

    useEffect(() => {
        fetch("http://localhost:5000/api")
            .then((response) => {
                console.log(response);
                response.json();
            })
            .then((data) => {
                setBackendData(data);
            });
    }, []);

    return <div>{backendData}</div>;
}

export default App;

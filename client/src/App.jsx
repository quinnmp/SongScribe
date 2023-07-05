import React, { useEffect, useState } from "react";

function App() {
    const [backendData, setBackendData] = useState("");

    useEffect(() => {
        function getPlaybackState() {
            fetch("http://localhost:5000/api")
                .then((response) => {
                    return response.json();
                })
                .then((data) => {
                    console.log(data);
                    setBackendData(data);
                });
        }
        getPlaybackState();
        const interval = setInterval(() => getPlaybackState(), 1000);
        return () => {
            clearInterval(interval);
        };
    }, []);

    return <div>{JSON.stringify(backendData)}</div>;
}

export default App;

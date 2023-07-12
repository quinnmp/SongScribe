import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

const notes = [];

$(document).ready(function () {
    $(".save-note").click(function () {
        let noteData = $(".note-form").serializeArray();
        notes.push(
            new Note(noteData[0].value, noteData[1].value, noteData[2].value)
        );
    });
});

class Note {
    constructor(timestamp, length, note) {
        this.timestamp = timestamp;
        this.length = length;
        this.note = note;
    }
}

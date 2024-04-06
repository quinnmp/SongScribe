class User {
    constructor() {
        this.albumData = "";
        this.queueAlbumData = "";
        this.queueSongData = "";
        this.userData = "";
        this.playerData = "";
        this.lyricData = "";
        this.queueLyricData = "";
        this.playingSongID = "";
        this.recentNoteData = [];
        this.albumID = -1;

        this.newSong = false;
        this.loggedOut = false;

        this.currentlyProcessingNote = false;

        this.geniusAccessToken = "";
    }
}

module.exports = User;

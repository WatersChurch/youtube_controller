# YouTube Controller.js
A wrapper for using the YouTube Data API v3.

### Usage
Initiate and manipulate colors:

```javascript
jQuery("#yt_player").YTController({
    embeddedPlyrVars: {
        listType: "playlist",
        autohide: 1,
        controls: 2,
        showinfo: 0,
        list: pid
    },
    width: "100%",
    height: "422",
    displayPlaylist: true,
    maxNumListItems: 15,
    apiKey: "AIzaSyAb5J9L7NXAa8s2t-fvGnsoGU8xI2IYibQ",
    playlistId: pid,
    playListParentId: "#yt_player_playlist",
    listItemHTMLTemplate: "<div class='yt_player_playlist_item'><h5>[playlistItem_title]</h5></div>"
});
```

### Installation

You need Gulp installed globally:

```sh
$ npm i -g gulp
```

```sh
$ git clone [git-repo-url] dillinger
$ cd dillinger
$ npm i -d
$ mkdir -p public/files/{md,html,pdf}
$ gulp build --prod
$ NODE_ENV=production node app
```

### Author
YouTubeController.js is written by [Woody Romelus](http://woodyromelus.com).

### License
Released under [MIT license](http://www.opensource.org/licenses/mit-license).
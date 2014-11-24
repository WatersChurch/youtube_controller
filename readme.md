# YouTube Controller.js
A jquery plugin wrapper for controlling embedded video players using the [YouTube Data API v3](https://developers.google.com/youtube/v3/).

### Usage
Define a HTML element which will contain the embedded video player.
```html
<div id="player_id">
... 
</div>
```
Attach the `YTController` object onto any DOM element.
```javascript
jQuery("#player_id").YTController({
    width: "100%",
    height: "422",
    videoId: "6k8qeqZycgE"
});
```
## Demo
More detailed examples and documention can be found [here](http://waterschurch.github.io/youtube_controller).

### Author
YouTubeController.js is written by [Woody Romelus](https://github.com/romelusw).

### License
Released under [MIT license](http://www.opensource.org/licenses/mit-license).

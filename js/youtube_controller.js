/**
 * YTController.js
 *
 * @author Woody Romelus
 * @version v1.0.0
 * @date 11/22/14
 *
 * Copyright (c) 2014 "YTController.js" Woody Romelus
 * Licensed under the MIT licenses: http://www.opensource.org/licenses/mit-license.php
 * Requires: jQuery >= v1.11.1
 */
;(function($) {

    "use-strict";

    /**
     * Globals
     */
    var pluginName = "plugin_YTController",
        YT_IFRAME_API = "https://www.youtube.com/iframe_api",
        YT_RESOURCE = "https://www.googleapis.com/youtube/v3/",
        YT_PLAYLIST_ITEMS_RESOURCE = "playlistItems",
        isApiLoaded = false,
        jqueryObserverElems = [],
        defaults = {
            apiKey: undefined,
            displayPlaylist: false,
            playerVars: undefined,
            height: "390",
            listItemClickHandler: playVideoAt,
            listItemHTMLTemplate: "<div><img src='[playlistItem_thumb]'/><span>[playlistItem_timestamp]</span><h4>[playlistItem_title]</h4><p>[playlistItem_description]</p></div>",
            listItemThumbNailJSONPath: "thumbnails.default",
            maxNumListItems: 1,
            onApiChangeHandler: $.noop,
            onErrorHandler: $.noop,
            onPlaybackQChangeHandler: $.noop,
            onPlaybackRChangeHandler: $.noop,
            onReadyEvtHandler: $.noop,
            onStateChangeHandler: $.noop,
            playListId: undefined,
            playListParentId: undefined,
            videoId: undefined,
            width: "640"
        };

    /**
     * Plugin Constructor.
     * @param element the DOM element to attach
     * @param options user provided options
     */
    var YTController = function(element, options) {
        this.defaults = defaults;
        this.domElement = element;
        this.name = "YTController";
        this.user_options = options;
        this.settings = $.extend({}, this.defaults, this.user_options);
        this.ytPlayer = undefined;
        embedIFrameAPI();
        displayPlaylist(this);

        /**
         * YTController interface
         */
        this.play = function() {
            return getPlayer(this).playVideo();
        };
        this.stop = function() {
            return getPlayer(this).stopVideo();
        };
        this.pause = function() {
            return getPlayer(this).pauseVideo();
        };
        this.previous = function() {
            return getPlayer(this).previousVideo();
        };
        this.next = function() {
            return getPlayer(this).nextVideo();
        };
        this.mute = function() {
            return getPlayer(this).mute();
        };
        this.unmute = function() {
            return getPlayer(this).unMute();
        };
        this.stats = function() {
            return getPlayerMetaData(getPlayer(this));
        };
        this.getPlayer = function() {
            return getPlayer(this);
        };
        this.destroy = function() {
            // Unbind listeners
            $($(this).data().settings.playListParentId).children().off();
            // Remove MetaData on DOM element
            $(this).removeData();
            // Remove iframe player
            getPlayer(this).destroy();
        };
    };

    /**
     * Add the YTController constructor into the $.fn namespace. Attach controller onto each DOM
     * element that was selected.
     * @param options construction arguments
     * @return jQuery object
     */
    $.fn.YTController = function(options) {
        return this.each(function() {
            if (options === undefined || typeof options == "object") {
                if (!$.data(this, pluginName)) {
                    $.data(this, pluginName, new YTController(this, options));
                    jqueryObserverElems.push(this);
                }
            } else {
                throw new YTControllerException("Invalid construction of the YTController.", options);
            }
        });
    };

    /**
     * Initializes the YT library scripts within the document to make use of the IFrame API.
     */
    function embedIFrameAPI() {
        // Only load once
        if (!isApiLoaded) {
            var iframeScript = document.createElement('script');
            iframeScript.src = YT_IFRAME_API;
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(iframeScript, firstScriptTag);
            isApiLoaded = true;
        }
    };

    /**
     * Iframe API initialization
     */
    onYouTubePlayerAPIReady = function() {
        $.each(jqueryObserverElems, function(indx, obj) {
            var controller = $(obj).data(pluginName);
            var elementId = $(controller.domElement).attr("id");
            var settings = controller.settings;
            var ytPlayer = new YT.Player(elementId, {
                height: settings.height,
                width: settings.width,
                videoId: settings.videoId,
                playerVars: $.extend({}, {list:settings.playListId}, settings.playerVars),
                events: {
                    'onReady': settings.onReadyEvtHandler,
                    'onStateChange': settings.onStateChangeHandler,
                    'onPlaybackQualityChange': settings.onPlaybackQChangeHandler,
                    'onPlaybackRateChange': settings.onPlaybackRChangeHandler,
                    'onError': settings.onErrorHandler,
                    'onApiChange': settings.onApiChangeHandler
                }
            });
            controller.ytPlayer = ytPlayer;
            // Update the dom reference since the original element was replaced
            controller.domElement = $("#" + elementId)[0];
            $("#" + elementId).data(pluginName, controller);
        });
    };

    /**
     * Displays a ui friendly format of the playlist content.
     * @param controller the controller
     */
    function displayPlaylist(controller) {
        var settings = controller.settings;
        if (settings.displayPlaylist && typeof settings.playListId == "string") {
            var params = {
                part: "snippet",
                maxResults: settings.maxNumListItems,
                key: settings.apiKey,
                playlistId: settings.playListId
            };
            getJSONRequest(YT_RESOURCE + YT_PLAYLIST_ITEMS_RESOURCE, params,
                function(data) {
                    buildPlaylistCallback(controller, data);
                }
            );
        }
    }

    /**
     * Generates an HTML structure to represent playlist items.
     * @param controller the controller
     * @param feed the json response from the youtube resource
     */
    function buildPlaylistCallback(controller, feed) {
        var settings = controller.settings;
        var playListHTML = settings.playListParentId;
        var listItemHTMLTemplate = settings.listItemHTMLTemplate;
        $.each(feed.items, function(indx, obj) {
            var snippet = obj.snippet;
            var htmlContent = listItemHTMLTemplate.replace(/\[playlistItem_thumb\]/g, jsonFindElem(snippet, settings.listItemThumbNailJSONPath).url)
                .replace(/\[playlistItem_timestamp\]/g, snippet.publishedAt)
                .replace(/\[playlistItem_title\]/g, snippet.title)
                .replace(/\[playlistItem_description\]/g, snippet.description);
            $(playListHTML).append($(htmlContent).first().click(function() {
                settings.listItemClickHandler.call(this, controller, indx);
            }));
        });
    }

    /**
     * Retrieves a JSON response from a web resource.
     * @param url the resource to retrieve from
     * @param paramObj parameters attached to the query string of the request
     * @param callback a function to handle the returned data
     * @return a jqXHR Object
     */
    function getJSONRequest(url, paramObj, callback) {
        return $.ajax({
            datatype: "json",
            url: url,
            data: paramObj,
            success: callback,
            error: function(jqXHR, errCode, exceptionObj) {
                throw new YTControllerException("Could not retrieve feed.", String(exceptionObj));
            }
        });
    };

    /**
     * Retrieves a YT.player instance from an object if it exists.
     * @param obj the element which contains a player instance
     * @throws Exception when the object does not contain an YT.player
     * @return a YT.player object
     */
    function getPlayer(obj) {
        try {
            // Resolve the controller reference to the updated iFrame element
            return obj.ytPlayer;
        } catch (err) {
            throw new YTControllerException("The DOM element does not have a player associated to it.", obj);
        }
    }

    /**
     * Retrieves an element from a JSON object.
     * = Note =
     * This method returns the last node from the path if the full
     * path cannot be resolved.
     *
     * @param json the json content to traverse
     * @param path the path to the child element of the json object delimited by '.'
     * @return the element searched for or the last sucessful element
     */
    function jsonFindElem(json, path) {
        var parts = path.split(".");
        var lastSuccessfulObj = json;
        while (parts.length > 0) {
            var part = parts.shift();
            if (lastSuccessfulObj.hasOwnProperty(part)) {
                lastSuccessfulObj = lastSuccessfulObj[part];
            }
        }
        return lastSuccessfulObj;
    };

    /**
     * Retrives the metadata for a YT.Player object.
     * @param player the YT.player
     * @return object containing a players metadata
     */
    function getPlayerMetaData(player) {
        var objResult = {},
            availableInfo = {
                BufferedPercent: "getVideoLoadedFraction",
                PlayerState: "getPlayerState",
                CurrentTime: "getCurrentTime",
                PlaybackQuality: "getPlaybackQuality",
                AvailableQualityLevels: "getAvailableQualityLevels",
                Duration: "getDuration",
                URL: "getVideoUrl",
                Playlist: "getPlaylist",
                PlaylistIdx: "getPlaylistIndex"
            };

        for (var key in availableInfo) {
            objResult[availableInfo[key]] = player[availableInfo[key]]();
        }
        return objResult;
    }

    /**
     * Plays a specific video from a playlist.
     * @param controller the controller
     * @param index the index of the video to play from the playlist
     */
    function playVideoAt(controller, index) {
        if(controller.ytPlayer.getPlayerState() != -1 || index != controller.ytPlayer.getPlaylistIndex()) {
            controller.ytPlayer.playVideoAt(index);
        }
    }

    /**
     * An exception.
     * @param message the cause
     * @param object the exception object
     */
    function YTControllerException(message, object) {
        this.message = message;
        this.object = object;
        this.toString = function() {
            return this.message + " " + String(this.object);
        };
    }
})(jQuery);

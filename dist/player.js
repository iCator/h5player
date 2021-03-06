/**
 * H5Player - A simple but powerful HTML5 music player
 * @version v1.3.3
 * @license MIT
 * @author Gerald <gera2ld@163.com>
 */
!function(){
/**
 * Lyric Parser
 * @desc Parse lyrics and get lyric by time
 * @author Gerald <gera2ld@163.com>
 */
function LyricParser() {
  this.data = [];
  this.last = 0;
}
LyricParser.prototype = {
  setLyric: function(lyric) {
    var data = this.data = [];
    this.last = 0;
    if(lyric) {
      var reg = /^\[([\d:.]+)\]\s*(.*)$/;
      lyric.split(/\n/).forEach(function(line) {
        var m = line.match(reg);
        if(m) {
          var t = 0;
          m[1].split(/:/).forEach(function(part){
            t = t * 60 + Number(part);
          });
          data.push([t, m[2]]);
        }
      });
    }
  },
  getLyricAtTime: function(time) {
    var self = this;
    var data = self.data;
    var last = self.last;
    var line = data[last] || data[last = 0];
    var next;
    if(line) {
      if(line[0] < time) {
        while((next = data[++ last]) && next[0] <= time)
          line = next;
        self.last = last - 1;
      } else {
        while(line && line[0] > time)
          line = data[-- last];
        self.last = last;
      }
    }
    return line ? line[1] : '';
  },
};

(function (doc, cssText) {
    var styleEl = doc.createElement("style");
    doc.getElementsByTagName("head")[0].appendChild(styleEl);
    if (styleEl.styleSheet) {
        if (!styleEl.styleSheet.disabled) {
            styleEl.styleSheet.cssText = cssText;
        }
    } else {
        try {
            styleEl.innerHTML = cssText;
        } catch (ignore) {
            styleEl.innerText = cssText;
        }
    }
}(document, ".h5p-playlist>div,.h5p-simple .h5p-info{white-space:nowrap;text-overflow:ellipsis}@-webkit-keyframes h5p-roll{from{-webkit-transform:rotate(0);transform:rotate(0)}to{-webkit-transform:rotate(360deg);transform:rotate(360deg)}}@keyframes h5p-roll{from{-webkit-transform:rotate(0);transform:rotate(0)}to{-webkit-transform:rotate(360deg);transform:rotate(360deg)}}.h5p{background:#fff;box-shadow:0 0 10px gray;position:relative}.h5p-button{cursor:pointer}.h5p-button.h5p-active,.h5p-button:hover{color:#1e90ff}.h5p-image{position:absolute}.h5p-image img{width:100%;height:100%}.h5p-title{font-weight:700}.h5p-bar{height:2px;background:silver;position:relative}.h5p-played{position:absolute;top:0;height:2px;background:brown}.h5p-playlist{display:none;max-height:200px;border-top:1px dashed gray;padding:.5em 1em;overflow-y:auto}.h5p-playlist>div{color:#1a1a1a;cursor:pointer}.h5p-playlist>div.h5p-active{color:#1e90ff;font-weight:700}.h5p-playlist>div:hover{color:orange;font-weight:700}.h5p-normal{border-radius:3px;max-width:400px;font-size:16px}.h5p-normal .h5p-image{width:130px;height:130px;left:10px;top:10px;-webkit-animation:h5p-roll 8s linear infinite;animation:h5p-roll 8s linear infinite;-webkit-animation-play-state:paused;animation-play-state:paused}.h5p-normal .h5p-image img{border-radius:50%}.h5p-normal .h5p-roll{-webkit-animation-play-state:running;animation-play-state:running}.h5p-normal .h5p-buttons{position:absolute;top:10px;right:10px;font-size:20px}.h5p-normal .h5p-buttons .h5p-button{margin-left:5px}.h5p-normal .h5p-info{padding:30px 10px 0 150px;text-align:center;height:70px}.h5p-normal .h5p-control{padding:0 10px 20px 150px;text-align:center}.h5p-normal .h5p-control .h5p-button{margin:10px;font-size:30px}.h5p-normal .h5p-artist{font-size:10px;height:20px}.h5p-normal .h5p-lyric{text-align:center;color:brown;font-size:12px;height:24px}.h5p-normal .h5p-progress{padding:5px 10px}.h5p-normal .h5p-wrap{position:relative;padding:4px 0}.h5p-normal .h5p-cursor{cursor:pointer;position:absolute;border:1px solid silver;background:#fff;border-radius:50%;width:10px;height:10px;top:0;margin-left:-5px}.h5p-normal .h5p-time{font-size:10px;position:absolute;right:0;top:-20px}.h5p-simple{border-radius:2px;max-width:300px;height:36px}.h5p-simple .h5p-image{width:34px;height:34px}.h5p-simple .h5p-buttons,.h5p-simple .h5p-lyric,.h5p-simple .h5p-time{display:none}.h5p-simple .h5p-info{position:absolute;top:0;left:40px;right:72px;line-height:34px;font-size:10px;overflow:hidden}.h5p-simple .h5p-info>*{margin:0 5px}.h5p-simple .h5p-control{position:absolute;top:0;right:5px;line-height:34px}.h5p-simple .h5p-control .h5p-button{display:inline-block;margin:0 5px;font-size:18px}.h5p-simple .h5p-artist,.h5p-simple .h5p-title{display:inline}.h5p-simple .h5p-progress{position:absolute;bottom:0;width:100%}"));

/**
 * HTML5 Player
 * @author Gerald <gera2ld@163.com>
 */

// manage all the players to ensure only one is playing at once
var players = [];
var currentPlayer = null;

function fireEvent(data) {
  var event = new CustomEvent('PlayerEvent', {
    detail: data,
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(event);
}
function extend(dict1, dict2) {
  for(var i in dict2) dict1[i] = dict2[i];
  return dict1;
}

function setCurrentPlayer(player) {
  currentPlayer = player;
  players.forEach(function(other) {
    if(player !== other) other.audio.pause();
  });
}

var themes = [
  'normal',
  'simple',
];

function Player(options) {
  this.options = options;
  this.init();
  players.push(this);
}
Player.prototype = {
  _classes: {
    list: 'fa fa-list',
    prev: 'fa fa-step-backward',
    play: 'fa fa-play',
    next: 'fa fa-step-forward',
    pause: 'fa fa-pause',
  },
  init: function() {
    var _this = this;
    var container = _this.options.container;
    _this.classes = extend({}, _this._classes);
    if(_this.options.classes)
      extend(_this.classes, _this.options.classes);
    container.classList.add('h5p');
    container.innerHTML =
      '<div class="h5p-image"></div>' +
      '<div class="h5p-buttons">' +
        '<i data-id="list" class="h5p-button ' + _this.classes.list + '"></i>' +
      '</div>' +
      '<div class="h5p-info">' +
        '<div class="h5p-title"></div>' +
        '<div class="h5p-artist"></div>' +
      '</div>' +
      '<div class="h5p-control">' +
        '<i data-id="prev" class="h5p-button ' + _this.classes.prev + '"></i>' +
        '<i data-id="play" class="h5p-button ' + _this.classes.play + '"></i>' +
        '<i data-id="next" class="h5p-button ' + _this.classes.next + '"></i>' +
      '</div>' +
      '<div class="h5p-progress">' +
        '<div data-id="bar" class="h5p-wrap">' +
          '<div class="h5p-bar">' +
            '<div class="h5p-played"></div>' +
          '</div>' +
          '<div class="h5p-cursor"></div>' +
          '<div class="h5p-time"></div>' +
        '</div>' +
      '</div>' +
      '<div class="h5p-lyric"></div>' +
      '<div class="h5p-playlist"></div>'
    ;
    var $ = container.querySelector.bind(container);
    _this.image = $('.h5p-image');
    _this.title = $('.h5p-title');
    _this.artist = $('.h5p-artist');
    _this.playlist = $('.h5p-playlist');
    _this.prcur = $('.h5p-cursor');
    _this.prtime = $('.h5p-time');
    _this.brplayed = $('.h5p-played');
    _this.lyric = $('.h5p-lyric');
    _this.items = {};
    [].forEach.call(container.querySelectorAll('[data-id]'), function(item){
      _this.items[item.dataset.id] = item;
    });
    _this.audio = new Audio;
    // audio:not([controls]) should be hidden, just in case
    _this.audio.style.display = 'none';
    // attach audio to DOM so that media stops when audio is detached
    container.appendChild(_this.audio);
    _this.setSongs([]);
    _this.lyricParser = new LyricParser();
    _this.bindEvents();
    _this.setTheme(_this.options.theme);
  },
  getPoint: function(e) {
    if('offsetX' in e) return {
      x: e.offsetX,
      y: e.offsetY,
    };
    var rect = e.target.getBoundingClientRect();
    var docEle = document.documentElement;
    var win = window;
    return {
      x: e.pageX - (rect.left + win.pageXOffset - docEle.clientLeft),
      y: e.pageY - (rect.top + win.pageYOffset - docEle.clientTop),
    };
  },
  bindEvents: function() {
    var _this = this;
    var cursorData = null;
    var container = _this.options.container;
    var clickEvents = {
      list: _this.toggleList,
      prev: _this.playPrev,
      next: _this.playNext,
      play: _this.togglePlay,
      bar: function(e) {
        setCursor(_this.getPoint(e).x, true);
      },
    };
    var prevent = function(e) {
      if(e && e.preventDefault) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    var touch = function(func) {
      return function(e) {
        prevent(e);
        [].forEach.call(e.changedTouches, function(e) {
          func.call(_this, e);
        });
      };
    };
    var eventHandler = function(e) {
      var target = e.target;
      var id;
      while(1) {
        id = target.dataset.id;
        if (id || target === container) break;
        target = target.parentNode;
      }
      var func = id && clickEvents[id];
      if (func) {
        if (e.type == 'click') {
          prevent(e);
          func.call(_this, e);
        } else
          touch(func)(e);
      }
    };
    container.addEventListener('touchstart', eventHandler, false);
    container.addEventListener('click', eventHandler, false);
    _this.audio.addEventListener('ended', _this.playAnother.bind(_this), false);
    _this.audio.addEventListener('timeupdate', function(e) {
      var currentTime = this.currentTime;
      var duration = _this.duration;
      if(!duration) duration = _this.duration = this.duration;
      if(!cursorData) {
        var played = duration ? (currentTime / duration * 100) + '%' : 0;
        _this.prcur.style.left = played;
        _this.brplayed.style.width = played;
      }
      _this.prtime.innerHTML = _this.timestr(currentTime) + ' / ' + _this.timestr(duration);
      _this.lyric.innerHTML = _this.safeHTML(_this.lyricParser.getLyricAtTime(currentTime));
    }, false);
    var fire = function(type) {
      fireEvent({
        type: type,
        player: _this,
      });
    };
    var playStatusChange = function(e) {
      var status = ['play', 'pause'];
      var i = 0;
      if(e.type == 'play') {
        setCurrentPlayer(_this);
        fire(e.type);
      } else {
        i = 1;
        if (currentPlayer === _this) {
          fire(e.type);
          currentPlayer = null;
        }
      }
      var playcls = _this.items.play.classList;
      _this.classes[status[i]].split(/\s+/).forEach(function(c){
        playcls.remove(c);
      });
      _this.classes[status[1 - i]].split(/\s+/).forEach(function(c){
        playcls.add(c);
      });
      _this.image.classList[e.type=='play'?'add':'remove']('h5p-roll');
    };
    _this.audio.addEventListener('play', playStatusChange, false);
    _this.audio.addEventListener('pause', playStatusChange, false);
    _this.playlist.addEventListener('click', function(e) {
      prevent(e);
      var i = [].indexOf.call(this.childNodes, e.target);
      if(i >= 0) _this.play(i);
    }, false);
    var setCursor = function(x, play) {
      var newPos = x / _this.items.bar.offsetWidth;
      if(newPos < 0) newPos = 0;
      else if(newPos > 1) newPos = 1;
      _this.prcur.style.left = _this.brplayed.style.width = newPos * 100 + '%';
      if(play) _this.audio.currentTime = ~~ (newPos * _this.duration);
    };
    var movingCursor = function(e) {
      prevent(e);
      cursorData.moved = true;
      setCursor(e.clientX - cursorData.delta);
    };
    var touchMovingCursor = touch(movingCursor);
    var stopMovingCursor = function(e) {
      prevent(e);
      cursorData = null;
      container.removeEventListener('touchmove', touchMovingCursor, false);
      container.removeEventListener('mousemove', movingCursor, false);
      container.removeEventListener('touchend', touchEndMovingCursor, false);
      container.removeEventListener('mouseup', endMovingCursor, false);
    };
    var endMovingCursor = function(e) {
      setCursor(e.clientX - cursorData.delta, true);
      stopMovingCursor(e);
    };
    var touchEndMovingCursor = touch(endMovingCursor);
    var startMovingCursor = function(e) {
      prevent(e);
      if(!cursorData) {
        cursorData = {
          delta: e.clientX - _this.brplayed.offsetWidth,
        };
        container.addEventListener('touchmove', touchMovingCursor, false);
        container.addEventListener('mousemove', movingCursor, false);
        container.addEventListener('touchend', touchEndMovingCursor, false);
        container.addEventListener('mouseup', endMovingCursor, false);
      }
    };
    _this.prcur.addEventListener('touchstart', touch(startMovingCursor), false);
    _this.prcur.addEventListener('mousedown', startMovingCursor, false);
    // to stop click event on the progress bar
    _this.prcur.addEventListener('click', prevent, false);
  },
  safeHTML: function(html) {
    return html.replace(/[&"<]/g, function(m) {
      return {
        '&': '&amp;',
        '"': '&quot;',
        '<': '&lt;',
      }[m];
    });
  },
  toggleList: function(e) {
    var _this = this;
    _this.items.list.classList.toggle('h5p-active');
    var display = _this.playlist.style.display;
    _this.playlist.style.display = display ? '' : 'block';
  },
  togglePlay: function(e) {
    var _this = this;
    if(_this.current < 0)
      _this.play(0);
    else if(_this.audio.paused)
      _this.audio.play();
    else
      _this.audio.pause();
  },
  playPrev: function(e) {
    this.play(this.previous());
  },
  playNext: function(e) {
    this.play(this.next());
  },
  playAnother: function() {
    // TODO: add other modes
    this.playNext();
  },
  /**
   * songs should be a list of song objects:
   * {
   *   name: string
   *   url: string
   *   artist: (optional) string
   *   duration: (optional) int (seconds)
   *   image: (optional) string | object
   *     the object should have theme names as keys and image paths as values
   *   lyric: (optional) string
   * }
   */
  setSongs: function(songs) {
    var _this = this, data = [];
    _this.songs = songs;
    _this.songs.forEach(function(song) {
      var name = _this.safeHTML(song.name);
      data.push('<div title="'+name+'">'+name+'</div>');
    });
    _this.playlist.innerHTML = data.join('');
    _this.current = -1;
    _this.audio.src = '';
    _this.duration = 0;
    _this.showInfo(_this.songs[0]);
  },
  updateInfo: function (song) {
    var _this = this;
    var _song = _this.songs[_this.current];
    if (!song) song = _song || {};
    // update image
    var image = song.image;
    if (typeof image == 'object') image = image[_this.theme];
    image = image || _this.options.image || '';
    if(image)
      _this.image.innerHTML = '<img src="' + _this.safeHTML(image) + '">';
    // update lyric
    _this.lyric.innerHTML = '';
    if (_this.theme != 'simple' && _song)
      _this.getLyric(_song);
  },
  setTheme: function (theme) {
    var _this = this;
    var i = themes.indexOf(theme);
    if(i < 0) i = 0;
    var oldTheme = _this.theme;
    _this.theme = themes[i];
    if (oldTheme != _this.theme) {
      var container = _this.options.container;
      container.classList.remove('h5p-' + oldTheme);
      container.classList.add('h5p-' + _this.theme);
      _this.updateInfo();
    }
  },
  showInfo: function(song) {
    var _this = this;
    song = song || {};
    _this.updateInfo(song);
    _this.title.innerHTML = _this.safeHTML(song.name || '');
    _this.artist.innerHTML = _this.safeHTML(song.artist || '');
  },
  getLyric: function(song) {
    var _this = this;
    if ('lyric' in song) {
      _this.lyricParser.setLyric(song.lyric || '');
    } else {
      _this.lyricParser.setLyric();
      var cb = _this.options.lyricCallback;
      if (cb) {
        var current = _this.current;
        cb(extend({}, song), function(data) {
          if (current == _this.current && !song.lyric)
            _this.lyricParser.setLyric(song.lyric = data);
        });
      }
    }
  },
  play: function(i) {
    var _this = this;
    var song = _this.songs[Number(i)];
    if (!song)
      song = _this.songs[i = 0];
    if (!song) return;
    if(_this.current == i) {
      _this.audio.currentTime = 0;
    } else {
      var children = _this.playlist.childNodes;
      var last = children[_this.current];
      if(last) last.classList.remove('h5p-active');
      _this.current = i;
      children[i].classList.add('h5p-active');
      _this.audio.src = song.url;
      _this.duration = song.duration ? song.duration / 1000 : null;
      _this.showInfo(song);
    }
    _this.prtime.innerHTML = '';
    _this.prcur.style.left = 0;
    _this.brplayed.style.width = 0;
    _this.audio.play();
  },
  previous: function() {
    return (this.current + this.songs.length - 1) % this.songs.length;
  },
  next: function() {
    return (this.current + 1) % this.songs.length;
  },
  timestr: function(s) {
    if(isNaN(s)) return '??:??';
    var m = Math.floor(s / 60);
    s = Math.floor(s) % 60;
    if(s < 10) s = '0' + s;
    if(m < 10) m = '0' + m;
    return m + ':' + s;
  },
  destroy: function() {
    var _this = this;
    _this.lyricParser = null;
    _this.audio.src = '';
    _this.audio = null;
    _this.options.container.innerHTML = '';
    _this.options.container.classList.remove('h5p');
    var i = players.indexOf(this);
    if(i >= 0) players.splice(i, 1);
  },
};

!function (root, factory) {
  if (typeof module === 'object' && module.exports)
    module.exports = factory();
  else
    root.h5player = factory();
}(typeof window !== 'undefined' ? window : this, function () {
  return {
    Player: Player,
  };
});

}();
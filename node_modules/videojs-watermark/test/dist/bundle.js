(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
(function (global){
var topLevel = typeof global !== 'undefined' ? global :
    typeof window !== 'undefined' ? window : {}
var minDoc = require('min-document');

var doccy;

if (typeof document !== 'undefined') {
    doccy = document;
} else {
    doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'];

    if (!doccy) {
        doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'] = minDoc;
    }
}

module.exports = doccy;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"min-document":1}],3:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _videoJs = (typeof window !== "undefined" ? window['videojs'] : typeof global !== "undefined" ? global['videojs'] : null);

var _videoJs2 = _interopRequireDefault(_videoJs);

// Default options for the plugin.
var defaults = {
  position: 'top-right',
  fadeTime: 3000,
  url: undefined,
  image: undefined
};

/**
 * Sets up the div, img and optional a tags for the plugin.
 *
 * @function setupWatermark
 * @param    {Player} player
 * @param    {Object} [options={}]
 */
var setupWatermark = function setupWatermark(player, options) {
  // Add a div and img tag
  var videoEl = player.el();
  var div = document.createElement('div');
  var img = document.createElement('img');

  div.classList.add('vjs-watermark-content');
  div.classList.add('vjs-watermark-' + options.position);
  img.src = options.image;

  // if a url is provided make the image link to that URL.
  if (options.url) {
    var a = document.createElement('a');

    a.href = options.url;
    // if the user clicks the link pause and open a new window
    a.onclick = function (e) {
      e.preventDefault();
      player.pause();
      window.open(options.url);
    };
    a.appendChild(img);
    div.appendChild(a);
  } else {
    div.appendChild(img);
  }
  videoEl.appendChild(div);
};

/**
 * Fades the watermark image.
 *
 * @function fadeWatermark
 * @param    {Object} [options={
 *                  fadeTime:
 *                  'The number of milliseconds before the inital watermark fade out'}]
 */
var fadeWatermark = function fadeWatermark(options) {
  setTimeout(function () {
    return document.getElementsByClassName('vjs-watermark-content')[0].classList.add('vjs-watermark-fade');
  }, options.fadeTime);
};

/**
 * Function to invoke when the player is ready.
 *
 * This is a great place for your plugin to initialize itself. When this
 * function is called, the player will have its DOM and child components
 * in place.
 *
 * @function onPlayerReady
 * @param    {Player} player
 * @param    {Object} [options={}]
 */
var onPlayerReady = function onPlayerReady(player, options) {
  player.addClass('vjs-watermark');

  // if there is no image set just exit
  if (!options.image) {
    return;
  }
  setupWatermark(player, options);

  // Setup watermark autofade
  if (options.fadeTime === null) {
    return;
  }

  player.on('play', function () {
    return fadeWatermark(options);
  });
};

/**
 * A video.js plugin.
 *
 * In the plugin function, the value of `this` is a video.js `Player`
 * instance. You cannot rely on the player being in a "ready" state here,
 * depending on how the plugin is invoked. This may or may not be important
 * to you; if not, remove the wait for "ready"!
 *
 * @function watermark
 * @param    {Object} [options={}]
 *           An object of options left to the plugin author to define.
 */
var watermark = function watermark(options) {
  var _this = this;

  this.ready(function () {
    onPlayerReady(_this, _videoJs2['default'].mergeOptions(defaults, options));
  });
};

// Register the plugin with video.js.
_videoJs2['default'].registerPlugin('watermark', watermark);

// Include the version number.
watermark.VERSION = '2.0.0';

exports['default'] = watermark;
module.exports = exports['default'];

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],4:[function(require,module,exports){
(function (global){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _globalDocument = require('global/document');

var _globalDocument2 = _interopRequireDefault(_globalDocument);

var _qunit = (typeof window !== "undefined" ? window['QUnit'] : typeof global !== "undefined" ? global['QUnit'] : null);

var _qunit2 = _interopRequireDefault(_qunit);

var _sinon = (typeof window !== "undefined" ? window['sinon'] : typeof global !== "undefined" ? global['sinon'] : null);

var _sinon2 = _interopRequireDefault(_sinon);

var _videoJs = (typeof window !== "undefined" ? window['videojs'] : typeof global !== "undefined" ? global['videojs'] : null);

var _videoJs2 = _interopRequireDefault(_videoJs);

var _srcPlugin = require('../src/plugin');

var _srcPlugin2 = _interopRequireDefault(_srcPlugin);

var Player = _videoJs2['default'].getComponent('Player');

_qunit2['default'].test('the environment is sane', function (assert) {
  assert.strictEqual(typeof Array.isArray, 'function', 'es5 exists');
  assert.strictEqual(typeof _sinon2['default'], 'object', 'sinon exists');
  assert.strictEqual(typeof _videoJs2['default'], 'function', 'videojs exists');
  assert.strictEqual(typeof _srcPlugin2['default'], 'function', 'plugin is a function');
});

_qunit2['default'].module('videojs-watermark', {

  beforeEach: function beforeEach() {

    // Mock the environment's timers because certain things - particularly
    // player readiness - are asynchronous in video.js 5. This MUST come
    // before any player is created; otherwise, timers could get created
    // with the actual timer methods!
    this.clock = _sinon2['default'].useFakeTimers();

    this.fixture = _globalDocument2['default'].getElementById('qunit-fixture');
    this.video = _globalDocument2['default'].createElement('video');
    this.fixture.appendChild(this.video);
    this.player = (0, _videoJs2['default'])(this.video);
  },

  afterEach: function afterEach() {
    this.player.dispose();
    this.clock.restore();
  }
});

_qunit2['default'].test('registers itself with video.js', function (assert) {
  assert.expect(2);

  assert.strictEqual(typeof Player.prototype.watermark, 'function', 'videojs-watermark plugin was registered');

  this.player.watermark();

  // Tick the clock forward enough to trigger the player to be "ready".
  this.clock.tick(1);

  assert.ok(this.player.hasClass('vjs-watermark'), 'the plugin adds a class to the player');
});

_qunit2['default'].test('does not add image if not configued', function (assert) {
  assert.expect(2);

  assert.strictEqual(typeof Player.prototype.watermark, 'function', 'videojs-watermark plugin was registered');

  this.player.watermark();

  // Tick the clock forward enough to trigger the player to be "ready".
  this.clock.tick(1);

  assert.equal(0, this.player.contentEl().getElementsByClassName('vjs-watermark-content').length, 'The plugin should not add content to the player if no image is configued');
});

_qunit2['default'].test('does add image with correct path', function (assert) {
  var imageUrl = '/images/foo.png';

  assert.expect(5);

  assert.strictEqual(typeof Player.prototype.watermark, 'function', 'videojs-watermark plugin was registered');

  this.player.watermark({ image: imageUrl });

  // Tick the clock forward enough to trigger the player to be "ready".
  this.clock.tick(1);

  var imageContainer = this.player.contentEl().getElementsByClassName('vjs-watermark-content')[0];
  var image = imageContainer.getElementsByTagName('img')[0];

  assert.ok(imageContainer, 'The plugin should add content to the player if an image is configued');

  assert.ok(image.src.endsWith(imageUrl), 'This is not the correct image');

  assert.equal(0, imageContainer.getElementsByTagName('a').length, 'The plugin should not add a link unless there is a configured URL');

  assert.equal(imageContainer.id, '', 'the plugin doesn\'t add an ID to image container');
});

_qunit2['default'].test('does add a link when URL is configured', function (assert) {
  var imageUrl = '/images/foo.png';
  var linkUrl = '/some/path';

  assert.expect(6);

  assert.strictEqual(typeof Player.prototype.watermark, 'function', 'videojs-watermark plugin was registered');

  this.player.watermark({ image: imageUrl, url: linkUrl });

  // Tick the clock forward enough to trigger the player to be "ready".
  this.clock.tick(1);

  var imageContainer = this.player.contentEl().getElementsByClassName('vjs-watermark-content')[0];
  var image = imageContainer.getElementsByTagName('img')[0];
  var link = imageContainer.getElementsByTagName('a')[0];

  assert.ok(imageContainer, 'The plugin should add content to the player if an image is configued');

  assert.ok(image.src.endsWith(imageUrl), 'This is not the correct image');

  assert.equal(1, imageContainer.getElementsByTagName('a').length, 'The plugin should add a link since the URL is configued');

  assert.ok(link.href.endsWith(linkUrl), 'This is not the correct link');

  assert.equal(imageContainer.id, '', 'the plugin doesn\'t add an ID to image container');
});

_qunit2['default'].test('fades out after player is started', function (assert) {
  // GIVEN
  var imageUrl = '/images/foo.png';

  this.player.watermark({ image: imageUrl, fadeTime: 1 });
  this.clock.tick(1);

  // WHEN
  this.player.trigger('play');
  this.clock.tick(10);

  // THEN
  var imageContainer = this.player.contentEl().getElementsByClassName('vjs-watermark-content')[0];

  assert.ok(imageContainer.classList.contains('vjs-watermark-fade'));
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../src/plugin":3,"global/document":2}]},{},[4]);

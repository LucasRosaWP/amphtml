/**
* Copyright 2019 The AMP HTML Authors. All Rights Reserved.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS-IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

import {
  PlayingStates,
  VideoAttributes,
  VideoEvents,
} from '../../../src/video-interface';
import {Services} from '../../../src/services';

import {addParamToUrl} from '../../../src/url';
import {
  fullscreenEnter,
  fullscreenExit,
  isFullscreenElement,
} from '../../../src/dom';
import {
  installVideoManagerForDoc,
} from '../../../src/service/video-manager-impl';
import {isLayoutSizeDefined} from '../../../src/layout';
import {tryParseJson} from '../../../src/json';
import {user} from '../../../src/log';

/**
  * @typedef {{
  *  ampcontrols: boolean,
  *  autoplay: boolean,
  *  forceUrl4stat: string,
  *  target: string,
  *  clip: (!JsonObject|undefined),
  *  adv: (boolean|undefined),
  *  url: (string|undefined),
  *  title: (string|undefined),
  *  screenshot: (string|undefined),
  *  forcerelated: (boolean|undefined)
  *  hiderelated: (boolean|undefined)
  *  hideendscreen: (boolean|undefined)
  *  mediaEmbed: (string|undefined),
  *  extendedrelated: (boolean|undefined)
  *  skin: (!JsonObject|undefined),
  *  showlogo: (boolean|undefined)
  *  watermark: (boolean|undefined)
  *  qoeEventsConfig: (!JsonObject|undefined),
  *  advVastDuration: (number|undefined),
  *  vastTag: (string|undefined),
  *  embedTrackings: (!JsonObject|undefined),
  *  id: (string|undefined),
  *  ampnoaudio: (boolean|undefined)
  *  dock: (boolean|undefined),
  *  rotateToFullscreen: (boolean|undefined),
  * }}
  */
let AttributeOptionsDef;

/**
 * @class
 * @private
 */
class attributeParser {
  /**
     * @param {Element} element
     * @param {string} name
     * @param {function(string):T} parseFunction
     * @param {boolean=} opt_required
     * @return {T|undefined}
     * @template T
     */
  static parseAttribute(element, name, parseFunction, opt_required) {
    let value = element.getAttribute(name);

    if (value === '') {
      value = 'true';
    }

    if (!value) {
      user().assert(!opt_required, 'attribute %s is required', name);
      return;
    }
    return parseFunction(value);
  }

  /**
     * Method that parses a json object from the html attribute
     * specified in the name parameter
     * @param {Element} element
     * @param {string} name
     * @param {boolean} opt_required whether to throw an error when the attribute is absent
     *
     * @return {!JsonObject}
     */
  static parseJson(element, name, opt_required) {
    return this.constructor.parseAttribute(
        element,
        name,
        value => tryParseJson(decodeURIComponent(value)),
        opt_required,
    );
  }

  /**
     * Method that parses a boolean from the html attribute
     * specified in the name parameter
     * @param {Element} element
     * @param {string} name
     * @param {boolean} opt_required Specifies weather to throw and error when the attribute is not preset
     *
     * @return {boolean}
     */
  static parseBoolean(element, name, opt_required) {
    return this.constructor.parseAttribute(
        name,
        value => value.toLowerCase() === 'true',
        opt_required,
    );
  }

  /**
     * Method that parses a string from the html attribute
     * specified in the name parameter
     * @param {Element} element
     * @param {string} name
     * @param {boolean} opt_required Specifies weather to throw and error when the attribute is not preset
     *
     * @return {string}
     */
  static parseString(element, name, opt_required) {
    return this.constructor.parseAttribute(
        element,
        name,
        value => value,
        opt_required,
    );
  }

  /**
     * Method that parses a number from the html attribute
     * specified in the name parameter
     * @param {Element} element
     * @param {string} name
     * @param {boolean} opt_required Specifies weather to throw and error when the attribute is not preset
     *
     * @return {number}
     */
  static parseNumber(element, name, opt_required) {
    return this.constructor.parseAttribute(
        element,
        name,
        value => parseInt(value, 10),
        opt_required,
    );
  }

  /**
   * @description Method that parses attributes,
   * and ensures that all of the required parameters are present
  * @param {Element} element
   *
   * @return {!AttributeOptionsDef}
   */
  static parseAttributes(element) {
    const clip = this.constructor.parseJson('clip') || {};
    return {
      ampcontrols: true,
      forceUrl4stat: this.constructor.win.location.href,
      target: 'playerTarget',
      ...clip,
      adv: this.constructor.parseBoolean(element, 'adv'),
      url: this.constructor.parseString(element, 'url'),
      title: this.constructor.parseString(element, 'title'),
      screenshot: this.constructor.parseString(element, 'poster'),
      forcerelated: this.constructor.parseBoolean(element, 'forcerelated'),
      hiderelated: this.constructor.parseBoolean(element, 'hiderelated'),
      hideendscreen: this.constructor.parseBoolean(element, 'hideendscreen'),
      mediaEmbed: this.constructor.parseString(element, 'mediaEmbed'),
      extendedrelated: this.constructor.parseBoolean(
          element,
          'extendedrelated'),
      skin: this.constructor.parseJson(element, 'skin'),
      showlogo: this.constructor.parseBoolean(element, 'showlogo'),
      watermark: this.constructor.parseBoolean(element, 'watermark'),
      qoeEventsConfig: this.constructor.parseJson(element, 'qoeEventsConfig'),
      advVastDuration: this.constructor.parseNumber(element, 'advVastDuration'),
      vastTag: this.constructor.parseString(element, 'vastTag'),
      embedTrackings: this.constructor.parseJson(element, 'embedTrackings'),
      id: this.constructor.parseString(element, 'id'),

      autoplay: this.constructor.parseBoolean(
          element,
          VideoAttributes.AUTOPLAY) || false,
      ampnoaudio: this.constructor.parseBoolean(
          element,
          VideoAttributes.NO_AUDIO),
      dock: this.constructor.parseBoolean(element, VideoAttributes.DOCK),
      rotateToFullscreen: this.constructor.parseBoolean(
          element,
          VideoAttributes.ROTATE_TO_FULLSCREEN,
      ),
    };
  }
}

/** @implements {../../../src/video-interface.VideoInterface} */
export class AmpWpmPlayer extends AMP.BaseElement {
  /**
   * Method that sends postMessage to iframe that contains the player.
   * Message is prepended with proper header.
   * If the frame is not ready all messages will be saved in queue and
   * sent whe runQueue method is called.
   * @private
   * @param {string} name name of the command
   * @param {string} data optional data to send with the command
   * @param {boolean} skipQueue if this parameter is present the message will
   * send the command even when the frame is not read
   */
  sendCommand_(name, data, skipQueue = false) {
    if (this.frameReady_ || skipQueue) {
      this.contentWindow_.postMessage(data
        ? `${this.header_}${name}@PAYLOAD@${data}`
        : `${this.header_}${name}`, '*');
    } else {
      this.messageQueue_.push({name, data});
    }
  }

  /**
   * Method that sends messages that were saved in queue
   * @private
   */
  runQueue_() {
    while (this.messageQueue_.length) {
      const command = this.messageQueue_.shift();

      this.sendCommand_(command.name, command.data);
    }
  }

  /**
   * Method that adds a listener for messages from iframe
   * @private
   * @param {string} messageName Name of the message this callback listenes for
   * @param {function(string)} callback
   */
  addMessageListener_(messageName, callback) {
    this.messageListeners_.push(data => {
      const message = data.split('@PAYLOAD@');
      if (messageName === message[0]) {
        callback(message[1]);
      }
    });
  }

  /** @param {!AmpElement} element */
  constructor(element) {
    super(element);

    /** @private {!Element} */
    this.element_ = element;

    /** @private {!Array<Object<string, string>>} */
    this.messageQueue_ = [];

    /** @private {bool} */
    this.frameReady_ = false;

    /** @private {string} */
    this.playingState_ = PlayingStates.PAUSED;

    /** @private {!Array<function>} */
    this.messageListeners_ = [];

    /** @private {?Object} */
    this.attributes_;

    /** @private {string} */
    this.frameId_;

    /** @private {string} */
    this.frameUrl_;

    /** @private {string} */
    this.videoId_;

    /** @private {string} */
    this.header_;

    /** @private {element} */
    this.container_;

    /** @private {string} */
    this.placeholderUrl_;

    /** @private {element} */
    this.iframe_;

    /** @private {!Object} */
    this.contentWindow_;

    /** @private {number} */
    this.position_;

    /** @private {Array<Array<number>>} */
    this.playedRanges_;

    /** @private {Object} */
    this.metadata_;

    /** @private {!Window} */
    this.win;
  }

  /** @override */
  buildCallback() {
    const frameUrl = 'https://std.wpcdn.pl/wpjslib/AMP-270-init-iframe/playerComponentFrame.html';

    this.win.addEventListener('message', e => {
      if (typeof e.data === 'string' && e.data.startsWith(this.header_)) {
        const message = e.data.replace(this.header_, '');

        this.messageListeners_.forEach(listener => {
          listener(message);
        });
      }
    });

    this.attributes_ = attributeParser.parseAttributes(this.element_);

    this.frameId_ = this.attributes_.id || `${Math.random() * 10e17}`;
    this.frameUrl_ = addParamToUrl(frameUrl, 'frameId', this.frameId_);
    this.frameUrl_ = addParamToUrl(this.frameUrl_,
        'debug',
        'ampPlayerComponent');

    if (this.attributes_.url) {
      this.videoId_ = /mid=(\d*)/g.exec(this.attributes_.url)[1];
    } else {
      this.videoId_ = this.attributes_.clip;
    }

    if (!this.videoId_) {
      user().error('No clip specified');
    }
    this.header_ = `WP.AMP.PLAYER.${this.frameId_}.`;

    this.registerAction('showControls', () => { this.showControls(); });
    this.registerAction('hideControls', () => { this.hideControls(); });
    this.registerAction('getMetadata', () => { this.getMetadata(); });

    this.container_ = this.win.document.createElement('div');
    this.element_.appendChild(this.container_);

    this.placeholderUrl_ = this.attributes_.screenshot;
  }

  /** @override */
  isLayoutSupported(layout) {
    return isLayoutSizeDefined(layout);
  }

  /** @override */
  isInteractive() {
    return true;
  }

  /** @override */
  createPlaceholderCallback() {
    const placeholder = this.win.document.createElement('div');
    placeholder.setAttribute('placeholder', 'true');

    const image = this.win.document.createElement('amp-img');
    image.setAttribute('layout', 'fill');

    const urlService = Services.urlForDoc(this.element);
    const src = urlService.assertHttpsUrl(this.placeholderUrl_, this.element);
    image.setAttribute('src', src);

    placeholder.appendChild(image);
    return placeholder;
  }

  /** @override */
  layoutCallback() {
    const that = this;

    this.addMessageListener_('FRAME_READY', () => {
      that.contentWindow_ = that.iframe_
          .querySelector('iframe')
          .contentWindow;

      that.sendCommand_('init', JSON.stringify(that.attributes_), true);
    });

    this.addMessageListener_('PLAYER_READY', () => {
      that.frameReady_ = true;

      that.element_.dispatchCustomEvent(VideoEvents.LOAD);
      this.runQueue_();
      that.togglePlaceholder(false);
    });

    this.addMessageListener_('START_MOVIE', () => {
      that.element_.dispatchCustomEvent(VideoEvents.PLAYING);
      that.element_.dispatchCustomEvent(VideoEvents.RELOAD);
      that.playingState_ = PlayingStates.PLAYING_AUTO;
      that.togglePlaceholder(false);

    });

    this.addMessageListener_('USERPLAY', () => {
      that.element_.dispatchCustomEvent(VideoEvents.PLAYING);
      that.playingState_ = PlayingStates.PLAYING_MANUAL;
    });

    this.addMessageListener_('USERPAUSE', () => {
      that.element_.dispatchCustomEvent(VideoEvents.PAUSE);
      that.playingState_ = PlayingStates.PAUSED;
    });

    this.addMessageListener_('END_MOVIE', () => {
      that.element_.dispatchCustomEvent(VideoEvents.ENDED);
      that.playingState_ = PlayingStates.PAUSED;
    });

    this.addMessageListener_('START_ADV_QUEUE', () => {
      that.element_.dispatchCustomEvent(VideoEvents.AD_START);
      that.togglePlaceholder(false);
    });

    this.addMessageListener_('END_ADV_QUEUE', () => {
      that.element_.dispatchCustomEvent(VideoEvents.AD_END);
    });

    this.addMessageListener_('USER.ACTION', () => {
      if (that.playingState_ === PlayingStates.PLAYING_AUTO) {
        that.playingState_ = PlayingStates.PLAYING_MANUAL;
      }
    });

    this.addMessageListener_('POSITION', data => {
      that.position_ = parseInt(data, 10);
    });

    this.addMessageListener_('PLAYED.RANGES', data => {
      that.playedRanges_ = tryParseJson(data);
    });

    this.addMessageListener_('METADATA', data => {
      that.metadata_ = tryParseJson(data);
    });

    this.iframe_ = this.win.document.createElement('amp-iframe');
    this.iframe_.setAttribute('layout', 'fill');
    this.iframe_.setAttribute(
        'sandbox',
        'allow-scripts allow-same-origin allow-popups',
    );
    this.iframe_.setAttribute('src', this.frameUrl_.toLocaleString());
    this.iframe_.setAttribute('frameborder', 0);
    this.iframe_.setAttribute('allowfullscreen', true);

    const placeholder = this.win.document.createElement('amp-img');
    placeholder.setAttribute('layout', 'fill');
    placeholder.setAttribute('placeholder', '');
    if (this.placeholderUrl_) {
      placeholder.setAttribute('src', this.placeholderUrl_);
    }

    this.iframe_.appendChild(placeholder);
    this.container_.appendChild(this.iframe_);

    installVideoManagerForDoc(this.element_);
    Services.videoManagerForDoc(
        this.getAmpDoc(),
    ).register(this);

    this.element_.dispatchCustomEvent(VideoEvents.REGISTERED);
  }

  /** @override */
  supportsPlatform() {
    return true;
  }

  /** @override */
  unlayoutCallback() {
    if (this.iframe_) {
      this.removeElement(this.iframe_);
      this.iframe_ = null;
    }
    return true;
  }

  /** @override */
  preconnectCallback(onLayout) {
    this.preconnect.url(this.frameUrl_.toLocaleString(), onLayout);
  }

  /** @override */
  pauseCallback() {
    this.sendCommand_('pause');
  }

  /** @override */
  viewportCallback(visible) {
    this.element_.dispatchCustomEvent(VideoEvents.VISIBILITY, {visible});
  }

  /** @override */
  play(isAutoplay) {
    this.sendCommand_('play');

    this.playingState_ = isAutoplay
      ? PlayingStates.PLAYING_AUTO
      : PlayingStates.PLAYING_MANUAL;
  }

  /** @override */
  pause() {
    this.sendCommand_('pause');
    this.playingState_ = PlayingStates.PAUSED;
  }

  /** @override */
  mute() {
    this.sendCommand_('mute');
    this.element_.dispatchCustomEvent(VideoEvents.MUTED);
  }

  /** @override */
  unmute() {
    this.sendCommand_('unmute');
    this.element_.dispatchCustomEvent(VideoEvents.UNMUTED);
  }

  /** @override */
  showControls() {
    if (this.playingState_ === PlayingStates.PLAYING_AUTO) {
      this.sendCommand_('popupControls');
    } else {
      this.sendCommand_('showControls');
    }
  }

  /** @override */
  hideControls() {
    this.sendCommand_('hideControls');
  }

  /** @override */
  fullscreenEnter() {
    fullscreenEnter(this.iframe_);
  }

  /** @override */
  fullscreenExit() {
    fullscreenExit(this.iframe_);
  }

  /** @override */
  isFullscreen() {
    return isFullscreenElement(this.iframe_);
  }

  /** @override */
  getMetadata() {
    return this.metadata_;
  }

  /** @override */
  getCurrentTime() {
    return this.position_;
  }

  /** @override */
  getDuration() {
    return this.metadata_ ? this.metadata_.duration : undefined;
  }

  /** @override */
  getPlayedRanges() {
    return this.playedRanges_ || [];
  }

  /** @override */
  preimplementsAutoFullscreen() {
    return false;
  }

  /** @override */
  preimplementsMediaSessionAPI() {
    return false;
  }

  /** @override */
  firstLayoutCompleted() {
    // Do not hide the placeholder.
  }
}

AMP.extension('amp-wpm-player', '0.1', AMP => {
  AMP.registerElement('amp-wpm-player', AmpWpmPlayer);
});

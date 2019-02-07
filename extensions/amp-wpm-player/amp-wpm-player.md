<!--
Copyright 2019 The AMP HTML Authors. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS-IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->

# <a name="`amp-wpm-player`"></a> `amp-wpm-player`

<table>
  <tr>
    <td width="40%"><strong>Description</strong></td>
    <td>Displays a WP-media video player</td>
  </tr>
  <tr>
    <td width="40%"><strong>Required Script</strong></td>
    <td><code>&lt;script async custom-element="amp-form" src="https://cdn.ampproject.org/v0/amp-wpm-player-0.1.js">&lt;/script></code></td>
  </tr>
  <tr>
    <td class="col-fourty"><strong><a href="https://www.ampproject.org/docs/guides/responsive/control_layout.html">Supported Layouts</a></strong></td>
    <td>fill, fixed, fixed-height, flex-item, nodisplay, responsive TODO: check this</td>
  </tr>
  <tr>
    <td width="40%"><strong>Examples</strong></td>
    <td>FILL THIS IN</td>
  </tr>
</table>

## Example

```html
  <amp-wpm-player
    layout="responsive"
    width="1920"
    height="1080"
    id="wpmPlayer"
    url="https://wp.tv/?mid=2013067"
    autoplay
    adv
    extendedrelated
    forceliteembed
    controls
  >
    <div fallback>Cannot play video on this device.</div>
  </amp-wpm-player>
```

## Attributes

##### adv (optional)

If this attribute is present adds will be played before the video.
Defaults to `true` when set

##### url (optional)

Url to video material in one of the following domains:

* wptv
* youtube
* dailymotion
* liveleak
* tvp
* vimeo

Required if `clip` attribute is not present.

##### title (optional)

If this attribute is present, the title of the video will be overridden.

##### poster (optional)

If this attribute is present, it will override the default placeholder image.
The passed value should be an URL to an image.

##### clip (optional)

If this attribute is present, the data from the passed object will be added to attributes of players contructor. Passed value should be a valid JSON object.

Valuable object properties are:

* mid: number
* screenshot: string
* duration: number
* minimalAge: number
* title: string
* titleUrl: url
* description: string
* source: string
* tags: string
* advTags: string
* geoTargetAllow: boolean
* drastic: number
* adv: boolean
* url: array
* media: object
* transcription: array

If properties in clip object and html tag are present values from html tag take presidence.

The structure of this object is subject to change in the future.

required if `url` attribute is not present

##### forcerelated (optional)

If this attribute is present, after video finishes playing related videos will be from the specified list. Passed value should be a semicolon separated list of clip identifiers.

##### hiderelated (optional)

If this attribute is present, related videos won't be played after video finishes playing.
Defaults to `false`.

##### hideendscreen (optional)

If this attribute is present, the end screen won't be shown after the video.
Defaults to `false`.

##### mediaEmbed (optional)

Human readable name of a website the player is used on.
Defaults to `portalowy`.

##### extendedrelated (optional)

This attribute lets you override related material that's displayed under the video
Defaults to `true`.

##### skin (optional)

This attribute lets you override what player skin is used. Passed value should be a object with name and url properties.

##### showlogo (optional)

This attribute is used to disable WP logo in the corner of the video for livestreams.
Defaults to `true`.

##### watermark (optional)

This attribute is used to enable WP wathermark in the corner of the video.
Defaults to `false`.

##### qoeEventsConfig (optional)

Object passed with this attribute is used to configure que statistics.

##### advVastDuration (optional)

This attribute specifies how many of 15 second ad prerolls/midrolls can be present in a video.
Defaults to `2`.

##### vastTag (optional)

This attribute lets you specify an url to creation in VAST 2.0 standard.

##### embedTrackings (optional)

This attribute lets you specify additional custom VAST 2.0 trackings.

## Validation
See [amp-wpm-player rules](https://github.com/ampproject/amphtml/blob/master/extensions/amp-wpm-player/validator-amp-wpm-player.protoascii) in the AMP validator specification.

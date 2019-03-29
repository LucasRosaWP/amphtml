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

import '../amp-wpm-player';
import {attributeParser} from '../amp-wpm-player';

describes.realWin('amp-wpm-player', {
  amp: {
    extensions: ['amp-wpm-player'],
  },
  allowExternalResources: true,
}, env => {
  const defaultOptions = {
    layout: 'responsive',
    width: 1920,
    height: 1080,
    id: 'wpmPlayer',
    url: 'https://wp.tv/?mid=2013067',
    autoplay: 'true',
    adv: 'true',
    extendedrelated: 'false',
    forceliteembed: 'false',
  };

  let win;
  let doc;

  beforeEach(() => {
    win = env.win;
    doc = win.document;
  });

  const getWpmPlayer = attributes => {
    let attributeString = '';

    for (const key in attributes) {
      attributeString += `${key}="${attributes[key]}" `;
    }

    const div = document.createElement('div');
    div.innerHTML =
        `<amp-wpm-player ${attributeString}></amp-wpm-player>`.trim();
    const wpmp = div.firstChild;


    for (const key in attributes) {
      wpmp.setAttribute(key, attributes[key]);
    }

    doc.body.appendChild(wpmp);

    return wpmp
        .build()
        .then(() => wpmp.layoutCallback())
        .then(() => wpmp);
  };

  it('should render when correct media is specified', () => {
    const options = {...defaultOptions};

    return getWpmPlayer(options)
        .then(wpmp => {
          const iframe = wpmp.querySelector('div amp-iframe');

          expect(iframe).to.not.be.null;
        });
  });

  it('should fail if no media is specified', () => {
    const options = {...defaultOptions, ...{
      url: '',
    }};

    getWpmPlayer(options).should.eventually.be.rejectedWith(new Error('asdf'));
  });

  describe('attributeParser class', () => {
    let playerElement;

    beforeEach(() => {
      playerElement = document.createElement('amp-wpm-player');
    });

    describe('parseAttribute', () => {
      it('should default to true if attribute value is empty', () => {
        playerElement.setAttribute('test','');

        const result = attributeParser.parseAttribute(playerElement, 'test');

        expect(result).to.equal('true');
      });

      it('should return undefined if attribute is not present and not required', () => {
        const result = attributeParser.parseAttribute(playerElement, 'test');

        expect(result).to.be.undefined;
      });

      it('should throw if attirbute is not present and required', () => {
        expect(() => attributeParser.parseAttribute(playerElement, 'test', undefined, true)).to.throw();
      });

      it('should call parseFunction with attribute value as an argument', () => {
        const mockParseFunction = sinon.fake();

        playerElement.setAttribute('test','testvalue');

        attributeParser.parseAttribute(playerElement, 'test', mockParseFunction);

        expect(mockParseFunction.calledWith('testvalue')).to.equal(true);
      });
    });

    describe('parseBoolean', () => {
      it('should return true if attribute has no value', () => {
        playerElement.setAttribute('test','');

        const result = attributeParser.parseBoolean(playerElement, 'test');

        expect(result).to.be.true;
      });

      it('should return true if attribute value is true', () => {
        playerElement.setAttribute('test','true');

        const result = attributeParser.parseBoolean(playerElement, 'test');

        expect(result).to.be.true;
      });

      it('should return undefined value if attribute is not preset', () => {
        const result = attributeParser.parseBoolean(playerElement, 'test');

        expect(result).to.be.undefined;
      });

      it('should return false value if attribute value is false', () => {
        playerElement.setAttribute('test','false');

        const result = attributeParser.parseBoolean(playerElement, 'test');

        expect(result).to.be.false;
      });
    });

    describe('parseJson', () => {
      it('should return an object when given valid json', () => {
        const testObject = {test: 1};
        playerElement.setAttribute('test', JSON.stringify(testObject));

        const result = attributeParser.parseJson(playerElement, 'test');

        expect(result).to.deep.equal(testObject);
      });

      it('should throw an exception when given invalid json', () => {
        playerElement.setAttribute('test', JSON.stringify('someInvalidJSON'));

        expect(() => attributeParser.parseJson(playerElement, 'test')).to.throw;
      });

      it('should return undefined if attribute has no value', () => {
        playerElement.setAttribute('test', '');

        const result = attributeParser.parseJson(playerElement, 'test', true);

        expect(result).to.be.undefined;
      });

      it('should return undefined if attribute is not set', () => {
        const result = attributeParser.parseJson(playerElement, 'test');

        expect(result).to.be.undefined;
      });

    });

    describe('parseString', () => {
      it('should return a string when attributes value is a string', () => {
        playerElement.setAttribute('test', 'testString');

        const result = attributeParser.parseString(playerElement, 'test');

        expect(result).to.be.a('string');
        expect(result).to.be.equal('testString');
      });

      it('should return empty string when attribute has no value', () => {
        playerElement.setAttribute('test', '');

        const result = attributeParser.parseString(playerElement, 'test');

        expect(result).to.equal('');
      });

      it('should return undefined when attribute is not set', () => {
        const result = attributeParser.parseString(playerElement, 'test');

        expect(result).to.be.undefined;
      });
    });

    describe('parseNumber', () => {
      it('should return undefined when attribute is not set', () => {
        // playerElement.setAttribute('test', 'testString');

        const result = attributeParser.parseNumber(playerElement, 'test');

        expect(result).to.be.undefined;
      });

      it('should return undefined when attribute has no value', () => {
        playerElement.setAttribute('test', '');

        const result = attributeParser.parseNumber(playerElement, 'test');

        expect(result).to.be.undefined;
      });

      it('should return a number when attribute value is a number', () => {
        playerElement.setAttribute('test', 1234);

        const result = attributeParser.parseNumber(playerElement, 'test');

        expect(result).to.be.a('number');
        expect(result).to.equal(1234);
      });

      it('should throw an exception when given invalid number', () => {
        playerElement.setAttribute('test', JSON.stringify('test'));

        expect(() => attributeParser.parseNumber(playerElement, 'test')).to.throw;
      });
    });

    describe('parseAttributes', () => {
      it('should return object with reqired fields when given an element with no valid attributes', () => {
        // playerElement.setAttribute('test', 'testString');
        const mockWindow = {
          location: {
            href: 'testLocation',
          },
        };

        const result = attributeParser.parseAttributes(mockWindow, playerElement);

        expect(result).to.deep.equal({
          ampcontrols: true,
          forceUrl4stat: mockWindow.location.href,
          target: 'playerTarget',
          forceliteembed: false,
        });
      });
    });
  });

  describe('video interface methods', () => {
    function stubPostMessage(videoIframe) {
      return env.sandbox./*OK*/stub(
          videoIframe.implementation_,
          'sendCommand_'
      );
    }

    const implementedVideoInterfaceMethods = [
      'play',
      'pause',
      'mute',
      'unmute',
      'hideControls',
      'showControls',
    ];

    implementedVideoInterfaceMethods.forEach(method => {
      describe(`#${method}`, () => {
        const lowercaseMethod = method.toLowerCase();

        it(`should post '${lowercaseMethod}'`, () => {
          const options = {...defaultOptions};

          return getWpmPlayer(options)
              .then(wpmp => {
                const postMessage = stubPostMessage(wpmp);
                wpmp.implementation_[method]();

                expect(postMessage).to.have.been.calledOnce;
              });
        });
      });
    });
  });
});

'use strict';

/**
Copyright 2016 Split Software

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
**/

var parser = require('../../../lib/parser');
var tape = require('tape');

tape('PARSER / if user is in segment all 100%:on', function (assert) {
  var _parser = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        matcherType: 'ALL_KEYS',
        negate: false,
        userDefinedSegmentMatcherData: null,
        whitelistMatcherData: null
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 100
    }]
  }]);

  var evaluator = _parser.evaluator;
  var segments = _parser.segments;


  assert.true(evaluator('a key', 31) === 'on', "evaluation should throw 'on'");
  assert.true(segments.size === 0, 'there is no segment present in the definition');
  assert.end();
});

tape('PARSER / if user is in segment all 100%:off', function (assert) {
  var _parser2 = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        matcherType: 'ALL_KEYS',
        negate: false,
        userDefinedSegmentMatcherData: null,
        whitelistMatcherData: null
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 0
    }, {
      treatment: 'off',
      size: 100
    }]
  }]);

  var evaluator = _parser2.evaluator;
  var segments = _parser2.segments;


  assert.true(evaluator('a key', 31) === 'off', "evaluation should throw 'off'");
  assert.true(segments.size === 0, 'there is no segment present in the definition');
  assert.end();
});

tape("PARSER / if user is in segment ['u1', ' u2', ' u3', ' u4'] then split 100%:on", function (assert) {
  var _parser3 = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        matcherType: 'WHITELIST',
        negate: false,
        userDefinedSegmentMatcherData: null,
        whitelistMatcherData: {
          whitelist: ['u1', 'u2', 'u3', 'u4']
        }
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 100
    }]
  }]);

  var evaluator = _parser3.evaluator;
  var segments = _parser3.segments;


  assert.true(evaluator('a key', 31) === undefined, 'evaluation should throw undefined');
  assert.true(evaluator('u1', 31) === 'on', "evaluation should throw 'on'");
  assert.true(evaluator('u3', 31) === 'on', "should be evaluated to 'on'");
  assert.true(segments.size === 0, 'there is no segment present in the definition');
  assert.end();
});

tape('PARSER / given an unexpected structure, always evaluates to undefined', function (assert) {
  var _parser4 = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'attr'
        },
        matcherType: 'EQUAL_TO',
        negate: false,
        userDefinedSegmentMatcherData: null,
        whitelistMatcherData: null,
        unaryNumericMatcherData: {
          dataType: 'DATETIME',
          value: 1458240947021
        },
        betweenMatcherData: null
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 100
    }]
  }]);

  var evaluator = _parser4.evaluator;
  var segments = _parser4.segments;


  assert.equal(evaluator('test@split.io', 31), 'control', 'should evaluates to control');
  assert.equal(segments.size, 0, 'should return an empty segments set');
  assert.end();
});
//# sourceMappingURL=index.spec.js.map
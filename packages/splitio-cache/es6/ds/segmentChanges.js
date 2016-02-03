/* @flow */ 'use strict';

let log = require('debug')('splitio-cache:http');
let url = require('../url');

let segmentMutatorFactory = require('../mutators/segmentChanges');
let cache = new Map();

function cacheKeyGenerator(authorizationKey, segmentName) {
  return `${authorizationKey}/segmentChanges/${segmentName}`;
}

function segmentChangesDataSource({authorizationKey, segmentName}) {
  let cacheKey = cacheKeyGenerator(authorizationKey, segmentName);
  let sinceValue = cache.get(cacheKey) || 0;
  let nocache = Date.now();

  return fetch(url(`/segmentChanges/${segmentName}?since=${sinceValue}&_nocache=${nocache}`), {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authorizationKey}`
    }
  })
  .then(resp => resp.json())
  .then(json => {
    let {since, till, ...data} = json;

    cache.set(cacheKey, till);

    return segmentMutatorFactory( data );
  })
  .catch(error => {
    log(`[${authorizationKey}] failure fetching segment [${segmentName}] using since [${sinceValue}] => [${error}]`);

    return error;
  });
}

module.exports = segmentChangesDataSource;

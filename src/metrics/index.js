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

// @flow

'use strict';

const log = require('../utils/logger')('splitio-metrics');
const tracker = require('../utils/timeTracker');

const repeat = require('../utils/fn/repeat');

const metricsService = require('../services/metrics');
const metricsTimesServiceRequest = require('../services/metrics/times');
const metricsCountersServiceRequest = require('../services/metrics/counters');
const metricsDTO = require('../services/metrics/dto');

const impressionsService = require('../services/impressions');
const impressionsBulkRequest = require('../services/impressions/bulk');
const impressionsDTO = require('../services/impressions/dto');

const {
  SegmentChangesMetrics,
  SplitChangesMetrics,
  MySegmentsMetrics,
  SDKMetrics
} = require('./Logs');

const MetricsFactory = (settings: Object, storage: SplitStorage): Startable => {
  const pushMetrics = (): Promise<void> => {
    if (storage.metrics.isEmpty()) return Promise.resolve();

    log.info('Pushing metrics');
    tracker.start(tracker.C.METRICS_PUSH);

    // POST latencies
    const latenciesPromise = metricsService(
      metricsTimesServiceRequest(settings, {
        body: JSON.stringify(metricsDTO.fromLatenciesCollector(storage.metrics))
      }
    ))
    .then(() => storage.metrics.clear())
    .catch(() => storage.metrics.clear());

    // POST counters
    const countersPromise = metricsService(
      metricsCountersServiceRequest(settings, {
        body: JSON.stringify(metricsDTO.fromCountersCollector(storage.count))
      }
    ))
    .then(() => storage.count.clear())
    .catch(() => storage.count.clear());

    return Promise.all([latenciesPromise, countersPromise]).then(resp => {
      // After both finishes, track the end and return the results
      tracker.stop(tracker.C.METRICS_PUSH);
      return resp;
    });
  };

  const pushImpressions = (): Promise<void> => {
    if (storage.impressions.isEmpty()) return Promise.resolve();

    log.info(`Pushing ${storage.impressions.queue.length} impressions`);
    tracker.start(tracker.C.IMPRESSIONS_PUSH);

    return impressionsService(impressionsBulkRequest(settings, {
      body: JSON.stringify(impressionsDTO.fromImpressionsCollector(storage.impressions, settings))
    }))
    .then(() => {
      tracker.stop(tracker.C.IMPRESSIONS_PUSH);
      return storage.impressions.clear();
    })
    .catch(() => storage.impressions.clear());
  };

  let stopImpressionsPublisher = false;
  let stopPerformancePublisher = false;

  return {
    start() {
      stopImpressionsPublisher = repeat(
        schedulePublisher => pushImpressions().then(() => schedulePublisher()),
        settings.scheduler.impressionsRefreshRate
      );

      stopPerformancePublisher = repeat(
        schedulePublisher => pushMetrics().then(() => schedulePublisher()),
        settings.scheduler.metricsRefreshRate
      );
    },

    flush() {
      return pushImpressions();
    },

    stop() {
      stopImpressionsPublisher && stopImpressionsPublisher();
      stopPerformancePublisher && stopPerformancePublisher();
    },

    // Metrics trackers
    trackers: {
      segmentChangesMetrics: new SegmentChangesMetrics(storage),
      splitChangesMetrics: new SplitChangesMetrics(storage),
      mySegmentsMetrics: new MySegmentsMetrics(storage),
      sdkMetrics: new SDKMetrics(storage)
    }
  };
};

module.exports = MetricsFactory;

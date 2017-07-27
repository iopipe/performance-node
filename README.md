# Performance for Node.js

[![CircleCI](https://circleci.com/gh/iopipe/performance-node/tree/master.svg?style=svg)](https://circleci.com/gh/iopipe/performance-node/tree/master)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

A superset of the [User Timing API](https://developer.mozilla.org/en-US/docs/Web/API/User_Timing_API) (`window.performance`) for Node.js

Uses `process.hrtime` to capture marks + measures to gain deeper visibility into the timings that you define in your application.

0 Dependencies!

## Requirements
- Node >= `4.3.2`
- NPM >= `2.14.12`

## Install

With [yarn](https://yarnpkg.com) (recommended) in project directory:

`yarn add performance-node`

With npm in project directory:

`npm install performance-node`

Then, run your application:

```js
const Perf = require('performance-node');

const timeline = new Perf();

timeline.mark('foo-start');
// delay(10)
timeline.mark('foo-end');
timeline.measure('foo-measure', 'foo-start', 'foo-end');

const myMeasure = timeline.getEntriesByName('foo-measure')[0];
// {name: 'foo-measure', startTime: 1.2, duration: 10.5, entryType: 'measure'}
```

## Methods

```js
const Perf = require('performance-node');

const timeline = new Perf();

// set marks
timeline.mark('foo-start');
timeline.mark('foo-end');

// create a measurement
timeline.measure('foo-measure', 'foo-start', 'foo-end');

// get all timeline entries (marks + measures)
timeline.getEntries();

// get all entries with the same name
timeline.getEntriesByName('foo-start');

// get all entries with the same type
timeline.getEntriesByType('measure');

// clear marks
timeline.clearMarks();

// clear measures
timeline.clearMeasures();

// clear all entries
timeline.clear();

// get a point in time in milliseconds
timeline.now();
```

## Config

#### `offset` (number: optional)

By default, the `startTime` of each mark is calculated by subracting the construction time from `process.hrtime`. If you would rather the startTime map as closely as possible to `process.hrtime` values, set `offset: 0`. You can also supply any number as a custom offset.

```js
const Perf = require('performance-node');

const timeline = new Perf({ offset: 0 });

timeline.mark('foo-start');
// delay(10)
timeline.mark('foo-end');
timeline.measure('foo-measure', 'foo-start', 'foo-end');

const myMeasure = timeline.getEntriesByName('foo-measure')[0];
// {name: 'foo-measure', startTime: 227851.91, duration: 10.5, entryType: 'measure'}
```

#### `timestamp` (bool: optional = false)

Add a `timestamp` (unix epoch) value for each mark based on `Date.now()`.

```js
const Perf = require('performance-node');

const timeline = new Perf({ timestamp: true });

timeline.mark('foo-start');

const myMeasure = timeline.getEntriesByName('foo-start')[0];
// {name: 'foo-start', startTime: 1.2, duration: 0, entryType: 'mark', timestamp: 1501189303951}
```

## Contributing
- This project uses [Prettier](https://github.com/prettier/prettier). Please execute `npm run eslint -- --fix` to auto-format the code before submitting pull requests.

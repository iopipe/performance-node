import _ from 'lodash';
import delay from 'delay';

import Lib from './index';

test('Lib is a function', () => {
  expect(_.isFunction(Lib)).toBe(true);
});

test('Can use the new keyword', () => {
  const perf = new Lib();
  expect(perf).toBeTruthy();
});

test('Has initial values', () => {
  const perf = new Lib({ offset: 10 });
  expect(_.isArray(perf.data)).toBe(true);
  expect(_.isNumber(perf.offset)).toBe(true);
  expect(_.isNumber(perf.constructionTimeMillis)).toBe(true);
});

test('Has all methods', () => {
  const perf = new Lib();
  [
    'mark',
    'measure',
    'getEntries',
    'getEntriesByName',
    'getEntriesByType',
    'clearMarks',
    'clearMeasures',
    'clear',
    'now'
  ].forEach(str => {
    expect(_.isFunction(perf[str])).toBe(true);
  });
});

test('Can mark one', () => {
  const perf = new Lib();
  perf.mark('woot');
  const entries = perf.getEntries();
  expect(_.isArray(entries)).toBe(true);
  expect(entries).toHaveLength(1);
  const first = entries[0];
  expect(_.isPlainObject(first)).toBe(true);
  expect(_.isNumber(first.startTime)).toBe(true);
  expect(_.isNumber(first.duration)).toBe(true);
  expect(_.isString(first.name)).toBe(true);
  expect(first.timestamp).toBeUndefined();
});

test('Can mark multiple', async () => {
  const perf = new Lib();

  perf.mark('woot');
  await delay(90);
  perf.mark('woot2');

  const entries = perf.getEntries();

  expect(_.isArray(entries)).toBe(true);
  expect(entries).toHaveLength(2);

  const [m1, m2] = entries;
  const diff = m2.startTime - m1.startTime;
  expect(diff > 80 && diff < 100).toBe(true);
});

test('Order of marks is correct', () => {
  const perf = new Lib();

  perf.mark('foo');
  perf.mark('foo');
  perf.mark('bar');
  perf.mark('bar');
  perf.measure('baz', 'foo', 'bar');

  const [foo1, foo2, measure, bar1, bar2] = perf.getEntries();
  expect(foo1.name).toBe('foo');
  expect(foo2.name).toBe('foo');
  expect(measure.name).toBe('baz');
  expect(bar1.name).toBe('bar');
  expect(bar2.name).toBe('bar');
  expect(measure.duration).toEqual(bar2.startTime - foo2.startTime);
  expect(measure.timestamp).toBeUndefined();
});

test('Can clear marks, measures, and all items', () => {
  const perf = new Lib();

  perf.mark('woot');
  perf.mark('hooray');
  perf.measure('measure-1', 'woot', 'hooray');

  expect(perf.getEntries()).toHaveLength(3);

  perf.clearMarks();
  expect(perf.getEntries()).toHaveLength(1);

  perf.mark('wee');
  expect(perf.getEntries()).toHaveLength(2);

  perf.clearMeasures();
  expect(perf.getEntries()).toHaveLength(1);

  perf.mark('ding');
  perf.measure('measure-2', 'wee', 'ding');
  expect(perf.getEntries()).toHaveLength(3);

  perf.clear();
  expect(perf.getEntries()).toHaveLength(0);
});

test('Can use .now', () => {
  const perf = new Lib();

  const num = perf.now();

  expect(_.isNumber(num)).toBe(true);
});

test('Can use get* methods', () => {
  const perf = new Lib();

  perf.mark('woot');
  perf.mark('hooray');
  perf.measure('measure-1', 'woot', 'hooray');
  perf.mark('ding');
  perf.mark('woot');
  perf.measure('measure-2', 'woot', 'ding');

  expect(perf.getEntries()).toHaveLength(6);
  expect(perf.getEntriesByType('mark')).toHaveLength(4);
  expect(perf.getEntriesByType('measure')).toHaveLength(2);
  expect(perf.getEntriesByName('ding')).toHaveLength(1);
  expect(perf.getEntriesByName('woot')).toHaveLength(2);
});

test('No mark collisions', () => {
  const perf = new Lib();
  const timeline = new Lib();

  perf.mark('woot');
  perf.mark('wow');
  timeline.mark('ok');

  expect(perf.getEntries()).toHaveLength(2);
  expect(timeline.getEntries()).toHaveLength(1);
});

test('Measure without start mark uses construction time (with offset) perf.now() as measurement', async () => {
  const perf = new Lib();
  await delay(20);
  perf.measure('bad-measure');
  const { startTime, duration } = perf.getEntries()[0];
  expect(startTime).toBe(0);
  expect(_.inRange(duration, 15, 30)).toBe(true);
  perf.mark('ok');
  await delay(30);
  perf.measure('evil', undefined, 'ok');
  const { startTime: start2, duration: duration2 } = perf.getEntriesByName(
    'evil'
  )[0];
  expect(start2).toBe(0);
  expect(_.inRange(duration2, 45, 70)).toBe(true);
});

test('Measure with a start time but no end uses start time as beginning and now() as end', async () => {
  const perf = new Lib();
  await delay(10);
  perf.mark('start');
  await delay(20);
  perf.measure('measure', 'start');
  await delay(40);
  const { startTime, duration } = perf.getEntriesByName('measure')[0];
  expect(_.inRange(startTime, 5, 20)).toBe(true);
  expect(_.inRange(duration, 15, 30)).toBe(true);
});

test('The Lib uses a construction time offset by default', async () => {
  const start = process.hrtime();
  const perf = new Lib();
  await delay(10);
  const number = perf.now();
  const end = process.hrtime(start);
  expect(_.inRange(number, 5, 15)).toBe(true);

  // expect the Lib to report numbers that match hrTime functionality to within .5ms
  // this may be subject to environment quirks
  const hrMillis = (number, end[1] / 1e6);
  const diff = hrMillis - number;
  expect(_.isNumber(number)).toBe(true);
  expect(_.inRange(diff, -0.5, 0.5)).toBe(true);

  perf.mark('foo');
  await delay(10);
  perf.mark('bar');
  perf.measure('m1', 'foo', 'bar');
  // this duration could be slower in some environments
  const time = perf.getEntriesByName('m1')[0].duration;
  expect(_.inRange(time, 8, 20)).toBe(true);
});

test('The Lib uses the custom offset option properly, perf.now should be very similar to process.hrtime', () => {
  const perf = new Lib({ offset: 0 });
  const start = process.hrtime();
  const startMillis = start[0] * 1000 + start[1] / 1e6;
  const number = perf.now();
  expect(_.inRange(number, startMillis - 10, startMillis + 10)).toBe(true);
});

test('The Lib uses the timestamp option properly', async () => {
  const perf = new Lib({ timestamp: true });
  const before = Date.now() - 1;
  perf.mark('foo');
  await delay(10);
  perf.mark('bar');
  perf.measure('m1', 'foo', 'bar');
  const after = Date.now() + 1;
  const { timestamp } = perf.getEntries()[0];
  expect(_.isNumber(timestamp)).toBe(true);
  expect(_.inRange(timestamp, before, after)).toBe(true);
  const { timestamp: measureTimestamp } = perf.getEntriesByName('m1')[0];
  expect(measureTimestamp).toBe(timestamp);
});

test('The code is fast enough', async () => {
  const perf = new Lib();

  const start = process.hrtime();
  perf.mark('foo');
  await delay(10);
  const end = process.hrtime(start);
  perf.mark('bar');
  perf.measure('m1', 'foo', 'bar');
  // this duration could be slower in some environments
  const time = perf.getEntriesByName('m1')[0].duration;
  expect(_.inRange(time, 8, 20)).toBe(true);

  // expect the Lib to report numbers that match hrTime functionality to within .5ms
  // this may be subject to environment quirks
  const hrEndMillis = end[1] / 1e6;
  const diff = time - hrEndMillis;
  expect(_.inRange(diff, -0.5, 0.5)).toBe(true);
});

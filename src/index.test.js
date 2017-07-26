import _ from 'lodash';
import delay from 'delay';

import lib from './index';

test('Lib is a function', () => {
  expect(_.isFunction(lib)).toBe(true);
});

test('Can use the new keyword', () => {
  const perf = new lib();
  expect(perf).toBeTruthy();
});

test('Has initial values', () => {
  const perf = new lib();
  expect(_.isNumber(perf.constructionTime)).toBe(true);
});

test('Has all methods', () => {
  const perf = new lib();
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
  const perf = new lib();
  perf.mark('woot');
  const entries = perf.getEntries();
  expect(_.isArray(entries)).toBe(true);
  expect(entries.length).toBe(1);
  const first = entries[0];
  expect(_.isPlainObject(first)).toBe(true);
  expect(_.isNumber(first.startTime)).toBe(true);
  expect(_.isNumber(first.duration)).toBe(true);
  expect(_.isString(first.name)).toBe(true);
});

test('Can mark multiple', async () => {
  const perf = new lib();

  perf.mark('woot');
  await delay(90);
  perf.mark('woot2');

  const entries = perf.getEntries();

  expect(_.isArray(entries)).toBe(true);
  expect(entries.length).toBe(2);

  const [m1, m2] = entries;
  const diff = m2.startTime - m1.startTime;
  expect(diff > 80 && diff < 100).toBe(true);
});

test('Order of marks is correct', async () => {
  const perf = new lib();

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
});

test('Can clear marks, measures, and all items', async () => {
  const perf = new lib();

  perf.mark('woot');
  perf.mark('hooray');
  perf.measure('measure-1', 'woot', 'hooray');

  expect(perf.getEntries().length).toBe(3);

  perf.clearMarks();
  expect(perf.getEntries().length).toBe(1);

  perf.mark('wee');
  expect(perf.getEntries().length).toBe(2);

  perf.clearMeasures();
  expect(perf.getEntries().length).toBe(1);

  perf.mark('ding');
  perf.measure('measure-2', 'wee', 'ding');
  expect(perf.getEntries().length).toBe(3);

  perf.clear();
  expect(perf.getEntries().length).toBe(0);
});

test('Can use .now', async () => {
  const perf = new lib();

  const num = perf.now();

  expect(_.isNumber(num)).toBe(true);
});

test('Can use get* methods', async () => {
  const perf = new lib();

  perf.mark('woot');
  perf.mark('hooray');
  perf.measure('measure-1', 'woot', 'hooray');
  perf.mark('ding');
  perf.mark('woot');
  perf.measure('measure-2', 'woot', 'ding');

  expect(perf.getEntries().length).toBe(6);
  expect(perf.getEntriesByType('mark').length).toBe(4);
  expect(perf.getEntriesByType('measure').length).toBe(2);
  expect(perf.getEntriesByName('ding').length).toBe(1);
  expect(perf.getEntriesByName('woot').length).toBe(2);
});

test('No mark collisions', async () => {
  const perf = new lib();
  const timeline = new lib();

  perf.mark('woot');
  perf.mark('wow');
  timeline.mark('ok');

  expect(perf.getEntries().length).toBe(2);
  expect(timeline.getEntries().length).toBe(1);
});

test('The lib uses a construction time offset by default', async () => {
  const start = process.hrtime();
  const perf = new lib();
  await delay(10);
  const number = perf.now();
  const end = process.hrtime(start);
  expect(_.inRange(number, 5, 15)).toBe(true);

  // expect the lib to report numbers that match hrTime functionality to within .5ms
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

test('The lib uses the custom offset option properly, perf.now should be very similar to process.hrtime', async () => {
  const perf = new lib({ offset: 0 });
  const start = process.hrtime();
  const startMillis = start[0] * 1000 + start[1] / 1e6;
  const number = perf.now();
  expect(_.inRange(number, startMillis - 10, startMillis + 10)).toBe(true);
});

test('The code is fast enough', async () => {
  const perf = new lib();

  const start = process.hrtime();
  perf.mark('foo');
  await delay(10);
  const end = process.hrtime(start);
  perf.mark('bar');
  perf.measure('m1', 'foo', 'bar');
  // this duration could be slower in some environments
  const time = perf.getEntriesByName('m1')[0].duration;
  expect(_.inRange(time, 8, 20)).toBe(true);

  // expect the lib to report numbers that match hrTime functionality to within .5ms
  // this may be subject to environment quirks
  const hrEndMillis = end[1] / 1e6;
  const diff = time - hrEndMillis;
  expect(_.inRange(diff, -0.5, 0.5)).toBe(true);
});

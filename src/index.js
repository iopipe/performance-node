function hrMillis(time = process.hrtime(), offset = 0) {
  let arr = time;
  if (!(arr instanceof Array) || arr.length !== 2) {
    arr = process.hrtime();
  }
  const number = arr[0] * 1000 + arr[1] / 1e6;
  return number - offset;
}

function getOffset(timelineInstance) {
  const { offset, constructionTimeMillis } = timelineInstance;
  return typeof offset === 'number' ? offset : constructionTimeMillis;
}

function markData(timelineInstance, obj = {}) {
  const { data = [] } = timelineInstance;
  const defaultHrtime = process.hrtime();
  // set defaults
  const {
    name,
    startTime = hrMillis(defaultHrtime, getOffset(timelineInstance)),
    duration = 0,
    entryType = 'mark'
  } = obj;

  const item = {
    name,
    startTime,
    duration,
    entryType
  };

  return data.concat(item).sort((a, b) => a.startTime - b.startTime);
}

module.exports = class Timeline {
  constructor(kwargs = {}) {
    const startTime = process.hrtime();
    this.data = [];
    this.offset = kwargs.offset;
    this.constructionTimeMillis = hrMillis(startTime, getOffset(this));
    return this;
  }
  mark(name) {
    this.data = markData(this, { name });
  }
  getEntries() {
    return this.data.concat();
  }
  getEntriesByName(name) {
    return this.data.filter(obj => obj.name === name);
  }
  getEntriesByType(type) {
    return this.data.filter(obj => obj.entryType === type);
  }
  measure(name, startString, endString) {
    const startArr = this.getEntriesByName(startString);
    const startMark = startArr[startArr.length - 1] || {
      startTime: this.constructionTimeMillis - getOffset(this)
    };

    const endArr = this.getEntriesByName(endString);
    const fallbackEndMark = {
      startTime: this.now()
    };
    const endMark =
      (startString ? endArr[endArr.length - 1] : fallbackEndMark) ||
      fallbackEndMark;

    const duration = endMark.startTime - startMark.startTime;

    this.data = markData(this, {
      name,
      startTime: startMark.startTime,
      duration,
      entryType: 'measure'
    });
  }
  clearMarks() {
    this.data = this.data.filter(item => item.entryType !== 'mark');
  }
  clearMeasures() {
    this.data = this.data.filter(item => item.entryType !== 'measure');
  }
  clear() {
    this.data = [];
  }
  now() {
    return hrMillis(process.hrtime(), getOffset(this));
  }
};

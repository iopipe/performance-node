function hrMillis(time = process.hrtime(), offset = 0) {
  let arr = time;
  if (!(arr instanceof Array) || arr.length !== 2) {
    arr = process.hrtime();
  }
  const number = arr[0] * 1000 + arr[1] / 1e6;
  return number - offset;
}

function getOffset(timelineInstance) {
  const { offset, constructionTime } = timelineInstance;
  return typeof offset === 'number' ? offset : constructionTime;
}

function markData(timelineInstance, obj = {}) {
  const { data = [] } = timelineInstance;
  const hrArray = process.hrtime();
  // set defaults
  const {
    name,
    startTime = hrMillis(hrArray, getOffset(timelineInstance)),
    duration = 0,
    entryType = 'mark'
  } = obj;

  const item = {
    name,
    startTime,
    duration,
    entryType
  };

  const arr = data.concat();
  arr.push(item);
  return arr.sort((a, b) => a.startTime - b.startTime);
}

module.exports = class Timeline {
  constructor(kwargs = {}) {
    this.constructionTime = hrMillis();
    this.data = [];
    this.offset = kwargs.offset;
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
      startTime: this.constructionTime
    };

    const endArr = this.getEntriesByName(endString);
    const fallbackEndTime = process.hrtime();
    const endMark = endArr[endArr.length - 1] || {
      startTime: hrMillis(fallbackEndTime, getOffset(this))
    };

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

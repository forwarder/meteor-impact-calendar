var recompAtInterval = function(interval) {
  var comp = Tracker.currentComputation;
  if (comp.firstRun)
    comp.interval = setInterval(function() {
      if (comp.stopped) return clearInterval(comp.interval);
      comp.invalidate();
    }, interval);
};

ImpactDay = function(date, adjacent) {
  this.date = moment(date).startOf('day');
  this.day = this.date.date();
  this.adjacent = adjacent || false;
};

ImpactDay.prototype.isToday = function() {
  recompAtInterval(60000);
  return this.date.isSame(moment(), 'day');
};


ImpactDay.prototype.isAdjacent = function() {
  return this.adjacent;
};

ImpactMonth = function(date) {
  this.date = moment(date).startOf('month');
  this.month = this.date.month();
  this.name = this.date.format('MMMM');
};

ImpactMonth.prototype.isCurrent = function() {
  return this.date.isSame(moment(), 'month');
};

ImpactYear = function(date) {
  this.date = moment(date).startOf('year');
  this.year = this.date.year();
};

ImpactYear.prototype.isCurrent = function() {
  return this.date.isSame(moment(), 'year');
};

var defaults = {
  selected: null,
  showAdjacent: false,
  weekStart: 1,
  min: null,
  max: null
};

/**
 *
 */
ImpactCalendar = function(options) {
  if (! (this instanceof ImpactCalendar))
    return new ImpactCalendar(options);

  this.options = new ReactiveDict();

  this.dateDep = new Tracker.Dependency();
  this.cursorDep = new Tracker.Dependency();

  options = options || {};

  this.configure(_.defaults(options, defaults));

  /* All options except `startDate` are reactive */
  var startDate = options.startDate || this.date || new Date();
  this.cursor = moment(startDate).startOf('month');
};

ImpactCalendar.prototype.configure = function(key, value) {
  var options = {};

  if (!_.isObject(key)) {
    options[key] = value;
  } else {
    options = key;
  }

  if (options.selected) {
    this.select(options.selected);
  } else if (options.selected === null) {
    this.clear();
  }

  if (options.min instanceof Date) {
    this.min(options.min);
  } else if (options.min === null) {
    this.options.set('min', null);
  }

  if (options.max instanceof Date) {
    this.max(options.max);
  } else if (options.max === null) {
    this.options.set('max', null);
  }

  this.options.set(_.pick(options, _.keys(defaults)));
};

ImpactCalendar.prototype.selected = function() {
  if (Tracker.active)
    this.dateDep.depend();

  return this.date;
};

ImpactCalendar.prototype.select = function(date, follow) {
  date = moment(date);
  if (!this.date || !date.isSame(this.date, 'day')) {
    this.date = date;
    this.dateDep.changed();
  }
  if (follow !== false)
    this.set(date);
};

ImpactCalendar.prototype.isSelected = function(date) {
  var selected = this.selected();

  if (date instanceof ImpactDay)
    date = date.date;
  else
    date = moment(date);

  return selected && selected.isSame(date, 'day');
};

ImpactCalendar.prototype.clear = function() {
  this.date = null;
  this.dateDep.changed();
};

ImpactCalendar.prototype.get = function() {
  if (Tracker.active)
    this.cursorDep.depend();

  return this.cursor;
};

ImpactCalendar.prototype.set = function(date) {
  date = moment(date).startOf('month');
  if (!date.isSame(this.cursor)) {
    this.cursor = date;
    this.cursorDep.changed();
  }
};

ImpactCalendar.prototype.today = function(select) {
  var today = moment();
  this.set(today.clone());
  if (select !== false)
    this.select(today.clone());
};

ImpactCalendar.prototype.min = function(date) {
  var self = this;
  if (date instanceof Date) {
    return Tracker.nonreactive(function() {
      return self.options.set('min', date);
    });
  }
  return this.options.get('min');
};

ImpactCalendar.prototype.max = function(date) {
  var self = this;
  if (date instanceof Date) {
    return Tracker.nonreactive(function() {
      return self.options.set('max', date);
    });
  }
  return this.options.get('max');
};

ImpactCalendar.prototype.isEqual = function(value, type) {
  var selected = this.selected();
  return selected && selected.isSame(value, type);
};

ImpactCalendar.prototype.toDate = function() {
  var selected = this.selected();
  return selected && selected.toDate();
};

ImpactCalendar.prototype.toString = function() {
  var selected = this.selected();
  return selected && selected.format();
};

ImpactCalendar.prototype.toNumber = function() {
  var selected = this.selected();
  return selected && selected.valueOf();
};

ImpactCalendar.prototype.next = function(type, skip) {
  if (!_.contains(['days', 'months', 'years'], type)) {
    type = 'months';
  }
  this.cursor.add(skip || 1, type);
  this.cursorDep.changed();
};

ImpactCalendar.prototype.previous = function(type, skip) {
  if (!_.contains(['days', 'months', 'years'], type)) {
    type = 'months';
  }
  this.cursor.subtract(skip || 1, type);
  this.cursorDep.changed();
};

ImpactCalendar.prototype.year = function(year) {
  var self = this, date;
  if (year) {
    if (!self.cursor.isSame(year, 'year')) {
      self.cursor.year(year);
      self.cursorDep.changed();
    }
    date = this.cursor;
  } else {
    date = this.get();
  }
  return date.format('YYYY');
};

ImpactCalendar.prototype.month = function(month) {
  var self = this, date;
  if (month || month === 0) {
    if (!self.cursor.isSame(month, 'month')) {
      self.cursor.month(month);
      self.cursorDep.changed();
    }
    date = this.cursor;
  } else {
    date = this.get();
  }
  return date.format('MMMM');
};

ImpactCalendar.prototype.days = function() {
  var diff, i, days = [],
      showAdjacent = this.options.get('showAdjacent'),
      date = this.get(),
      startDate = date.clone().startOf('month'),
      endDate = date.clone().endOf('month');

  diff = date.weekday() - this.options.get('weekStart');
  if (diff < 0) diff += 7;

  for (i = 0; i < diff; i++) {
    if (showAdjacent) {
      days.push(new ImpactDay(startDate.clone().add(i - diff, 'days'), true));
    } else {
      days.push({});
    }
  }

  var day = startDate.clone();
  while (day.isBefore(endDate) || day.isSame(endDate, 'day')) {
    days.push(new ImpactDay(day.clone()));
    day.add(1, 'days');
  }

  while (days.length % 7 !== 0) {
    if (showAdjacent) {
      days.push(new ImpactDay(day.clone(), true));
      day.add(1, 'days');
    } else {
      days.push({});
    }
  }

  return days;
};

ImpactCalendar.prototype.weekDays = function() {
  var i,
      weekStart = this.options.get('weekStart'),
      weekDays = [];

  for (i = 0; i < 7; i++) {
    weekDays.push(moment().weekday(i).format('dd').charAt(0));
  }

  for (i = 0; i < weekStart; i++) {
    weekDays.push(weekDays.shift());
  }

  return weekDays;
};

ImpactCalendar.prototype.months = function() {
  var months = [],
      date = this.get();

  for (var i = 0; i < 12; i++) {
    months.push(new ImpactMonth(date.clone().month(i)));
  }

  return months;
};

ImpactCalendar.prototype.years = function() {
  var years = [],
      date = this.get();

  var startYear = date.clone().subtract(4, 'years');
  for (var i = 0; i < 9; i++) {
    years.push(new ImpactYear(startYear.clone().add(i, 'years')));
  }

  return years;
};

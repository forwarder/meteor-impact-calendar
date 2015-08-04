Package.describe({
  name: 'forwarder:impact-calendar',
  version: '0.0.1',
  summary: 'Reactive calendar abstraction for Meteor',
  git: 'https://github.com/forwarder/meteor-impact-calendar',
});

Package.onUse(function(api) {
  api.versionsFrom('1.0');

  api.use([
    'tracker',
    'reactive-dict',
    'momentjs:moment'
  ]);

  api.addFiles('lib/calendar.js');

  api.export('ImpactCalendar');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('forwarder:impact-calendar');
  api.addFiles('tests/tests.js');
});

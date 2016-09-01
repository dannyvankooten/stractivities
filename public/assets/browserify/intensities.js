'use strict';

var qwest = require('qwest');
var m = require('mithril');
var serialize = require('form-serialize');
var views = {
  analysis: require('./views/analysis.js'),
  activities: require('./views/activities.js')
};

var activities = [];
var maxHeartRate = 200;
var zones, totals, calculating;

function view() {
  var map = {
    3: Math.round(0.93 * maxHeartRate),
    2: Math.round(0.86 * maxHeartRate),
    1: Math.round(0.8 * maxHeartRate),
    0: Math.round(0.7 * maxHeartRate),
  };

  if( calculating ) {
    return [ views.analysis(m, map, totals, zones), m("p", m("a", { onclick: reset, href: "#" }, "Go back")) ];
  }

  return [
    m('form#activity-form', [

      // max HR input
      m("p", [
        m("label", "Max Heart Rate"),
        m("input", {
          type: "number",
          placeholder: "Max HR",
          max: 250, min: 60,
          value: maxHeartRate,
          onchange: function(e) { maxHeartRate = parseInt(e.target.value); }
        })
      ]),

      // button
      m("p", [
        m("button", {
          type: "button",
          onclick: aggregate
        }, "Analyse")
      ]),

      // activity list
      views.activities(m, activities),

      // button
      m("p", [
        m("button", {
          type: "button",
          onclick: aggregate
        }, "Analyse")
      ])

    ])
  ];
}

// translate a heart rate value to the corresponding zone
function getZoneForHeartRateValue(heartRate) {

  if( heartRate > ( 0.93 * maxHeartRate ) ) {
    return 4; // VO2 max
  } else if( heartRate > ( 0.88 * maxHeartRate ) ) {
    return 3; // Grey zone
  } else if( heartRate > ( 0.81 * maxHeartRate ) ) {
    return 2; // lactate treshold
  } else if( heartRate > ( 0.7 * maxHeartRate ) ) {
    return 1; // aerobic
  }

  return 0; // warm-up, cool-down, recovery
}

function aggregate() {
  var form = document.getElementById('activity-form');
  var data = serialize(form, { hash: true });
  calculating = true;

  for(var i=0; i < data.activities.length; i++) {
    var activityId = data.activities[i];
    var activity = getActivity(activityId);

    totals.distance += activity.distance;
    totals.movingTime += activity.moving_time;

    // query streams
    qwest.get('/api/activities/' + activityId + '/streams')
     .then(function(xhr, data) {
       // calculate heart rate zone
        for(var j=0; j < data.HeartRate.Data.length; j++) {
          var heartRate = data.HeartRate.Data[j];
          var zoneIndex = getZoneForHeartRateValue(heartRate);
          zones[zoneIndex]++;
          zones["total"]++;
          m.redraw();
        }
    });
  }

}

function reset() {
  zones = {
    4: 0,
    3: 0,
    2: 0,
    1: 0,
    0: 0,
    "total": 0
  };
  totals = {
    distance: 0,
    pace: 0,
    movingTime: 0
  };
  calculating = false;
  m.redraw();
}

function getActivity(id) {
  for( var i=0; i<activities.length; i++) {
    if(activities[i].id == id) {
      return activities[i];
    }
  }

  throw new Error("No activity with ID " + id);
}

// get all Strava activities
qwest.get('/api/activities')
 .then(function(xhr, data) {
    activities = data;
    m.redraw();
});

// init on load
window.onload = function() {
  reset();
  m.mount(document.getElementById('app'), { view: view })
}

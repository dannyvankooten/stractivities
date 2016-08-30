'use strict';

var qwest = require('qwest');
var L = require('leaflet');
var activities = [],
  locationData = [], ready = false, fetched = 0;
var map = L.map('mapid').setView([51.505, -0.09], 13);

L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/streets-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZHZrIiwiYSI6ImNpcmt3dnR2eTAwMjlocG0xMjNvaG56bmwifQ.5MgQ55ayiZvQz6pTJ9Yb4w')
  .addTo(map);


function gogogo() {
  qwest.get('/api/activities')
   .then(function(xhr, data) {
      activities = data;
      activities.forEach(getActivityData)
      map.panTo(activities[0].end_latlng)
    });
}

function getActivityData(activity) {
  qwest.get('/api/activities/' + activity.id + '/streams')
    .then(function(xhr, data) {
      // replace activity with detailed data
      locationData.push(data.Location.Data);

      console.log("Fetched " + locationData.length + " of " + activities.length + " activities.");

      if(locationData.length == activities.length) {
        plotActivities();
      }
    })
}

function plotActivities() {
  console.log("Plotting all activities.");
  var time = Date.now();
  var perSecond = 36;
  var polylines =[ ];

  // create polyline for each activity
  for( var j=0; j<locationData.length; j++) {
    var line = L.polyline([], {weight: 2, color: "red"}).addTo(map);
    polylines.push(line);
  }

  function tick() {
    var timeElapsed = Date.now() - time;
    var steps = timeElapsed * perSecond;
    var stillPlotting = false;

    if( steps > 0 ) {
      for( var j=0; j<locationData.length; j++) {
        for( var i=0; i<steps; i++) {

            // keep checking if we're done
            if(locationData[j].length == 0 ) {
              break;
            }

            var pos = locationData[j].shift();
            polylines[j].addLatLng(pos);
            stillPlotting = true;
          }
        }
    } else {
      stillPlotting = true;
    }

    console.log("Still plotting: " + stillPlotting);

    if( stillPlotting ) {
      time = Date.now();
      window.requestAnimationFrame(tick);
    }
  }

  tick();
}

window.gogogo = gogogo;
gogogo();

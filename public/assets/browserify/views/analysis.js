'use strict';

function percentage( value, total ) {
  if( ! value ) {
    return 0;
  }

  return Math.round(value / total * 100);
}

function ltrim(string, char) {
  while(string[0] === char) {
    string = string.substr(1, string.length-1);
  }

  return string;
}

module.exports = function( m, map, totals, zones ) {
  var zonePercentages = {
    0: percentage(zones[0], zones.total),
    1: percentage(zones[1], zones.total),
    2: percentage(zones[2], zones.total),
    3: percentage(zones[3], zones.total),
    4: percentage(zones[4], zones.total),
  };

  var pace = new Date(null);
  pace.setSeconds(totals.movingTime / ( totals.distance / 1000 ) );
  var movingTime = new Date(null);
  movingTime.setSeconds(totals.movingTime);

  var maxPace = new Date(null);
  maxPace.setSeconds(totals.maxSpeed * 1000 / 60);

  return [
    m("header.header", [
      m("h1", "Analysis")
    ]),

    m('div.row.medium-margin', [

      m('div.col.col-2', [
        m('span.number', [
          Math.round( totals.distance / 1000 ),
          m('span.unit', " km")
        ]),
        m('span.label', 'Distance')
      ]),

      m('div.col.col-2', [
        m('span.number', [
          ltrim(movingTime.toISOString().substr(11, 8), "0"),
          m('span.unit', "")
        ]),
        m('span.label', 'Moving Time')
      ]),

      m('div.col.col-2', [
        m('span.number', [
          ltrim(pace.toISOString().substr(14, 5),"0"),
          m('span.unit', '/km')
        ]),
        m('span.label', "Pace")
      ])

    ]),

    m('div.row.medium-margin', [

      m('div.col.col-2', [
        m('span.number', [
          totals.maxHeartRate,
          m('span.unit', " bpm")
        ]),
        m('span.label', 'Max Heart Rate')
      ]),

      m('div.col.col-2', [
        m('span.number', [
          ltrim(maxPace.toISOString().substr(14, 5),"0"),
          m('span.unit', '/km')
        ]),
        m('span.label', "Max Pace")
      ])

    ]),

    m("table.distribution-chart", [

      // zone 1
      m("tr", [
        m("td", "Z1"),
        m("td", "Recovery"),
        m("td", "< " + map[0] ),
        m("td.bolded", zonePercentages[0] + "%"),
        m("td", m( "div.bar", m("div.fill.z1", { style: "width: " + zonePercentages[0] + "%" })))
      ]),

      // zone 2
      m("tr", [
        m("td", "Z2"),
        m("td", "Aerobic"),
        m("td", map[0] + " - " + map[1] ),
        m("td.bolded", zonePercentages[1] + "%"),
        m("td", m( "div.bar", m("div.fill.z2", { style: "width: " + zonePercentages[1] + "%" })))
      ]),

      // zone 3
      m("tr", [
        m("td", "Z3"),
        m("td", "Tempo"),
        m("td", map[1] + " - " + map[2] ),
        m("td.bolded", zonePercentages[2] + "%"),
        m("td", m( "div.bar", m("div.fill.z3", { style: "width: " + zonePercentages[2] + "%" })))
      ]),

      // zone 4
      m("tr", [
        m("td", "Z4"),
        m("td", "DEATH"),
        m("td", map[2] + " - " + map[3] ),
        m("td.bolded", zonePercentages[3] + "%"),
        m("td", m( "div.bar",  m("div.fill.z4", { style: "width: " + zonePercentages[3] + "%" })))
      ]),

      // zone 5
      m("tr", [
        m("td", "Z5"),
        m("td", "VO2Max"),
        m("td", map[3] + " >" ),
        m("td.bolded", zonePercentages[4] + "%"),
        m("td", m( "div.bar", m("div.fill.z5", { style: "width: " + zonePercentages[4] + "%" })))
      ]),

    ])
  ];
}

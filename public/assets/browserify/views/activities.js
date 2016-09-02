'use strict'

var lastChecked;

function selectAll(e) {
  var elements = document.querySelectorAll('input[name="'+ e.target.getAttribute('data-name') +'"], input[data-name="'+ e.target.getAttribute('data-name') +'"]');
  for( var i=0; i<elements.length; i++) {
      elements[i].checked = e.target.checked;
  }
}

function selectMultiple(e) {
  if( e.shiftKey && lastChecked ) {
    var elements = document.querySelectorAll('input[name="'+ e.target.name +'"]');
    var inRange = false;

    // loop through similar elements on page
    for( var i=0; i<elements.length; i++) {

      // if in range, keep copying checked attribute
      if( inRange ) {
        elements[i].checked = e.target.checked;

        // move out of range if at first or last element
        if( elements[i].value === lastChecked.value || elements[i].value === e.target.value) {
          inRange = false;
        }
      } else if(elements[i].value === lastChecked.value || elements[i].value === e.target.value) {
        // if not,  keep checking if we're in range yet
        inRange = true;
      }
    }
  }

  // store reference to last checked element
  lastChecked = e.target;
}

module.exports = function(m, activities) {
  return m("table", [

    // table header
    m("thead", [
      m("tr", [
        m('th', m('input', {
          type: "checkbox",
          onclick: selectAll,
          "data-name": "activities[]",
          title: "Select all"
        })),
        m('th', 'Date'),
        m('th', 'Name'),
        m('th.hide-on-mobile', 'Duration'),
        m('th.hide-on-mobile', 'Avg HR')
      ])
    ]),

    // table data
    m("tbody", activities.map(function(a, i) {

        var date = new Date(a.start_date_local);

        return m("tr", [
          m('td', m("input", {
            type: "checkbox",
            name: "activities[]",
            value: a.id,
            onclick: selectMultiple,
          })),
          m("td.meta", date.toDateString()),
          m("td.strong", a.name),
          m("td.centered.hide-on-mobile", Math.round(a.elapsed_time/60) + " min"),
          m("td.centered.hide-on-mobile", Math.round(a.average_heartrate))
        ])
    })),

    // table header
    m("tfoot", [
      m("tr", [
        m('th', m('input', {
          type: "checkbox",
          onclick: selectAll,
          "data-name": "activities[]",
          title: "Select all"
        })),
        m('th', 'Date'),
        m('th', 'Name'),
        m('th.hide-on-mobile', 'Duration'),
        m('th.hide-on-mobile', 'Avg HR')
      ])
    ]),

  ]);
}

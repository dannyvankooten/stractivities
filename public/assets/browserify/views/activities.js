'use strict'

module.exports = function(m, activities) {
  return m("table", [
    // table header
    m("thead", [
      m("tr", [
        m('th', ''),
        m('th', 'Date'),
        m('th', 'Name'),
        m('th', 'Duration'),
        m('th', 'Avg HR')
      ])
    ]),

    // table data
    m("tbody", activities.map(function(a, i) {

        var date = new Date(a.start_date_local);

        return m("tr", [
          m('td', m("input", { type: "checkbox", name: "activities[]", value: a.id, checked: i < 6 ? true : false })),
          m("td.meta", date.toDateString()),
          m("td.strong", a.name),
          m("td.centered", Math.round(a.elapsed_time/60) + " min"),
          m("td.centered", Math.round(a.average_heartrate))
        ])
    }))

  ]);
}

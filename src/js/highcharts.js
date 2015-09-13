/**
 * @file Contains code specific to implementing Highcharts charts.
 */

Highcharts.setOptions({
  global: {
    useUTC: false
  }
});

var makeTempGauges = function (current) {
  makeTempGauge('#aux_2_g', (current.aux_2 !== '') ? parseFloat(current.aux_2) : 0, 'Water Temperature');
  makeTempGauge('#stor_t_g', (current.stor_t !== '') ? parseFloat(current.stor_t) : 0, 'Storage Temperature');
  makeTempGauge('#coll_t_g', (current.coll_t !== '') ? parseFloat(current.coll_t) : 0, 'Collector Temperature', 250);
  makeTempGauge('#ambient_t_g', parseFloat(current.ambient_t.replace(/\s+/, '')), 'Ambient Temperature', 140);
};

var makeTempGauge = function (element, value, title, max) {
  max = max || 200;

  $(element).highcharts({
    chart: {
      type: 'solidgauge'
    },
    credits: {
      enabled: false
    },
    pane: {
      center: ['50%', '85%'],
      size: '100%',
      startAngle: -90,
      endAngle: 90,
      background: {
        backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || '#EEE',
        innerRadius: '60%',
        outerRadius: '100%',
        shape: 'arc'
      }
    },
    plotOptions: {
      solidgauge: {
        dataLabels: {
          y: 5,
          borderWidth: 0,
          useHTML: true
        }
      }
    },
    title: null,
    tooltip: {
      enabled: false
    },
    yAxis: {
      min: 0,
      max: max,
      stops: [
        [0.3, '#00ccff'],  // pale blue
        [0.5, '#cccc00'],  // yellow greenish
        [0.7, '#ffcc00'],   // orangeish
        [0.9, '#ff3300']   // redish
      ],
      lineWidth: 0,
      minorTickInterval: null,
      tickPositions: [0, max],
      tickWidth: 0,
      title: {
        text: title,
        y: -70
      },
      labels: {
        y: 15
      }
    },
    series: [{
      data: [value],
      dataLabels: {
        formatter: function () {
          return '<div class="temp">' + Highcharts.numberFormat(this.y,1) + '&deg;</div>';
        }
      }
    }]
  });
};

var makeGraph = function (element, data) {
  $(element).highcharts({
    chart: {
      borderColor: '#ccc',
      borderRadius: 4,
      borderWidth: 1,
      type: 'line',
      zoomType: 'x'
    },
    plotOptions: {
      line: {
        marker: {
          enabled: false
        }
      }
    },
    title: null,
    tooltip: {
      valueSuffix: '°F'
    },
    xAxis: {
      type: 'datetime',
      plotBands: getPlotBands()
    },
    yAxis: {
      title: {
        text: 'Temperature (°F)'
      },
      plotLines: [
        {
          color: '#aaa',
          dashStyle: 'LongDash',
          value: 120,
          width: '1'
        },
        {
          color: 'red',
          dashStyle: 'LongDash',
          value: 160,
          width: '1'
        }
      ]
    },
    series: [
      {
        name: 'Water Temp',
        data: getDataArray('aux_2'),
        color: '#4da64d',
        zIndex: 5
      },
      {
        name: 'Storage Temp',
        data: getDataArray('stor_t'),
        color: '#aed6f6',
        zIndex: 4
      },
      {
        name: 'Collector Temp',
        data: getDataArray('coll_t'),
        color: '#ebc03f',
        zIndex: 3
      },
      {
        name: 'Return Temp',
        data: getDataArray('aux_1'),
        color: '#ebc03f',
        dashStyle: 'shortdot',
        zIndex: 2
      },
      {
        name: 'Ambient Temp',
        data: getDataArray('ambient_t'),
        color: '#933feb',
        zIndex: 1
      },
      {
        name: 'Pump Status',
        data: getDataArray('pump'),
        showInLegend: false,
        visible: false
      },
      {
        name: 'Upper Limit Status',
        data: getDataArray('uplim'),
        showInLegend: false,
        visible: false
      }
    ]
  });

  function getPlotBands () {
    var returnArray = [];

    for (var x = data.length - 1; x >= 0; x--) {
      if (x > 0 && (data[x].pump === 'ON' || data[x].uplim === 'ON')) {
        var timestamp = Date.parse(data[x].timestamp);
        var next_timestamp = Date.parse(data[x-1].timestamp);

        if (next_timestamp - timestamp < 11 * 60 * 1000) { // max 10 minute interval
          returnArray.push({
            color: (data[x].pump === 'ON') ? 'aliceblue' : '#ffeedd',
            from: timestamp,
            to: next_timestamp
          });
        }
      }
    }

    return returnArray;
  }

  function getDataArray (key) {
    var returnArray = [];

    for (var x = data.length - 1; x >= 0; x--) {
      var timestamp = Date.parse(data[x].timestamp);
      var number = parseFloat(data[x][key].replace(/\s+/, ''));

      if (key === 'pump' || key === 'uplim') {
        number = (data[x][key] === 'ON') ? 1 : 0;
      }

      returnArray.push([
        timestamp,
        (isNaN(number)) ? null : number
      ]);

      // Block out sections where there appears to be an outage
      if (x > 0) {
        var next_timestamp = Date.parse(data[x-1].timestamp);

        if (next_timestamp - timestamp > 11 * 60 * 1000) { // max 10 minute interval
          returnArray.push([
            Date.parse((timestamp + next_timestamp) / 2),
            null
          ]);
        }
      }
    }

    return returnArray;
  }
};

var updateGraph = function (element, data) {
  var chart = $(element).highcharts();

  for (var x = data.length - 1; x >= 0; x--) {
    chart.series[0].addPoint(getDataAndTimestamp('aux_2', x), true, true);
    chart.series[1].addPoint(getDataAndTimestamp('stor_t', x), true, true);
    chart.series[2].addPoint(getDataAndTimestamp('coll_t', x), true, true);
    chart.series[3].addPoint(getDataAndTimestamp('aux_1', x), true, true);
    chart.series[4].addPoint(getDataAndTimestamp('ambient_t', x), true, true);

    var last_timestamp = chart.series[5].points[chart.series[5].points.length - 1].x;
    var last_pump_status = chart.series[5].points[chart.series[5].points.length - 1].y;
    var last_uplim_status = chart.series[6].points[chart.series[6].points.length - 1].y;

    if (last_pump_status === 1 || last_uplim_status === 1) {
      chart.xAxis[0].addPlotBand({
        from: last_timestamp,
        to: Date.parse(data[x].timestamp),
        color: (last_pump_status === 1) ? 'aliceblue' : '#ffeedd',
      });
    }

    chart.series[5].addPoint(getDataAndTimestamp('pump', x), true, true);
    chart.series[6].addPoint(getDataAndTimestamp('uplim', x), true, true);
  }

  function getDataAndTimestamp (key, index) {
    var timestamp = Date.parse(data[index].timestamp);
    var number = parseFloat(data[index][key].replace(/\s+/, ''));

    return [
      timestamp,
      (isNaN(number)) ? null : number
    ];
  }
};
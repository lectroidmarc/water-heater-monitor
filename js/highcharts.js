/**
 *
 */

Highcharts.setOptions({
  global: {
    useUTC: false
  }
});

var makeTempGuage = function (element, value, title, max) {
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
      }
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
      }
    ]
  });

  function getPlotBands () {
    var returnArray = [];

    for (var x = data.length - 1; x >= 0; x--) {
      if (x > 0 && (data[x].pump == 'ON' || data[x].uplim == 'ON')) {
        var timestamp = Date.parse(data[x].timestamp);
        var next_timestamp = Date.parse(data[x-1].timestamp);

        if (next_timestamp - timestamp < 11 * 60 * 1000) { // max 10 minute interval
          returnArray.push({
            color: (data[x].pump == 'ON') ? 'aliceblue' : '#ffeedd',
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
      var number = parseFloat(data[x][key]);

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

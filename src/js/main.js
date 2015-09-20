/**
 * @file Contains the main functions supporting the Water Heater Monitor
 * web page.
 */

var phant;
var page;
var wu;

var init = function () {
  $('a[data-toggle="tab"]').on('shown.bs.tab', onTabChange);
  $('#settings form').on('submit', onSettingsSubmit);

  $('.previous').on('click', onPageBack);
  $('.next').on('click', onPageForward);

  init_phant();
  init_weather();
};

var init_phant = function () {
  var saved_phant_settings = JSON.parse(window.localStorage.getItem('phant_settings'));

  if (saved_phant_settings) {
    $('#phant_url').val(saved_phant_settings.url);
    $('#phant_public_key').val(saved_phant_settings.public_key);

    showAlert('Loading...', {faClass: 'refresh', faSpin: true});

    phant = new Phant(saved_phant_settings);
    page = 1;
    phant.fetch({
      page: page
    }, onPhantFetch, onPhantError);
  } else {
    $('#tabs a:last').tab('show');
  }
};

var init_weather = function () {
  var saved_wu_settings = JSON.parse(window.localStorage.getItem('wu_settings'));
  if (saved_wu_settings && saved_wu_settings.api_key && saved_wu_settings.location) {
    $('#wu_api_key').val(saved_wu_settings.api_key);
    $('#wu_location').val(saved_wu_settings.location);

    wu = new WeatherUnderground({
      api_key: saved_wu_settings.api_key,
      location: saved_wu_settings.location
    });
    wu.conditions(onWeatherConditions);
  }
};

var onPageBack = function (e) {
  e.preventDefault();
  $('.pager li').addClass('disabled');

  page++;
  phant.fetch({
    page: page
  }, onPhantPage, onPhantError);
};

var onPageForward = function (e) {
  e.preventDefault();

  if (page > 1) {
    $('.pager li').addClass('disabled');

    page--;
    phant.fetch({
      page: page
    }, onPhantPage, onPhantError);
  }
};

var onTabChange = function (e) {
  switch ($(e.target).attr('href')) {
    case '#home':
      init_phant();
      init_weather();
      break;
    case'#update':
      break;
    case'#settings':
      $('#update .result').hide();
      break;
  }
};

var onSettingsSubmit = function (e) {
  e.preventDefault();

  window.localStorage.setItem('phant_settings', JSON.stringify({
    url: $('#phant_url').val(),
    public_key: $('#phant_public_key').val()
  }));

  window.localStorage.setItem('wu_settings', JSON.stringify({
    api_key: $('#wu_api_key').val(),
    location: $('#wu_location').val()
  }));

  $('#tabs a:first').tab('show');
};

var onPhantFetch = function (data) {
  //console.log(data);

  phant.getStats(onPhantStats);

  if (data.message) {
    showAlert(data.message, { alertClass: 'danger', faClass: 'warning' });
  } else {
    if (data.length > 0) {
      $('.pager').show();

      var cleanData = data.filter(function (reading) {
        return reading.runtime.indexOf(':') !== -1;
      });

      var current = cleanData[0];

      showStatus(current);
      makeTempGauges(current);
      makeGraph('#plot', cleanData);

      //phant.enableRealtime(onPhantRealtime);
      phant.startPolling({}, onPhantPolled);
    } else {
      clearAlerts();
    }
  }
};

var onPhantPage = function (data) {
  $('.pager li > a').blur();
  $('.pager li').removeClass('disabled');
  $('.pager .next').toggleClass('disabled', page === 1);

  if (data.message) {
    showAlert(data.message, { alertClass: 'danger', faClass: 'warning' });
  } else {
    var cleanData = data.filter(function (reading) {
      return reading.runtime.indexOf(':') !== -1;
    });

    makeGraph('#plot', cleanData);
  }
};

var onPhantError = function (req) {
  showAlert('A network error occured', { alertClass: 'danger', faClass: 'warning' });
};

//var onPhantRealtime = function (data) {
//  console.log(data);
//};

var onPhantPolled = function (data) {
  //console.log(data);

  if (data.message) {
    showAlert(data.message, { alertClass: 'danger', faClass: 'warning' });
  } else if (data.length > 0) {
    var current = data[0];

    showStatus(current);
    makeTempGauges(current);

    if (page === 1) {
      updateGraph('#plot', data);
    }

    if (wu) {
      wu.conditions(onWeatherConditions);
    }
  }
};

var onPhantStats = function (data) {
  //console.log(data);

  var percentage = data.used / data.cap * 100;

  $('.stats').attr('title', percentage.toFixed(2) + '% space used.');
  $('.stats .progress-bar').css({
    width: percentage.toFixed(2) + '%'
  });
};

var showStatus = function (current) {
  var last_update_timestamp = Date.parse(current.timestamp);
  var out_of_date = (Date.now() - last_update_timestamp > 11 * 60 * 1000) ? true : false; // max 10 minute interval
  var system_is_off = (current.coll_t === '' && current.stor_t === '' && current.aux_1 === '' && current.aux_2 === '') ? true : false;

  if (out_of_date) {
    var last_update = new Date(last_update_timestamp);
    showAlert('Monitor appears offline.  Last update at <strong>' + last_update.toLocaleString() + '</strong>', { alertClass: 'danger', faClass: 'warning' });
  } else if (system_is_off) {
    showAlert('System is OFF', { alertClass: 'gray', faClass: 'power-off' });
  } else if (current.uplim === 'ON') {
    showAlert('High Limit hit', { alertClass: 'warning', faClass: 'warning' });
  } else if (current.pump === 'ON') {
    showAlert('Pump is ON', { alertClass: 'success', faClass: 'check' });
  } else {
    showAlert('Pump is OFF', { alertClass: 'info', faClass: 'power-off' });
  }

  if (system_is_off) {
    $('.hidden-xs-systemoff').addClass('off');
  } else {
    $('.hidden-xs-systemoff').removeClass('off');
  }
};

var showAlert = function (message, opts) {
  clearAlerts();

  if (typeof opts === 'undefined') { opts = {}; }

  var alert = $('<div/>').addClass('status alert alert-' + (opts.alertClass || 'info')).appendTo('#alerts');
  if (opts.glyphiconClass || opts.faClass) {
    var icon = $('<span/>').attr('aria-hidden', 'true').appendTo(alert);

    if (opts.glyphiconClass) {
      icon.addClass('glyphicon glyphicon-' + opts.glyphiconClass);
    }
    if (opts.faClass) {
      icon.addClass('fa fa-' + opts.faClass);
    }
    if (opts.faSpin) {
      icon.addClass('fa-spin');
    }
  }
  $('<span/>').addClass('text').html(message).appendTo(alert);

  return alert;
};

var clearAlerts = function () {
  $('#alerts .status').remove();
};

var onWeatherConditions = function (data) {
  //console.log(data);

  if (!data.response.error) {
    var temp_f = data.current_observation.temp_f;
    var weather = data.current_observation.weather;
    var forecast_url = data.current_observation.forecast_url;

    var icon = data.current_observation.icon;
    var icon_url = data.current_observation.icon_url;
    var nt = (icon_url.indexOf('nt_' + icon + '.') !== -1) ? 'nt_' : '';

    var weather_dom = $('#weather');

    if (weather_dom.length === 0) {
      weather_dom = $('<a/>').attr({
        id: 'weather',
        target: 'weather',
        href: forecast_url,
        title: 'Currently: ' + weather + ', ' + temp_f + '°'
      }).prependTo('#header');
      $('<div/>').addClass('weather-icon ' + nt + icon).appendTo(weather_dom);
      $('<div/>').addClass('temp').text(temp_f + '°').appendTo(weather_dom);
    } else {
      weather_dom.attr({
        href: forecast_url,
        title: 'Currently: ' + weather + ', ' + temp_f + '°'
      });
      weather_dom.find('.weather-icon').removeClass().addClass('weather-icon ' + nt + icon);
      weather_dom.find('.temp').text(temp_f + '°').appendTo(weather_dom);
    }
  }
};

$(document).ready(init);

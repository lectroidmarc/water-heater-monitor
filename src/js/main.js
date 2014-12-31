/**
 * @file Contains the main functions supporting the Water Heater Monitor
 * web page.
 */

var phant;
var wu;

var init = function () {
  $('a[data-toggle="tab"]').on('shown.bs.tab', onTabChange);
  $('#settings form').on('submit', onSettingsSubmit);

  init_phant();
  init_weather();
};

var init_phant = function () {
  var saved_phant_settings = JSON.parse(window.localStorage.getItem('phant_settings'));

  if (saved_phant_settings) {
    $('#phant_url').val(saved_phant_settings.url);
    $('#phant_public_key').val(saved_phant_settings.public_key);

    phant = new Phant(saved_phant_settings);
    phant.fetch({
      'gte[timestamp]': 't - 12h'
    }, onPhantFetch);
    phant.getStats(onPhantStats);
  } else {
    $('#tabs a:last').tab('show');
  }
};

var init_weather = function () {
  var saved_wu_settings = JSON.parse(window.localStorage.getItem('wu_settings'));
  if (saved_wu_settings) {
    $('#wu_api_key').val(saved_wu_settings.api_key);
    $('#wu_location').val(saved_wu_settings.location);

    wu = new WeatherUnderground({
      api_key: saved_wu_settings.api_key,
      location: saved_wu_settings.location
    });
    wu.conditions(onWeatherConditions);
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

  if (data.message) {
    console.warn(data.message);
  } else {
    var current = data[0];

    showStatus(current);
    makeTempGauges(current);
    makeGraph('#plot', data);

    //phant.enableRealtime(onPhantRealtime);
    phant.startPolling({}, onPhantPolled);
  }
};

//var onPhantRealtime = function (data) {
//  console.log(data);
//};

var onPhantPolled = function (data) {
  //console.log(data);

  if (data.message) {
    console.warn(data.message);
  } else if (data.length > 0) {
    var current = data[0];

    showStatus(current);
    makeTempGauges(current);
    updateGraph('#plot', data);

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

  $('.status').hide();
  if (out_of_date) {
    var last_update = new Date(last_update_timestamp);
    $('#last_update_time').text(last_update.toLocaleString());
    $('.status.outofdate').show();
  } else if (system_is_off) {
    $('.status.systemoff').show();
  } else if (current.uplim === 'ON') {
    $('.status.uplim').show();
  } else if (current.pump === 'ON') {
    $('.status.pumpon').show();
  } else {
    $('.status.pumpoff').show();
  }

  if (system_is_off) {
    $('.hidden-xs-systemoff').addClass('off');
  } else {
    $('.hidden-xs-systemoff').removeClass('off');
  }
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

    $('#weather').attr('href', forecast_url).attr('title', 'Currently: ' + weather + ', ' + temp_f + '°');
    $('#weather .weather-icon').removeClass().addClass('weather-icon ' + nt + icon);
    $('#weather .temp').text(temp_f + '°');
  }
};

$(document).ready(init);

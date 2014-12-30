/**
 * @file Contains the main functions supporting the Water Heater Monitor
 * web page.
 */

var phant;
var wu;

var init = function () {
  $('a[data-toggle="tab"]').on('shown.bs.tab', onTabChange);
  $('#settings form').on('submit', onSettingsSubmit);
  $('#update').on('submit', onUpdateSubmit);
  $('#clear_btn').on('click', onClear);

  init_phant();
  init_weather();
};

var init_phant = function () {
  var saved_phant_settings = JSON.parse(window.localStorage.getItem('phant_settings'));

  if (saved_phant_settings) {
    $('#phant_url').val(saved_phant_settings.url);
    $('#phant_public_key').val(saved_phant_settings.public_key);
    $('#phant_private_key').val(saved_phant_settings.private_key);
    $('#clear_btn').prop('disabled', !saved_phant_settings.private_key);

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
    public_key: $('#phant_public_key').val(),
    private_key: $('#phant_private_key').val()
  }));

  window.localStorage.setItem('wu_settings', JSON.stringify({
    api_key: $('#wu_api_key').val(),
    location: $('#wu_location').val()
  }));

  $('#clear_btn').prop('disabled', !$('#phant_private_key').val());
  $('#tabs a:first').tab('show');
};

var onPhantFetch = function (data) {
  //console.log(data);

  if (data.message) {
    console.warn(data.message);
  } else {
    var current = data[0];

    showStatus(current);
    updateFormValues(current);
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
    updateFormValues(current);
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

var onUpdateSubmit = function (e) {
  e.preventDefault();

  if (phant) {
    var params = {
      runtime: $('#runtime').val(),
      coll_t: $('#coll_t').val(),
      stor_t: $('#stor_t').val(),
      aux_1: $('#aux_1').val(),
      aux_2: $('#aux_2').val(),
      diff_t: $('#diff_t').val(),
      hili_t: $('#hili_t').val(),
      pump: $('#update input[name=pump]:checked').val(),
      uplim: $('#update input[name=uplim]:checked').val(),
      ambient_t: $('#ambient_t').val(),
      fault: ''
    };

    phant.update(params, onPhantUpdateSubmitted);
  }
};

var onPhantUpdateSubmitted = function (data) {
  if (data.success) {
    $('#update .result > span').text('Successfully updated ' + phant.url);
    $('#update .result').removeClass('alert-danger').addClass('alert-success').show();
  } else {
    $('#update .result > span').text(data.message);
    $('#update .result').removeClass('alert-success').addClass('alert-danger').show();
  }
};

var onClear = function (e) {
  phant.clear(function (data) {
    $('#tabs a:first').tab('show');
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

var updateFormValues = function (current) {
  $('#runtime').val(current.runtime);
  $('#coll_t').val(current.coll_t);
  $('#stor_t').val(current.stor_t);
  $('#aux_1').val(current.aux_1);
  $('#aux_2').val(current.aux_2);
  $('#ambient_t').val(current.ambient_t);
};

var onWeatherConditions = function (data) {
  //console.log(data);

  if (!data.response.error) {
    var temp_f = data.current_observation.temp_f;
    var weather = data.current_observation.weather;
    var icon_url = data.current_observation.icon_url;
    var forecast_url = data.current_observation.forecast_url;

    $('#weather').attr('href', forecast_url).attr('title', 'Currently: ' + weather + ', ' + temp_f + '°').show().find('img').attr('src', icon_url);
  }
};

$(document).ready(init);

/**
 *
 */

var phant;

var init = function () {
  $('a[data-toggle="tab"]').on('shown.bs.tab', onTabChange);
  $('#settings form').on('submit', onSettingsSubmit);
  $('#update').on('submit', onUpdateSubmit);
  $('#clear_btn').on('click', onClear);

  var saved_phant_settings = JSON.parse(window.localStorage.getItem('phant_settings'));

  if (saved_phant_settings) {
    $('#phant_url').val(saved_phant_settings.url);
    $('#phant_public_key').val(saved_phant_settings.public_key);
    $('#phant_private_key').val(saved_phant_settings.private_key);
    $('#clear_btn').prop('disabled', !saved_phant_settings.private_key);

    phant = new Phant(saved_phant_settings);

    phant.fetch({
      page: 1
    }, onPhantFetch);

    //phant.enableRealtime(onPhantRealtime);

    phant.getStats(onPhantStats);
  } else {
    $('#tabs a:last').tab('show');
  }
}

var onTabChange = function (e) {
  switch ($(e.target).attr('href')) {
    case '#home':
      init();
      break;
    case'#settings':
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

  $('#clear_btn').prop('disabled', !$('#phant_private_key').val());
  $('#tabs a:first').tab('show');
}

var onPhantFetch = function (data) {
  //console.log(data);

  if (data.message) {
    console.warn(data.message);
  } else {
    var current = data[0];
    var last_update_timestamp = Date.parse(current.timestamp);
    var out_of_date = (Date.now() - last_update_timestamp > 11 * 60 * 1000) ? true : false; // max 10 minute interval
    var system_is_off = (current.coll_t === '' && current.stor_t === '' && current.aux_1 === '' && current.aux_2 === '') ? true : false;

    $('.status').hide();
    if (out_of_date) {
      var last_update = new Date(last_update_timestamp)
      $('#last_update_time').text(last_update.toLocaleString());
      $('.status.outofdate').show();
    } else if (system_is_off) {
      $('.status.systemoff').show();
    } else if (current.uplim == 'ON') {
      $('.status.uplim').show();
    } else if (current.pump == 'ON') {
      $('.status.pumpon').show();
    } else {
      $('.status.pumpoff').show();
    }

    if (system_is_off) {
      $('.hidden-xs-systemoff').addClass('off');
    } else {
      $('.hidden-xs-systemoff').removeClass('off');
    }

    makeTempGuage('#aux_2_g', (current.aux_2 !== "") ? parseFloat(current.aux_2) : 0, 'Water Temperature');
    makeTempGuage('#stor_t_g', (current.stor_t !== "") ? parseFloat(current.stor_t) : 0, 'Storage Temperature');
    makeTempGuage('#coll_t_g', (current.coll_t !== "") ? parseFloat(current.coll_t) : 0, 'Collector Temperature', 250);
    makeTempGuage('#ambient_t_g', parseFloat(current.ambient_t), 'Ambient Temperature', 140);

    makeGraph('#plot', data);

    $('#runtime').val(current.runtime);
    $('#coll_t').val(current.coll_t);
    $('#stor_t').val(current.stor_t);
    $('#aux_1').val(current.aux_1);
    $('#aux_2').val(current.aux_2);
    $('#ambient_t').val(current.ambient_t);
  }
};

var onPhantRealtime = function (data) {
  console.log(data);
}

var onPhantStats = function (data) {
  //console.log(data);

  var percentage = data.used / data.cap * 100;

  $('.stats').attr('title', percentage.toFixed(2) + '% space used.');
  $('.stats .progress-bar').css({
    width: percentage.toFixed(2) + '%'
  });
  $('.stats').show();
}

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

$(document).ready(init);

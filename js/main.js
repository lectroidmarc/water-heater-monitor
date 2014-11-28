/**
 *
 */

var phant;

var init = function () {
  var saved_phant_settings = JSON.parse(window.localStorage.getItem('phant_settings'));

  if (saved_phant_settings) {
    $('#phant_url').val(saved_phant_settings.url);
    $('#phant_public_key').val(saved_phant_settings.public_key);
    $('#phant_private_key').val(saved_phant_settings.private_key);

    phant = new Phant(saved_phant_settings);

    phant.fetch({
      page: 1
    }, onPhantFetch);

    //phant.enableRealtime(onPhantUpdate);

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

  $('#tabs a:first').tab('show');
}

var onPhantFetch = function (data) {
  //console.log(data);

  if (data.message) {
    console.warn(data.message);
  } else {
    var current = data[0];

    $('.status').hide();
    if (current.uplim == 'ON') {
      $('.status.uplim').show();
    } else if (current.pump == 'ON') {
      $('.status.on').show();
    } else {
      $('.status.off').show();
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

var onPhantUpdate = function (data) {
  console.log(data);
}

var onPhantStats = function (data) {
  //console.log(data);

  $('.stats .progress-bar').css({
    width: String(data.used / data.cap) + '%'
  });
  $('.stats').show();
}

var onSubmit = function (e) {
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

    phant.update(params, onPhantSubmitted);
  }
};

var onClear = function (e) {
  phant.clear(function (data) {
    $('#tabs a:first').tab('show');
  });
};

var onPhantSubmitted = function (data) {
  if (data.success) {
    $('#update .result > span').text('Successfully updated ' + phant.url);
    $('#update .result').removeClass('alert-danger').addClass('alert-success').show();
  } else {
    $('#update .result > span').text(data.message);
    $('#update .result').removeClass('alert-success').addClass('alert-danger').show();
  }
};

$(document).ready(init);
$('#settings form').on('submit', onSettingsSubmit);
$('a[data-toggle="tab"]').on('shown.bs.tab', onTabChange);
$('#update').on('submit', onSubmit);
$('#clear_btn').on('click', onClear);

/**
 * Скриптът на телевизора - вграден в страницата, ES5 без bundle, защото
 * браузърът на Samsung Tizen е Chromium 85/94 и не се обновява.
 *
 * Какво прави: на 60 s пита /api/display/<token>/version; при различна версия
 * презарежда; след 3 неуспешни проверки показва точка „офлайн“ (менюто остава);
 * веднъж на нощ в 04:00 презарежда за памет, но само ако последната проверка е
 * минала; мери дали менюто се събира и го казва на прегледа в портала.
 * С ?preview=1 не проверява и не презарежда.
 */
export const displayScript = `
(function () {
  var root = document.getElementById('display-root');
  if (!root) return;
  var version = root.getAttribute('data-version');
  var token = root.getAttribute('data-token');
  var preview = root.getAttribute('data-preview') === '1';
  var failures = 0;

  function setClass(name, on) {
    var classes = (root.className || '').split(' ').filter(function (c) { return c && c !== name; });
    if (on) classes.push(name);
    root.className = classes.join(' ');
  }

  function measure() {
    var menu = document.getElementById('display-menu');
    var overflow = false;
    if (menu) overflow = menu.scrollHeight > menu.clientHeight + 2;
    setClass('is-overflow', overflow);
    if (window.parent && window.parent !== window) {
      try { window.parent.postMessage({ type: 'bn-display', overflow: overflow, version: version }, '*'); } catch (e) {}
    }
  }

  measure();
  window.addEventListener('resize', measure);
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(measure); }
  setTimeout(measure, 1500);

  if (preview || !token) return;

  function check() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/display/' + token + '/version', true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (xhr.status === 200) {
        failures = 0;
        setClass('is-offline', false);
        try {
          var data = JSON.parse(xhr.responseText);
          if (data && data.v && data.v !== version) { location.reload(); }
        } catch (e) {}
      } else {
        failures += 1;
        if (failures >= 3) setClass('is-offline', true);
      }
    };
    xhr.send();
  }

  setInterval(check, 60000);

  function scheduleNightly() {
    var now = new Date();
    var next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 4, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    setTimeout(function () {
      if (failures === 0) { location.reload(); } else { setTimeout(scheduleNightly, 3600000); }
    }, next - now);
  }

  scheduleNightly();
})();
`;

/**
 * Скриптът на телевизора - вграден в страницата, ES5 без bundle, защото
 * браузърът на Samsung Tizen е Chromium 85/94 и не се обновява.
 *
 * Какво прави: на 60 s пита /api/display/<token>/version; при различна версия
 * презарежда; след 3 неуспешни проверки показва точка „офлайн“ (менюто остава);
 * веднъж на нощ в 04:00 презарежда за памет, но само ако последната проверка е
 * минала; уголемява текста, докато менюто още се събира, и казва на прегледа в
 * портала, ако не се събира изобщо.
 * С ?preview=1 не проверява и не презарежда.
 *
 * Шаблон „Слайдове“: показва по един слайд; снимката стои data-duration
 * секунди, видеото върви до края си (най-много 10 минути, ако не съобщи края).
 * Адресът на видеото се слага чак когато е на ред и се маха след това.
 * Един-единствен слайд-видео се върти в цикъл. HTML слайдът е <iframe
 * sandbox> със съдържание в data-html; слага се при показване и се маха
 * след това, за да почне анимацията отначало и да не яде памет.
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

  function overflows() {
    var menu = document.getElementById('display-menu');
    return menu ? menu.scrollHeight > menu.clientHeight + 2 : false;
  }

  /* Уголемява текста на стъпки, докато менюто още се събира (най-много 1.9 пъти);
     дълго меню се смалява до 0.7, преди да се докладва преливане. */
  function fit() {
    var scale = 1;
    document.documentElement.style.setProperty('--display-scale', '1');
    if (overflows()) {
      while (scale > 0.7 && overflows()) {
        scale = Math.round((scale - 0.05) * 100) / 100;
        document.documentElement.style.setProperty('--display-scale', String(scale));
      }
    } else {
      while (scale < 1.9) {
        var next = Math.round((scale + 0.05) * 100) / 100;
        document.documentElement.style.setProperty('--display-scale', String(next));
        if (overflows()) { document.documentElement.style.setProperty('--display-scale', String(scale)); break; }
        scale = next;
      }
    }
    measure();
  }

  var slideBox = document.getElementById('display-slides');
  if (slideBox) {
    var slides = slideBox.getElementsByTagName('section');
    var current = 0;
    var timer = null;

    var videoOf = function (slide) {
      var list = slide.getElementsByTagName('video');
      return list.length ? list[0] : null;
    };

    var frameOf = function (slide) {
      var list = slide.getElementsByTagName('iframe');
      return list.length ? list[0] : null;
    };

    var stop = function (slide) {
      var frame = frameOf(slide);
      if (frame) { frame.removeAttribute('srcdoc'); }
      var video = videoOf(slide);
      if (video) {
        video.onended = null;
        try { video.pause(); } catch (e) {}
        video.removeAttribute('src');
        try { video.load(); } catch (e) {}
      }
    };

    var show = function (index) {
      if (timer) { clearTimeout(timer); timer = null; }
      var previous = slides[current];
      current = index;
      var slide = slides[current];
      if (previous && previous !== slide) {
        previous.className = 'display-slide';
        stop(previous);
      }
      slide.className = 'display-slide is-active';
      var frame = frameOf(slide);
      if (frame && (!frame.getAttribute('srcdoc') || slides.length > 1)) {
        frame.setAttribute('srcdoc', frame.getAttribute('data-html') || '');
      }
      var video = videoOf(slide);
      if (video) {
        var single = slides.length === 1;
        video.loop = single;
        if (!video.getAttribute('src')) { video.setAttribute('src', video.getAttribute('data-src') || ''); }
        if (!single) {
          video.onended = next;
          timer = setTimeout(next, 600000);
        }
        try { var played = video.play(); if (played && played['catch']) played['catch'](function () { timer = setTimeout(next, 10000); }); } catch (e) {}
      } else if (slides.length > 1) {
        var seconds = parseInt(slide.getAttribute('data-duration'), 10) || 10;
        timer = setTimeout(next, seconds * 1000);
      }
    };

    var next = function () {
      show((current + 1) % slides.length);
    };

    if (slides.length) { show(0); }
  }

  if (!slideBox) {
    fit();
    window.addEventListener('resize', fit);
  } else {
    measure();
  }
  if (!slideBox) {
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(fit); }
    setTimeout(fit, 1500);
  }

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

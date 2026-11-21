/**
 * Скриптът на телевизора - вграден в страницата, ES5 без bundle, защото
 * браузърът на Samsung Tizen е Chromium 85/94 и не се обновява.
 *
 * Какво прави (от 21.11.2026, по искане на собственика – минимален товар):
 *  – зарежда се наново само 3 пъти на ден, в 06:00, 12:00 и 18:00; преди това
 *    пита /api/display/<token>/version (единствените заявки към Vercel и базата)
 *    и презарежда само ако отговорът е дошъл – без интернет менюто остава;
 *  – на 2 минути зарежда малкия файл „опресни“ от cdn.bansko.now (Cloudflare,
 *    без Vercel и база); щом собственикът натисне „Опресни телевизорите“ или
 *    запише екран, стойността се сменя и телевизорът се презарежда;
 *  – уголемява текста, докато менюто още се събира, и казва на прегледа в
 *    портала, ако не се събира изобщо.
 * С ?preview=1 не проверява и не презарежда.
 *
 * Шаблон „Слайдове“: показва по един слайд; снимката стои data-duration
 * секунди, видеото върви до края си (най-много 10 минути, ако не съобщи края).
 * Адресът на видеото се слага чак когато е на ред за първи път и после
 * остава: при следващото завъртане видеото тръгва от началото без да се тегли
 * наново (файлът е с кеш за година, идва от cdn.bansko.now).
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
        else { try { video.currentTime = 0; } catch (e) {} }
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

  var refreshUrl = root.getAttribute('data-refresh') || '';
  var baseline = null;
  var firstSignal = true;

  /* Сигналът е JS файл: <script> не иска CORS, а на Tizen върви навсякъде. */
  window.bnTvRefresh = function (value) {
    if (firstSignal) { firstSignal = false; baseline = value; return; }
    if (value !== baseline) { location.reload(); }
  };

  function pollSignal() {
    if (!refreshUrl) return;
    var tag = document.createElement('script');
    tag.src = refreshUrl + '?t=' + new Date().getTime();
    tag.onload = function () { if (tag.parentNode) tag.parentNode.removeChild(tag); };
    tag.onerror = function () {
      /* Липсващ файл при първата проверка = още няма сигнал; следващият го включва. */
      if (firstSignal) { firstSignal = false; baseline = 'none'; }
      if (tag.parentNode) tag.parentNode.removeChild(tag);
    };
    document.getElementsByTagName('head')[0].appendChild(tag);
  }

  pollSignal();
  setInterval(pollSignal, 120000);

  /* Зареждане по график: само ако сървърът отговаря, иначе пак след 10 минути. */
  function scheduledReload() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/display/' + token + '/version?t=' + new Date().getTime(), true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (xhr.status === 200) {
        setClass('is-offline', false);
        location.reload();
      } else {
        setClass('is-offline', true);
        setTimeout(scheduledReload, 600000);
      }
    };
    xhr.send();
  }

  function scheduleNext() {
    var hours = [6, 12, 18];
    var now = new Date();
    var next = null;
    for (var i = 0; i < hours.length; i++) {
      var candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours[i], 0, 0, 0);
      if (candidate > now) { next = candidate; break; }
    }
    if (!next) { next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, hours[0], 0, 0, 0); }
    setTimeout(scheduledReload, next - now);
  }

  scheduleNext();
})();
`;

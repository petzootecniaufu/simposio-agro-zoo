(() => {
  'use strict';

  const data = window.AGROZOO;
  if (!data) return;

  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const safeUrl = (value) => {
    if (!value) return '';
    try {
      const url = new URL(value, location.href);
      return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
    } catch {
      return '';
    }
  };
  const emailUrl = (value) => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value || '') ? `mailto:${encodeURIComponent(value)}` : '';
  const formatDate = (date, options) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', ...options }).format(date);

  const start = new Date(`${data.date?.start || ''}T12:00:00Z`);
  const end = new Date(`${data.date?.end || ''}T12:00:00Z`);

  if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
    const sameMonth = start.getUTCMonth() === end.getUTCMonth() && start.getUTCFullYear() === end.getUTCFullYear();
    const range = sameMonth
      ? `${start.getUTCDate()} a ${end.getUTCDate()} de ${formatDate(start, { month: 'long', year: 'numeric' })}`
      : `${formatDate(start, { day: 'numeric', month: 'long', year: 'numeric' })} a ${formatDate(end, { day: 'numeric', month: 'long', year: 'numeric' })}`;

    document.querySelectorAll('[data-event-date]').forEach((element) => {
      element.textContent = range;
    });

    for (let index = 0; index < 3; index += 1) {
      const day = new Date(start);
      day.setUTCDate(day.getUTCDate() + index);
      document.querySelectorAll(`[data-day-date="${index}"]`).forEach((element) => {
        element.textContent = `${day.getUTCDate()} ${formatDate(day, { month: 'short' }).replace('.', '').toUpperCase()}`;
      });

      const fullDay = document.querySelector(`[data-full-day="${index}"]`);
      if (fullDay) fullDay.textContent = formatDate(day, { day: 'numeric', month: 'long' });

      const weekday = document.querySelector(`[data-weekday="${index}"]`);
      if (weekday) {
        const label = formatDate(day, { weekday: 'long' });
        weekday.textContent = `${label[0].toUpperCase()}${label.slice(1)}`;
      }
    }
  }

  document.querySelectorAll('[data-city]').forEach((element) => {
    element.textContent = data.city || 'Uberlândia - MG';
  });

  const venue = document.querySelector('#venue');
  if (venue && data.venue) venue.textContent = data.venue;

  data.days?.forEach((day, index) => {
    const location = document.querySelector(`[data-day-location="${index}"]`);
    if (location) location.textContent = day.location || '';

    const scheduleRoot = document.querySelector(`#schedule-${index + 1}`);
    if (!scheduleRoot) return;

    const items = day.activities || [];
    if (!items.length) {
      scheduleRoot.innerHTML = '';
      return;
    }

    const sorted = [...items].sort((left, right) => (left.time || '99:99').localeCompare(right.time || '99:99'));
    scheduleRoot.innerHTML = `<ol class="schedule-list">${sorted.map((item) => `<li><span class="time-range"><time${item.time ? ` datetime="${escape(item.time)}"` : ''}>${escape(item.time || '')}</time>${item.endTime ? `<span aria-hidden="true">-</span><span class="sr-only"> às </span><time datetime="${escape(item.endTime)}">${escape(item.endTime)}</time>` : ''}</span><div>${escape(item.title || '')}${item.location ? `<small>${escape(item.location)}</small>` : ''}</div></li>`).join('')}</ol>`;
  });

  const person = (profile, role) => `<article class="person">${safeUrl(profile.photo) ? `<img src="${escape(safeUrl(profile.photo))}" alt="${escape(profile.name || '')}" width="70" height="70" loading="lazy">` : ''}<div><h6>${escape(profile.name || '')}</h6><small>${escape(role || profile.role || '')}</small><p>${escape(profile.bio || '')}</p></div></article>`;

  const roundtables = data.days?.[0]?.roundtables || [];
  const roundtableRoot = document.querySelector('#roundtables');
  if (roundtableRoot) {
    roundtableRoot.innerHTML = roundtables.map((table) => `<article class="roundtable"><h5>${escape(table.title || 'Mesa-redonda')}</h5><p>${escape(table.theme || '')}</p><div class="people">${table.moderator ? person(table.moderator, 'Mediação') : ''}${(table.participants || []).map((profile) => person(profile, 'Participante')).join('')}</div></article>`).join('');
    const panel = roundtableRoot.closest('.detail-panel');
    if (panel) panel.hidden = !roundtables.length;
  }

  const courses = data.days?.[1]?.courses || [];
  const courseRoot = document.querySelector('#courses');
  if (courseRoot && courses.length) {
    courseRoot.innerHTML = courses.map((course) => course.title === 'Em breve' ? '<p class="courses-notice">Mais informações em breve</p>' : `<article class="course"><h4>${escape(course.title || '')}</h4>${course.description ? `<p>${escape(course.description)}</p>` : ''}<div class="people">${course.instructor ? person(course.instructor, 'Instrutor(a)') : ''}</div><p>${escape(course.registration || '')}</p>${safeUrl(course.registrationUrl) ? `<a class="course-link" href="${escape(safeUrl(course.registrationUrl))}" target="_blank" rel="noopener noreferrer">Inscrição no minicurso: ${escape(course.title || '')}</a>` : ''}</article>`).join('');
  }

  const submission = data.submission || {};
  const submissionInstructions = document.querySelector('#submission-instructions');
  if (submissionInstructions && submission.instructions) submissionInstructions.textContent = submission.instructions;


  const submissionEmail = document.querySelector('#submission-email');
  if (submissionEmail && emailUrl(submission.email)) submissionEmail.innerHTML = `<a href="${escape(emailUrl(submission.email))}">${escape(submission.email)}</a>`;

  const submissionDocumentList = document.querySelector('#submission-document-list');
  if (submissionDocumentList) {
    submissionDocumentList.innerHTML = (submission.documents || []).map((document) => {
      const url = /^https?:\/\//i.test(document.url || '') ? safeUrl(document.url) : '';
      return url
        ? `<li><a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(document.title)}</a></li>`
        : `<li>${escape(document.title)} - link em breve</li>`;
    }).join('');
  }

  const editalLink = document.querySelector('#edital-link');
  if (editalLink) {
    const url = /^https?:\/\//i.test(data.editalUrl || '') ? safeUrl(data.editalUrl) : '';
    editalLink.hidden = !url;
    if (url) editalLink.href = url;
    else editalLink.removeAttribute('href');
  }

  const registrationLink = document.querySelector('#registration-link');
  if (registrationLink && safeUrl(data.formsUrl)) registrationLink.href = safeUrl(data.formsUrl);
  const socialLinks = document.querySelector('#social-links');
  if (socialLinks) {
    socialLinks.innerHTML = [['petagro', '@PETAGROUFU'], ['zoopet', '@ZOOPETUFU']].map(([key, label]) => safeUrl(data.instagram?.[key]) ? `<a href="${escape(safeUrl(data.instagram[key]))}" target="_blank" rel="noopener noreferrer" aria-label="Instagram ${label.slice(1)}">${label}</a>` : `<span>${label}</span>`).join('');
  }

  const copyFeedback = document.querySelector('#copy-feedback');
  const copyWithoutClipboardApi = (email) => {
    const field = document.createElement('textarea');
    field.value = email;
    field.readOnly = true;
    field.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px';
    const previous = document.activeElement;
    document.body.append(field);
    field.select();
    field.setSelectionRange(0, email.length);
    try {
      if (!document.execCommand('copy')) throw new Error('Copy unavailable');
    } finally {
      field.remove();
      previous?.focus({ preventScroll: true });
    }
  };

  document.querySelectorAll('[data-copy-email]').forEach((button) => {
    button.hidden = false;
    button.addEventListener('click', async () => {
      const email = button.dataset.copyEmail;
      if (copyFeedback) {
        copyFeedback.textContent = '';
        copyFeedback.hidden = true;
      }

      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(email);
        } else {
          copyWithoutClipboardApi(email);
        }
      } catch {
        if (!copyFeedback) return;
        const address = button.closest('.contact-email')?.querySelector('.email-address');
        if (address) {
          const range = document.createRange();
          range.selectNodeContents(address);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
        copyFeedback.hidden = false;
        copyFeedback.textContent = `Não foi possível copiar automaticamente. Copie o endereço selecionado: ${email}`;
      }
    });
  });

  const button = document.querySelector('#menu-button');
  const nav = document.querySelector('#main-nav');
  if (button && nav) {
    const closeMenu = () => {
      button.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
    };

    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
        closeMenu();
        button.focus();
      }
    });

    document.addEventListener('click', (event) => {
      if (!event.target.closest('.site-header')) closeMenu();
    });

    nav.addEventListener('focusout', () => {
      setTimeout(() => {
        if (!nav.contains(document.activeElement) && document.activeElement !== button) closeMenu();
      }, 0);
    });

    matchMedia('(min-width:801px)').addEventListener('change', closeMenu);
    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

    const current = location.pathname.split('/').pop() || 'index.html';
    nav.querySelectorAll('a').forEach((link) => {
      const target = link.getAttribute('href')?.split('/').pop();
      if (target === current) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }
})();

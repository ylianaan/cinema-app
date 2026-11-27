// ========== ГЛАВНЫЙ МОДУЛЬ ПРИЛОЖЕНИЯ ==========

// ----- Навигация -----
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.section).classList.add("active");

    if (btn.dataset.section === "tickets") fillSessionSelect();
    if (btn.dataset.section === "cash") renderReceipts();
    if (btn.dataset.section === "reports") renderReports();
  });
});

// ----- Toast -----
function showToast(msg, isError = false) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.toggle("error", isError);
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 3000);
}

// ========== МОДУЛЬ РЕПЕРТУАРА ==========

function resetFilmForm() {
  document.getElementById("film-form").reset();
  document.getElementById("edit-film-id").value = "";
  document.getElementById("film-form-title").textContent = "Добавить фильм";
  document.getElementById("film-submit-btn").textContent = "Добавить фильм";
  document.getElementById("film-cancel-btn").classList.add("hidden");
  document.getElementById("film-hours").value = 1;
  document.getElementById("film-minutes").value = 30;
  document.querySelectorAll('input[name="genre"]').forEach(c => c.checked = false);
}

function resetSessionForm() {
  document.getElementById("session-form").reset();
  document.getElementById("edit-session-id").value = "";
  document.getElementById("session-form-title").textContent = "Добавить сеанс";
  document.getElementById("session-submit-btn").textContent = "Добавить сеанс";
  document.getElementById("session-cancel-btn").classList.add("hidden");
  document.getElementById("session-price").value = 350;
}

document.getElementById("film-cancel-btn").addEventListener("click", resetFilmForm);
document.getElementById("session-cancel-btn").addEventListener("click", resetSessionForm);

function renderFilms() {
  const list = document.getElementById("films-list");
  const films = getFilms();
  if (!films.length) {
    list.innerHTML = '<p class="empty">Фильмов пока нет</p>';
    return;
  }
  list.innerHTML = films.map(f => `
    <div class="list-item">
      <div>
        <strong>${f.title}</strong>
        <div class="meta">${(f.genres || []).join(", ")} · ${formatDuration(f.duration)} · ${f.age}</div>
      </div>
      <div class="item-actions">
        <button class="btn-edit" data-film-id="${f.id}" title="Изменить">✎</button>
        <button class="btn-delete" data-film-id="${f.id}" title="Удалить">✕</button>
      </div>
    </div>
  `).join("");

  list.querySelectorAll(".btn-delete").forEach(btn => {
    btn.addEventListener("click", () => {
      if (confirm("Удалить этот фильм и все его сеансы?")) {
        deleteFilm(Number(btn.dataset.filmId));
        renderFilms();
        renderSessions();
        fillFilmSelect();
        resetFilmForm();
        showToast("Фильм удалён");
      }
    });
  });

  list.querySelectorAll(".btn-edit").forEach(btn => {
    btn.addEventListener("click", () => {
      const film = getFilms().find(f => f.id === Number(btn.dataset.filmId));
      if (!film) return;

      document.getElementById("edit-film-id").value = film.id;
      document.getElementById("film-title").value = film.title;
      document.getElementById("film-age").value = film.age;
      document.getElementById("film-hours").value = Math.floor(film.duration / 60);
      document.getElementById("film-minutes").value = film.duration % 60;

      document.querySelectorAll('input[name="genre"]').forEach(c => {
        c.checked = (film.genres || []).includes(c.value);
      });

      document.getElementById("film-form-title").textContent = "Изменить фильм";
      document.getElementById("film-submit-btn").textContent = "Сохранить";
      document.getElementById("film-cancel-btn").classList.remove("hidden");

      // Прокрутка к форме
      document.getElementById("film-form").scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });
}

function getFilteredSessions(dateValue) {
  let sessions = getSessions();
  if (dateValue) {
    sessions = sessions.filter(s => (s.datetime || "").startsWith(dateValue));
  }
  return sessions;
}

function renderSessions(dateValue) {
  const list = document.getElementById("sessions-list");
  const sessions = getFilteredSessions(dateValue || document.getElementById("filter-session-date").value);
  const films = getFilms();
  if (!sessions.length) {
    list.innerHTML = '<p class="empty">Сеансов пока нет</p>';
    return;
  }
  list.innerHTML = sessions.map(s => {
    const film = films.find(f => f.id === s.filmId);
    const hall = HALLS[s.hallId];
    const dt = new Date(s.datetime).toLocaleString("ru-RU");
    const sold = Object.keys(s.occupied || {}).length;
    return `
      <div class="list-item">
        <div>
          <strong>${film ? film.title : "—"}</strong>
          <div class="meta">${hall.name} · ${dt} · ${s.price} ₽ · продано: ${sold}</div>
        </div>
        <div class="item-actions">
          <button class="btn-edit" data-session-id="${s.id}" title="Изменить">✎</button>
          <button class="btn-delete" data-session-id="${s.id}" title="Удалить">✕</button>
        </div>
      </div>
    `;
  }).join("");

  list.querySelectorAll(".btn-delete").forEach(btn => {
    btn.addEventListener("click", () => {
      if (confirm("Удалить этот сеанс?")) {
        deleteSession(Number(btn.dataset.sessionId));
        renderSessions();
        resetSessionForm();
        showToast("Сеанс удалён");
      }
    });
  });

  list.querySelectorAll(".btn-edit").forEach(btn => {
    btn.addEventListener("click", () => {
      const session = getSessionById(btn.dataset.sessionId);
      if (!session) return;

      document.getElementById("edit-session-id").value = session.id;
      document.getElementById("session-film").value = session.filmId;
      document.getElementById("session-hall").value = session.hallId;
      document.getElementById("session-datetime").value = session.datetime;
      document.getElementById("session-price").value = session.price;

      document.getElementById("session-form-title").textContent = "Изменить сеанс";
      document.getElementById("session-submit-btn").textContent = "Сохранить";
      document.getElementById("session-cancel-btn").classList.remove("hidden");

      document.getElementById("session-form").scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });
}

function fillFilmSelect() {
  const sel = document.getElementById("session-film");
  const films = getFilms();
  const current = sel.value;
  sel.innerHTML = '<option value="">Выберите фильм</option>' +
    films.map(f => `<option value="${f.id}">${f.title}</option>`).join("");
  if (current) sel.value = current;
}

document.getElementById("film-form").addEventListener("submit", e => {
  e.preventDefault();

  const genres = [...document.querySelectorAll('input[name="genre"]:checked')].map(c => c.value);
  if (!genres.length) {
    showToast("Выберите хотя бы один жанр", true);
    return;
  }

  const hours = Number(document.getElementById("film-hours").value) || 0;
  const minutes = Number(document.getElementById("film-minutes").value) || 0;
  const duration = hours * 60 + minutes;

  if (duration <= 0) {
    showToast("Укажите длительность фильма", true);
    return;
  }

  const data = {
    title: document.getElementById("film-title").value.trim(),
    genres,
    duration,
    age: document.getElementById("film-age").value
  };

  const editId = document.getElementById("edit-film-id").value;
  if (editId) {
    updateFilm(Number(editId), data);
    showToast("Фильм обновлён");
  } else {
    addFilm(data);
    showToast("Фильм добавлен");
  }

  resetFilmForm();
  renderFilms();
  fillFilmSelect();
});

document.getElementById("session-form").addEventListener("submit", e => {
  e.preventDefault();
  const filmId = Number(document.getElementById("session-film").value);
  if (!filmId) {
    showToast("Выберите фильм", true);
    return;
  }

  const data = {
    filmId,
    hallId: Number(document.getElementById("session-hall").value),
    datetime: document.getElementById("session-datetime").value,
    price: Number(document.getElementById("session-price").value)
  };

  const editId = document.getElementById("edit-session-id").value;
  if (editId) {
    updateSessionData(Number(editId), data);
    showToast("Сеанс обновлён");
  } else {
    addSession(data);
    showToast("Сеанс добавлен");
  }

  resetSessionForm();
  renderSessions();
});

// ========== МОДУЛЬ ПРОДАЖИ БИЛЕТОВ (мультивыбор мест) ==========

let currentSession = null;
let selectedSeats = [];

function fillSessionSelect(dateValue) {
  const sel = document.getElementById("ticket-session");
  const sessions = getFilteredSessions(dateValue || document.getElementById("filter-ticket-date").value);
  const films = getFilms();
  sel.innerHTML = '<option value="">— выберите сеанс —</option>' +
    sessions.map(s => {
      const film = films.find(f => f.id === s.filmId);
      const dt = new Date(s.datetime).toLocaleString("ru-RU");
      return `<option value="${s.id}">${film ? film.title : "—"} · ${HALLS[s.hallId].name} · ${dt}</option>`;
    }).join("");
}

// Фильтры
document.getElementById("btn-filter-sessions").addEventListener("click", () => {
  renderSessions(document.getElementById("filter-session-date").value);
});

document.getElementById("btn-clear-filter").addEventListener("click", () => {
  document.getElementById("filter-session-date").value = "";
  renderSessions("");
});

document.getElementById("btn-filter-tickets").addEventListener("click", () => {
  fillSessionSelect(document.getElementById("filter-ticket-date").value);
  // сбросить выбранный сеанс и схему
  document.getElementById("ticket-session").value = "";
  document.getElementById("hall-info").classList.add("hidden");
  selectedSeats = [];
});

document.getElementById("btn-clear-ticket-filter").addEventListener("click", () => {
  document.getElementById("filter-ticket-date").value = "";
  fillSessionSelect("");
  document.getElementById("ticket-session").value = "";
  document.getElementById("hall-info").classList.add("hidden");
  selectedSeats = [];
});

document.getElementById("ticket-session").addEventListener("change", e => {
  const id = e.target.value;
  selectedSeats = [];
  document.getElementById("selected-info").classList.add("hidden");

  if (!id) {
    document.getElementById("hall-info").classList.add("hidden");
    return;
  }

  currentSession = getSessionById(id);
  renderSeats();
  document.getElementById("hall-info").classList.remove("hidden");
});

function isSelected(row, col) {
  return selectedSeats.some(s => s.row === row && s.col === col);
}

function renderSeats() {
  const hall = HALLS[currentSession.hallId];
  const grid = document.getElementById("seats-grid");
  grid.innerHTML = "";

  for (let r = 1; r <= hall.rows; r++) {
    const rowDiv = document.createElement("div");
    rowDiv.className = "seat-row";

    const leftNum = document.createElement("span");
    leftNum.className = "row-num";
    leftNum.textContent = r;
    rowDiv.appendChild(leftNum);

    for (let c = 1; c <= hall.cols; c++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "seat";
      btn.textContent = c;

      const isVip = hall.vipRows.includes(r);
      const occupied = isSeatOccupied(currentSession, r, c);

      if (occupied) {
        btn.classList.add("occupied");
      } else if (isSelected(r, c)) {
        btn.classList.add("selected");
      } else if (isVip) {
        btn.classList.add("vip");
      } else {
        btn.classList.add("free");
      }

      btn.addEventListener("click", () => toggleSeat(r, c, isVip, occupied));
      rowDiv.appendChild(btn);
    }

    const rightNum = document.createElement("span");
    rightNum.className = "row-num";
    rightNum.textContent = r;
    rowDiv.appendChild(rightNum);

    grid.appendChild(rowDiv);
  }

  updateSelectedInfo();
}

function toggleSeat(row, col, isVip, occupied) {
  if (occupied) {
    showToast("Это место уже занято", true);
    return;
  }

  const idx = selectedSeats.findIndex(s => s.row === row && s.col === col);
  if (idx >= 0) {
    selectedSeats.splice(idx, 1);
  } else {
    selectedSeats.push({ row, col, isVip });
  }

  renderSeats();
}

function updateSelectedInfo() {
  const info = document.getElementById("selected-info");
  if (!selectedSeats.length) {
    info.classList.add("hidden");
    return;
  }

  info.classList.remove("hidden");

  const sorted = [...selectedSeats].sort((a, b) => a.row - b.row || a.col - b.col);
  const seatsText = sorted.map(s =>
    `ряд ${s.row} место ${s.col}${s.isVip ? " (VIP)" : ""}`
  ).join(", ");

  let total = 0;
  selectedSeats.forEach(s => {
    total += s.isVip ? Math.round(currentSession.price * 1.5) : currentSession.price;
  });

  document.getElementById("selected-seat-text").textContent = seatsText;
  document.getElementById("ticket-price").textContent = total;
  document.getElementById("btn-buy").textContent =
    selectedSeats.length === 1
      ? "Оформить покупку"
      : `Купить ${selectedSeats.length} билета(ов)`;
}

document.getElementById("btn-buy").addEventListener("click", () => {
  if (!currentSession || !selectedSeats.length) return;

  try {
    const film = getFilms().find(f => f.id === currentSession.filmId);
    let bought = 0;

    for (const seat of selectedSeats) {
      occupySeat(currentSession, seat.row, seat.col);

      const price = seat.isVip
        ? Math.round(currentSession.price * 1.5)
        : currentSession.price;

      addTicket({
        sessionId: currentSession.id,
        filmTitle: film ? film.title : "—",
        hallName: HALLS[currentSession.hallId].name,
        row: seat.row,
        col: seat.col,
        isVip: seat.isVip,
        price,
        datetime: currentSession.datetime
      });
      bought++;
    }

    showToast(`Куплено билетов: ${bought}`);
    selectedSeats = [];
    document.getElementById("selected-info").classList.add("hidden");
    currentSession = getSessionById(currentSession.id);
    renderSeats();
  } catch (err) {
    showToast(err.message, true);
    currentSession = getSessionById(currentSession.id);
    selectedSeats = [];
    renderSeats();
  }
});

// ========== МОДУЛЬ КАССЫ ==========

function getCashTickets() {
  const dateValue = document.getElementById("filter-cash-date").value;
  const search = (document.getElementById("filter-cash-search").value || "").trim().toLowerCase();
  let tickets = getTickets().slice().reverse();

  if (dateValue) {
    tickets = tickets.filter(t => (t.saleDateTime || "").startsWith(dateValue));
  }

  if (search) {
    tickets = tickets.filter(t => {
      const hay = `${t.filmTitle} ${t.hallName} ${t.row} ${t.col} ${t.price}`.toLowerCase();
      return hay.includes(search);
    });
  }

  return tickets;
}

function renderReceipts() {
  const list = document.getElementById("receipts-list");
  const empty = document.getElementById("no-receipts");
  const tickets = getCashTickets();

  const sum = tickets.reduce((acc, t) => acc + t.price, 0);
  document.getElementById("cash-count").textContent = tickets.length;
  document.getElementById("cash-sum").textContent = sum.toLocaleString("ru-RU") + " ₽";

  if (!tickets.length) {
    list.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  list.innerHTML = tickets.map(t => {
    const dt = new Date(t.saleDateTime).toLocaleString("ru-RU");
    return `
      <div class="list-item">
        <div>
          <strong>Квитанция #${String(t.id).slice(-6)}</strong>
          <div class="meta">
            ${t.filmTitle} · ${t.hallName} · ряд ${t.row}, место ${t.col}
            ${t.isVip ? " (VIP)" : ""} · ${t.price} ₽
          </div>
          <div class="meta">Продано: ${dt}</div>
        </div>
        <div class="receipt-actions">
          <button class="btn-print" data-ticket-id="${t.id}">Печать</button>
          <button class="btn-cancel-ticket" data-ticket-id="${t.id}">Отмена</button>
        </div>
      </div>
    `;
  }).join("");

  list.querySelectorAll(".btn-print").forEach(btn => {
    btn.addEventListener("click", () => openPrintModal(btn.dataset.ticketId));
  });

  list.querySelectorAll(".btn-cancel-ticket").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!confirm("Отменить этот билет? Место снова станет свободным.")) return;
      const ok = cancelTicket(btn.dataset.ticketId);
      if (ok) {
        showToast("Билет отменён, место освобождено");
        renderReceipts();
      } else {
        showToast("Не удалось отменить билет", true);
      }
    });
  });
}

function openPrintModal(ticketId) {
  const ticket = getTickets().find(t => String(t.id) === String(ticketId));
  if (!ticket) return;

  const dt = new Date(ticket.saleDateTime).toLocaleString("ru-RU");
  const body = document.getElementById("print-body");
  body.innerHTML = `
    <p><strong>№:</strong> ${String(ticket.id).slice(-8)}</p>
    <p><strong>Фильм:</strong> ${ticket.filmTitle}</p>
    <p><strong>Зал:</strong> ${ticket.hallName}</p>
    <p><strong>Место:</strong> ряд ${ticket.row}, место ${ticket.col}${ticket.isVip ? " (VIP)" : ""}</p>
    <p><strong>Сеанс:</strong> ${new Date(ticket.datetime).toLocaleString("ru-RU")}</p>
    <p><strong>Цена:</strong> ${ticket.price} ₽</p>
    <p><strong>Дата продажи:</strong> ${dt}</p>
  `;

  document.getElementById("print-modal").classList.remove("hidden");
}

document.getElementById("btn-close-print").addEventListener("click", () => {
  document.getElementById("print-modal").classList.add("hidden");
});

document.getElementById("btn-do-print").addEventListener("click", () => {
  window.print();
});

document.getElementById("btn-filter-cash").addEventListener("click", renderReceipts);
document.getElementById("btn-clear-cash-filter").addEventListener("click", () => {
  document.getElementById("filter-cash-date").value = "";
  document.getElementById("filter-cash-search").value = "";
  renderReceipts();
});

document.getElementById("filter-cash-search").addEventListener("input", () => {
  // живой поиск
  renderReceipts();
});

// ========== МОДУЛЬ ОТЧЁТНОСТИ ==========

function getReportTickets(dateValue) {
  let tickets = getTickets();
  if (dateValue) {
    tickets = tickets.filter(t => (t.saleDateTime || "").startsWith(dateValue));
  }
  return tickets;
}

function renderReports(dateValue) {
  const filterDate = dateValue !== undefined
    ? dateValue
    : document.getElementById("filter-report-date").value;

  const tickets = getReportTickets(filterDate);

  const revenue = tickets.reduce((sum, t) => sum + t.price, 0);
  const vipCount = tickets.filter(t => t.isVip).length;
  const avg = tickets.length ? Math.round(revenue / tickets.length) : 0;

  document.getElementById("stat-tickets").textContent = tickets.length;
  document.getElementById("stat-revenue").textContent = revenue.toLocaleString("ru-RU") + " ₽";
  document.getElementById("stat-avg").textContent = avg.toLocaleString("ru-RU") + " ₽";
  document.getElementById("stat-vip").textContent = vipCount;

  // Кассовая сводка
  const cashList = document.getElementById("report-cash");
  if (!tickets.length) {
    cashList.innerHTML = '<p class="empty">Нет продаж за выбранный период</p>';
  } else {
    const byDay = {};
    tickets.forEach(t => {
      const day = (t.saleDateTime || "").slice(0, 10);
      if (!byDay[day]) byDay[day] = { count: 0, sum: 0 };
      byDay[day].count++;
      byDay[day].sum += t.price;
    });

    const days = Object.entries(byDay).sort((a, b) => b[0].localeCompare(a[0]));
    cashList.innerHTML = days.map(([day, d]) => {
      const nice = new Date(day + "T00:00:00").toLocaleDateString("ru-RU");
      return `
        <div class="list-item">
          <div><strong>${nice}</strong></div>
          <div class="meta">${d.count} бил. · ${d.sum.toLocaleString("ru-RU")} ₽</div>
        </div>
      `;
    }).join("");
  }

  // По фильмам
  const byFilm = {};
  tickets.forEach(t => {
    if (!byFilm[t.filmTitle]) byFilm[t.filmTitle] = { count: 0, sum: 0 };
    byFilm[t.filmTitle].count++;
    byFilm[t.filmTitle].sum += t.price;
  });

  const filmList = document.getElementById("report-by-film");
  const filmEntries = Object.entries(byFilm).sort((a, b) => b[1].sum - a[1].sum);
  filmList.innerHTML = filmEntries.length
    ? filmEntries.map(([title, d]) => `
        <div class="list-item">
          <div><strong>${title}</strong></div>
          <div class="meta">${d.count} бил. · ${d.sum.toLocaleString("ru-RU")} ₽</div>
        </div>
      `).join("")
    : '<p class="empty">Нет данных</p>';

  // По сеансам
  const bySession = {};
  tickets.forEach(t => {
    const key = `${t.filmTitle} | ${t.hallName} | ${new Date(t.datetime).toLocaleString("ru-RU")}`;
    if (!bySession[key]) bySession[key] = { count: 0, sum: 0 };
    bySession[key].count++;
    bySession[key].sum += t.price;
  });

  const sessList = document.getElementById("report-by-session");
  const sessEntries = Object.entries(bySession).sort((a, b) => b[1].sum - a[1].sum);
  sessList.innerHTML = sessEntries.length
    ? sessEntries.map(([key, d]) => `
        <div class="list-item">
          <div><strong>${key}</strong></div>
          <div class="meta">${d.count} бил. · ${d.sum.toLocaleString("ru-RU")} ₽</div>
        </div>
      `).join("")
    : '<p class="empty">Нет данных</p>';
}

document.getElementById("btn-refresh-reports").addEventListener("click", () => renderReports());
document.getElementById("btn-filter-reports").addEventListener("click", () => {
  renderReports(document.getElementById("filter-report-date").value);
});
document.getElementById("btn-clear-report-filter").addEventListener("click", () => {
  document.getElementById("filter-report-date").value = "";
  renderReports("");
});

// ========== ИНИЦИАЛИЗАЦИЯ ==========
renderFilms();
renderSessions();
fillFilmSelect();

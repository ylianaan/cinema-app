/**
 * Cinema.Repertoire — модуль репертуара и сеансов
 */

const CinemaRepertoire = (function () {

  function renderFilmsSelect(selectEl) {
    const films = CinemaCore.getFilms();
    selectEl.innerHTML = films.map(f =>
      `<option value="${f.id}">${f.title} (${f.ageRating})</option>`
    ).join("");
  }

  function renderHallsSelect(selectEl) {
    const halls = CinemaCore.getHalls();
    selectEl.innerHTML = halls.map(h =>
      `<option value="${h.id}">${h.name} (${h.type})</option>`
    ).join("");
  }

  function renderSessionsList() {
    const container = document.getElementById("sessions-list");
    const sessions = CinemaCore.getSessions();
    const films = CinemaCore.getFilms();
    const halls = CinemaCore.getHalls();

    if (sessions.length === 0) {
      container.innerHTML = '<p class="empty">Сеансов пока нет</p>';
      return;
    }

    // Сортируем по дате
    const sorted = [...sessions].sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

    container.innerHTML = sorted.map(s => {
      const film = films.find(f => f.id === s.filmId);
      const hall = halls.find(h => h.id === s.hallId);
      const dt = new Date(s.datetime);
      const dateStr = dt.toLocaleString("ru-RU", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit"
      });
      return `<div class="list-item">
        <strong>${film ? film.title : "—"}</strong> · ${hall ? hall.name : "—"} · ${dateStr} · ${s.basePrice} ₽
      </div>`;
    }).join("");
  }

  function init() {
    const filmForm = document.getElementById("film-form");
    const hallForm = document.getElementById("hall-form");
    const sessionForm = document.getElementById("session-form");

    filmForm.addEventListener("submit", (e) => {
      e.preventDefault();
      CinemaCore.addFilm({
        title: document.getElementById("film-title").value.trim(),
        genre: document.getElementById("film-genre").value.trim(),
        duration: Number(document.getElementById("film-duration").value),
        ageRating: document.getElementById("film-age").value
      });
      filmForm.reset();
      renderFilmsSelect(document.getElementById("session-film"));
      alert("Фильм добавлен");
    });

    hallForm.addEventListener("submit", (e) => {
      e.preventDefault();
      CinemaCore.addHall({
        name: document.getElementById("hall-name").value.trim(),
        rows: Number(document.getElementById("hall-rows").value),
        seatsPerRow: Number(document.getElementById("hall-seats").value),
        type: document.getElementById("hall-type").value
      });
      hallForm.reset();
      document.getElementById("hall-rows").value = 5;
      document.getElementById("hall-seats").value = 8;
      renderHallsSelect(document.getElementById("session-hall"));
      alert("Зал добавлен");
    });

    sessionForm.addEventListener("submit", (e) => {
      e.preventDefault();
      CinemaCore.addSession({
        filmId: Number(document.getElementById("session-film").value),
        hallId: Number(document.getElementById("session-hall").value),
        datetime: new Date(document.getElementById("session-datetime").value).toISOString(),
        basePrice: Number(document.getElementById("session-price").value)
      });
      sessionForm.reset();
      document.getElementById("session-price").value = 300;
      renderSessionsList();
      // Обновляем список сеансов в модуле продажи
      if (window.CinemaTickets) CinemaTickets.refreshSessions();
      alert("Сеанс создан");
    });

    // Первичный рендер
    renderFilmsSelect(document.getElementById("session-film"));
    renderHallsSelect(document.getElementById("session-hall"));
    renderSessionsList();
  }

  return { init, renderSessionsList };
})();

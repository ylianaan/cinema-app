/**
 * Cinema.Reports — модуль отчётности
 */

const CinemaReports = (function () {

  function renderCashSummary() {
    const tickets = CinemaCore.getTickets();
    const container = document.getElementById("cash-summary");

    if (tickets.length === 0) {
      container.innerHTML = '<p class="empty">Продаж пока нет</p>';
      return;
    }

    const total = tickets.reduce((sum, t) => sum + t.price, 0);
    const byMethod = {};
    tickets.forEach(t => {
      byMethod[t.paymentMethod] = (byMethod[t.paymentMethod] || 0) + t.price;
    });

    let html = `<div class="list-item"><strong>Всего продаж:</strong> ${tickets.length}</div>`;
    html += `<div class="list-item"><strong>Общая выручка:</strong> ${total} ₽</div>`;
    html += "<div class='list-item'><strong>По способам оплаты:</strong></div>";
    for (const [method, sum] of Object.entries(byMethod)) {
      html += `<div class="list-item">— ${method}: ${sum} ₽</div>`;
    }

    container.innerHTML = html;
  }

  function renderSalesByFilm() {
    const tickets = CinemaCore.getTickets();
    const sessions = CinemaCore.getSessions();
    const films = CinemaCore.getFilms();
    const container = document.getElementById("sales-by-film");

    if (tickets.length === 0) {
      container.innerHTML = '<p class="empty">Продаж пока нет</p>';
      return;
    }

    const byFilm = {};
    tickets.forEach(t => {
      const session = sessions.find(s => s.id === t.sessionId);
      if (!session) return;
      const film = films.find(f => f.id === session.filmId);
      const title = film ? film.title : "Неизвестный";
      if (!byFilm[title]) byFilm[title] = { count: 0, sum: 0 };
      byFilm[title].count++;
      byFilm[title].sum += t.price;
    });

    container.innerHTML = Object.entries(byFilm).map(([title, data]) =>
      `<div class="list-item"><strong>${title}</strong>: ${data.count} билет(ов) на сумму ${data.sum} ₽</div>`
    ).join("");
  }

  function renderSalesLog() {
    const tickets = CinemaCore.getTickets();
    const sessions = CinemaCore.getSessions();
    const films = CinemaCore.getFilms();
    const container = document.getElementById("sales-log");

    if (tickets.length === 0) {
      container.innerHTML = '<p class="empty">Журнал пуст</p>';
      return;
    }

    const sorted = [...tickets].sort((a, b) =>
      new Date(b.saleDateTime) - new Date(a.saleDateTime)
    );

    container.innerHTML = sorted.map(t => {
      const session = sessions.find(s => s.id === t.sessionId);
      const film = session ? films.find(f => f.id === session.filmId) : null;
      const saleDt = new Date(t.saleDateTime).toLocaleString("ru-RU");
      return `<div class="list-item">
        #${t.id} · ${film ? film.title : "—"} · ряд ${t.row} место ${t.seat} · ${t.price} ₽ · ${t.paymentMethod} · ${saleDt}
      </div>`;
    }).join("");
  }

  function refresh() {
    renderCashSummary();
    renderSalesByFilm();
    renderSalesLog();
  }

  function init() {
    document.getElementById("btn-refresh-reports").addEventListener("click", refresh);
    refresh();
  }

  return { init, refresh };
})();

/**
 * Cinema.Cash — модуль кассы и квитанций
 * Интегрируется с Cinema.Tickets и Cinema.Core
 */

const CinemaCash = (function () {
  let currentSelection = null;

  function showPaymentForm(selection) {
    currentSelection = selection;
    const details = document.getElementById("payment-details");
    const form = document.getElementById("payment-form");
    const receiptCard = document.getElementById("receipt-card");

    receiptCard.style.display = "none";

    if (!selection) {
      details.textContent = "Сначала выберите место во вкладке «Продажа билетов»";
      form.style.display = "none";
      return;
    }

    const session = CinemaCore.getSession(selection.sessionId);
    const films = CinemaCore.getFilms();
    const halls = CinemaCore.getHalls();
    const film = films.find(f => f.id === session.filmId);
    const hall = halls.find(h => h.id === session.hallId);
    const dt = new Date(session.datetime).toLocaleString("ru-RU");

    details.innerHTML = `
      <strong>Фильм:</strong> ${film ? film.title : "—"}<br>
      <strong>Зал:</strong> ${hall ? hall.name : "—"}<br>
      <strong>Время:</strong> ${dt}<br>
      <strong>Место:</strong> ряд ${selection.row}, место ${selection.seat}<br>
      <strong>Сумма:</strong> <span style="font-size:1.2rem;font-weight:700;color:#1a237e">${selection.price} ₽</span>
    `;
    form.style.display = "block";
  }

  function processPayment() {
    if (!currentSelection) {
      alert("Нет выбранного места");
      return;
    }

    const method = document.getElementById("payment-method").value;
    const result = CinemaCore.tryOccupySeat(
      currentSelection.sessionId,
      currentSelection.row,
      currentSelection.seat,
      currentSelection.price,
      method
    );

    if (!result.success) {
      alert("Ошибка: " + result.error);
      // Обновляем схему зала — место уже занято
      if (window.CinemaTickets) {
        CinemaTickets.clearSelection();
      }
      return;
    }

    // Успех — показываем квитанцию
    const ticket = result.ticket;
    const session = CinemaCore.getSession(ticket.sessionId);
    const film = CinemaCore.getFilms().find(f => f.id === session.filmId);
    const hall = CinemaCore.getHalls().find(h => h.id === session.hallId);
    const dt = new Date(session.datetime).toLocaleString("ru-RU");
    const saleDt = new Date(ticket.saleDateTime).toLocaleString("ru-RU");

    document.getElementById("receipt").innerHTML = `
      <h4>КВИТАНЦИЯ № ${ticket.id}</h4>
      --------------------------------<br>
      Кинотеатр «ИС Кинотеатр»<br>
      Дата продажи: ${saleDt}<br>
      --------------------------------<br>
      Фильм: ${film ? film.title : "—"}<br>
      Зал: ${hall ? hall.name : "—"}<br>
      Сеанс: ${dt}<br>
      Место: ряд ${ticket.row}, место ${ticket.seat}<br>
      --------------------------------<br>
      Сумма: ${ticket.price} ₽<br>
      Оплата: ${ticket.paymentMethod}<br>
      --------------------------------<br>
      Спасибо за покупку!
    `;

    document.getElementById("payment-form").style.display = "none";
    document.getElementById("receipt-card").style.display = "block";

    // Сбрасываем выбор в модуле продажи
    if (window.CinemaTickets) {
      CinemaTickets.clearSelection();
    }
    currentSelection = null;
  }

  function init() {
    document.getElementById("btn-pay").addEventListener("click", processPayment);

    document.getElementById("btn-new-sale").addEventListener("click", () => {
      document.getElementById("receipt-card").style.display = "none";
      document.getElementById("payment-details").textContent =
        "Сначала выберите место во вкладке «Продажа билетов»";
      document.getElementById("payment-form").style.display = "none";

      // Переключаемся на продажу билетов
      document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      document.querySelector('[data-tab="tickets"]').classList.add("active");
      document.getElementById("tickets").classList.add("active");

      if (window.CinemaTickets) CinemaTickets.refreshSessions();
    });
  }

  return { init, showPaymentForm };
})();

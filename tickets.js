/**
 * Cinema.Tickets — модуль продажи билетов
 * Интегрируется с Cinema.Core (занятость мест) и Cinema.Repertoire (сеансы)
 */

const CinemaTickets = (function () {
  let selectedSessionId = null;
  let selectedRow = null;
  let selectedSeat = null;
  let currentPrice = 0;

  function refreshSessions() {
    const select = document.getElementById("ticket-session");
    const sessions = CinemaCore.getSessions();
    const films = CinemaCore.getFilms();
    const halls = CinemaCore.getHalls();

    if (sessions.length === 0) {
      select.innerHTML = '<option value="">Нет доступных сеансов</option>';
      return;
    }

    const sorted = [...sessions].sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

    select.innerHTML = '<option value="">— Выберите сеанс —</option>' + sorted.map(s => {
      const film = films.find(f => f.id === s.filmId);
      const hall = halls.find(h => h.id === s.hallId);
      const dt = new Date(s.datetime).toLocaleString("ru-RU", {
        day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
      });
      return `<option value="${s.id}">${film ? film.title : "—"} · ${hall ? hall.name : "—"} · ${dt} · ${s.basePrice} ₽</option>`;
    }).join("");
  }

  function renderHallScheme(sessionId) {
    const session = CinemaCore.getSession(sessionId);
    if (!session) return;

    const hall = CinemaCore.getHall(session.hallId);
    if (!hall) return;

    const occupied = CinemaCore.getOccupiedSeats(sessionId);
    const container = document.getElementById("hall-scheme");
    const isVipHall = hall.type === "VIP";

    container.style.gridTemplateColumns = `repeat(${hall.seatsPerRow}, 36px)`;
    container.innerHTML = "";

    for (let r = 1; r <= hall.rows; r++) {
      for (let s = 1; s <= hall.seatsPerRow; s++) {
        const key = `${r}-${s}`;
        const isOccupied = occupied.includes(key);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "seat";
        btn.textContent = `${r}-${s}`;

        if (isOccupied) {
          btn.classList.add("occupied");
          btn.disabled = true;
        } else {
          btn.classList.add("free");
          if (isVipHall) btn.classList.add("vip");
          btn.addEventListener("click", () => selectSeat(r, s, session, hall));
        }

        // Подсветка выбранного
        if (selectedRow === r && selectedSeat === s) {
          btn.classList.remove("free", "vip");
          btn.classList.add("selected");
        }

        container.appendChild(btn);
      }
    }

    document.getElementById("hall-scheme-card").style.display = "block";
  }

  function selectSeat(row, seat, session, hall) {
    selectedRow = row;
    selectedSeat = seat;

    // Цена: VIP-зал или крайние места чуть дороже
    let price = session.basePrice;
    if (hall.type === "VIP") {
      price = Math.round(price * 1.5);
    } else if (seat === 1 || seat === hall.seatsPerRow) {
      price = Math.round(price * 1.1); // крайние места
    }
    currentPrice = price;

    document.getElementById("selected-seat-info").textContent =
      `Выбрано: ряд ${row}, место ${seat}` + (hall.type === "VIP" ? " (VIP)" : "");

    document.getElementById("price-info").textContent = `${price} ₽`;
    document.getElementById("price-card").style.display = "block";

    // Перерисовать схему с выделением
    renderHallScheme(selectedSessionId);
  }

  function getSelection() {
    if (!selectedSessionId || selectedRow === null) return null;
    return {
      sessionId: selectedSessionId,
      row: selectedRow,
      seat: selectedSeat,
      price: currentPrice
    };
  }

  function clearSelection() {
    selectedSessionId = null;
    selectedRow = null;
    selectedSeat = null;
    currentPrice = 0;
    document.getElementById("ticket-session").value = "";
    document.getElementById("hall-scheme-card").style.display = "none";
    document.getElementById("price-card").style.display = "none";
    document.getElementById("selected-seat-info").textContent = "";
  }

  function init() {
    refreshSessions();

    document.getElementById("ticket-session").addEventListener("change", (e) => {
      selectedSessionId = Number(e.target.value) || null;
      selectedRow = null;
      selectedSeat = null;
      document.getElementById("price-card").style.display = "none";
      document.getElementById("selected-seat-info").textContent = "";

      if (selectedSessionId) {
        renderHallScheme(selectedSessionId);
      } else {
        document.getElementById("hall-scheme-card").style.display = "none";
      }
    });

    document.getElementById("btn-to-cash").addEventListener("click", () => {
      // Переключаемся на вкладку «Касса»
      document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      document.querySelector('[data-tab="cash"]').classList.add("active");
      document.getElementById("cash").classList.add("active");

      if (window.CinemaCash) CinemaCash.showPaymentForm(getSelection());
    });
  }

  return {
    init,
    refreshSessions,
    getSelection,
    clearSelection
  };
})();

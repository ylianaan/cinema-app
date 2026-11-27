/**
 * Cinema.Core — общие сущности и хранилище данных
 * Модуль отвечает за работу с данными (аналог слоя доступа к данным)
 */

const CinemaCore = (function () {
  const STORAGE_KEY = "cinema_is_data";

  // Начальные данные (чтобы сразу было что показать)
  const defaultData = {
    films: [
      { id: 1, title: "Интерстеллар", genre: "Фантастика", duration: 169, ageRating: "12+" },
      { id: 2, title: "Дюна: Часть вторая", genre: "Фантастика", duration: 166, ageRating: "12+" },
      { id: 3, title: "Веном 3", genre: "Боевик", duration: 110, ageRating: "16+" }
    ],
    halls: [
      { id: 1, name: "Зал 1", rows: 5, seatsPerRow: 8, type: "Обычный" },
      { id: 2, name: "VIP-зал", rows: 4, seatsPerRow: 6, type: "VIP" }
    ],
    sessions: [],
    tickets: [],
    nextId: { film: 4, hall: 3, session: 1, ticket: 1 }
  };

  function load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Создаём несколько сеансов на сегодня/завтра
      const data = structuredClone(defaultData);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0);
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 19, 30);

      data.sessions = [
        { id: 1, filmId: 1, hallId: 1, datetime: today.toISOString(), basePrice: 350 },
        { id: 2, filmId: 2, hallId: 2, datetime: tomorrow.toISOString(), basePrice: 500 },
        { id: 3, filmId: 3, hallId: 1, datetime: new Date(today.getTime() + 4 * 3600000).toISOString(), basePrice: 300 }
      ];
      data.nextId.session = 4;
      save(data);
      return data;
    }
    return JSON.parse(raw);
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function getData() {
    return load();
  }

  function update(updater) {
    const data = load();
    updater(data);
    save(data);
    return data;
  }

  // --- Фильмы ---
  function addFilm(film) {
    return update(data => {
      film.id = data.nextId.film++;
      data.films.push(film);
    });
  }

  function getFilms() {
    return load().films;
  }

  // --- Залы ---
  function addHall(hall) {
    return update(data => {
      hall.id = data.nextId.hall++;
      data.halls.push(hall);
    });
  }

  function getHalls() {
    return load().halls;
  }

  function getHall(id) {
    return load().halls.find(h => h.id === id);
  }

  // --- Сеансы ---
  function addSession(session) {
    return update(data => {
      session.id = data.nextId.session++;
      data.sessions.push(session);
    });
  }

  function getSessions() {
    return load().sessions;
  }

  function getSession(id) {
    return load().sessions.find(s => s.id === id);
  }

  // --- Билеты и занятость мест ---
  function getOccupiedSeats(sessionId) {
    return load().tickets
      .filter(t => t.sessionId === sessionId)
      .map(t => `${t.row}-${t.seat}`);
  }

  function isSeatOccupied(sessionId, row, seat) {
    return getOccupiedSeats(sessionId).includes(`${row}-${seat}`);
  }

  /**
   * Попытка занять место (интеграция + контроль занятости)
   * Возвращает true, если место успешно занято
   */
  function tryOccupySeat(sessionId, row, seat, price, paymentMethod) {
    const data = load();

    const alreadyTaken = data.tickets.some(
      t => t.sessionId === sessionId && t.row === row && t.seat === seat
    );

    if (alreadyTaken) {
      return { success: false, error: "Место уже занято" };
    }

    const session = data.sessions.find(s => s.id === sessionId);
    if (!session) {
      return { success: false, error: "Сеанс не найден" };
    }

    const ticket = {
      id: data.nextId.ticket++,
      sessionId,
      row,
      seat,
      price,
      paymentMethod,
      saleDateTime: new Date().toISOString()
    };

    data.tickets.push(ticket);
    save(data);

    return { success: true, ticket };
  }

  function getTickets() {
    return load().tickets;
  }

  return {
    getData,
    addFilm,
    getFilms,
    addHall,
    getHalls,
    getHall,
    addSession,
    getSessions,
    getSession,
    getOccupiedSeats,
    isSeatOccupied,
    tryOccupySeat,
    getTickets
  };
})();

// ========== МОДУЛЬ ДАННЫХ (Cinema.Core + хранилище) ==========

const HALLS = {
  1: { name: "Зал 1", rows: 8, cols: 12, vipRows: [7, 8] },
  2: { name: "Зал 2", rows: 6, cols: 10, vipRows: [5, 6] },
  3: { name: "Зал VIP", rows: 5, cols: 8, vipRows: [1, 2, 3, 4, 5] }
};

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getFilms() {
  return load("cinema_films", []);
}

function addFilm(film) {
  const films = getFilms();
  film.id = Date.now();
  films.push(film);
  save("cinema_films", films);
  return film;
}

function updateFilm(id, data) {
  const films = getFilms();
  const idx = films.findIndex(f => f.id === id);
  if (idx !== -1) {
    films[idx] = { ...films[idx], ...data };
    save("cinema_films", films);
  }
}

function deleteFilm(id) {
  let films = getFilms().filter(f => f.id !== id);
  save("cinema_films", films);
  let sessions = getSessions().filter(s => s.filmId !== id);
  save("cinema_sessions", sessions);
}

function getSessions() {
  return load("cinema_sessions", []);
}

function addSession(session) {
  const sessions = getSessions();
  session.id = Date.now();
  session.occupied = {};
  sessions.push(session);
  save("cinema_sessions", sessions);
  return session;
}

function updateSessionData(id, data) {
  const sessions = getSessions();
  const idx = sessions.findIndex(s => s.id === id);
  if (idx !== -1) {
    // сохраняем занятость мест
    const occupied = sessions[idx].occupied || {};
    sessions[idx] = { ...sessions[idx], ...data, occupied };
    save("cinema_sessions", sessions);
  }
}

function deleteSession(id) {
  let sessions = getSessions().filter(s => s.id !== id);
  save("cinema_sessions", sessions);
}

function getSessionById(id) {
  return getSessions().find(s => s.id === Number(id));
}

function updateSession(session) {
  const sessions = getSessions();
  const idx = sessions.findIndex(s => s.id === session.id);
  if (idx !== -1) {
    sessions[idx] = session;
    save("cinema_sessions", sessions);
  }
}

function getTickets() {
  return load("cinema_tickets", []);
}

function addTicket(ticket) {
  const tickets = getTickets();
  ticket.id = Date.now() + Math.random();
  ticket.saleDateTime = new Date().toISOString();
  tickets.push(ticket);
  save("cinema_tickets", tickets);
  return ticket;
}

function isSeatOccupied(session, row, col) {
  return !!session.occupied[`${row}-${col}`];
}

function occupySeat(session, row, col) {
  if (isSeatOccupied(session, row, col)) {
    throw new Error(`Место ${row}-${col} уже занято`);
  }
  session.occupied[`${row}-${col}`] = true;
  updateSession(session);
}

function cancelTicket(ticketId) {
  const tickets = getTickets();
  const ticket = tickets.find(t => String(t.id) === String(ticketId));
  if (!ticket) return false;

  // освобождаем место в сеансе
  const session = getSessionById(ticket.sessionId);
  if (session && session.occupied) {
    delete session.occupied[`${ticket.row}-${ticket.col}`];
    updateSession(session);
  }

  const next = tickets.filter(t => String(t.id) !== String(ticketId));
  save("cinema_tickets", next);
  return true;
}

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} мин`;
  if (m === 0) return `${h} ч`;
  return `${h} ч ${m} мин`;
}

const ROOMS = Array.from({ length: 7 }, (_, index) => ({
  id: `room-${index + 1}`,
  number: index + 1,
}));

const STORAGE_KEY = "casa-lidia-bookings";
const LANGUAGE_STORAGE_KEY = "casa-lidia-language";
const TRANSLATIONS = {
  en: {
    appTitle: "Room Availability",
    calendarView: "Calendar view",
    language: "Language",
    month: "Month",
    week: "Week",
    booking: "Booking",
    newBooking: "New",
    room: "Room",
    from: "From",
    to: "To",
    touristName: "Tourist name",
    namePlaceholder: "Name",
    phone: "Phone",
    phonePlaceholder: "Phone number",
    people: "People",
    notes: "Notes",
    optional: "Optional",
    saveBooking: "Save Booking",
    deleteBooking: "Delete",
    upcoming: "Upcoming",
    previousRange: "Previous range",
    nextRange: "Next range",
    available: "Available",
    unavailable: "Unavailable",
    weeklyCalendar: "Weekly Calendar",
    noUpcoming: "No upcoming bookings.",
    free: "Free",
    bookingSaved: "Booking saved.",
    bookingDeleted: "Booking deleted.",
    invalidDateRange: "End date must be the same day or after the start date.",
    overlap: "That room is already unavailable for one or more selected days.",
    person: "person",
    peoplePlural: "people",
  },
  ro: {
    appTitle: "Disponibilitate camere",
    calendarView: "Vizualizare calendar",
    language: "Limbă",
    month: "Lună",
    week: "Săptămână",
    booking: "Rezervare",
    newBooking: "Nou",
    room: "Camera",
    from: "De la",
    to: "Până la",
    touristName: "Nume turist",
    namePlaceholder: "Nume",
    phone: "Telefon",
    phonePlaceholder: "Număr de telefon",
    people: "Persoane",
    notes: "Observații",
    optional: "Opțional",
    saveBooking: "Salvează rezervarea",
    deleteBooking: "Șterge",
    upcoming: "Urmează",
    previousRange: "Perioada anterioară",
    nextRange: "Perioada următoare",
    available: "Disponibil",
    unavailable: "Indisponibil",
    weeklyCalendar: "Calendar săptămânal",
    noUpcoming: "Nu există rezervări viitoare.",
    free: "Liber",
    bookingSaved: "Rezervarea a fost salvată.",
    bookingDeleted: "Rezervarea a fost ștearsă.",
    invalidDateRange: "Data de final trebuie să fie în aceeași zi sau după data de început.",
    overlap: "Camera este deja indisponibilă pentru una sau mai multe zile selectate.",
    person: "persoană",
    peoplePlural: "persoane",
  },
};
const today = startOfDay(new Date());

const state = {
  view: "month",
  cursor: new Date(today.getFullYear(), today.getMonth(), 1),
  bookings: loadBookings(),
  selectedDate: toISODate(today),
  language: loadLanguage(),
};

const elements = {
  languageButtons: document.querySelectorAll(".language-button"),
  viewButtons: document.querySelectorAll(".toggle-button"),
  calendarGrid: document.querySelector("#calendar-grid"),
  calendarTitle: document.querySelector("#calendar-title"),
  rangeSubtitle: document.querySelector("#range-subtitle"),
  previousRange: document.querySelector("#previous-range"),
  nextRange: document.querySelector("#next-range"),
  form: document.querySelector("#booking-form"),
  bookingId: document.querySelector("#booking-id"),
  room: document.querySelector("#room"),
  startDate: document.querySelector("#start-date"),
  endDate: document.querySelector("#end-date"),
  guestName: document.querySelector("#guest-name"),
  phone: document.querySelector("#phone"),
  people: document.querySelector("#people"),
  notes: document.querySelector("#notes"),
  clearForm: document.querySelector("#clear-form"),
  deleteBooking: document.querySelector("#delete-booking"),
  bookingList: document.querySelector("#booking-list"),
  toast: document.querySelector("#toast"),
};

initialize();

function initialize() {
  populateRooms();
  bindEvents();
  resetForm();
  render();
}

function populateRooms() {
  const selectedRoom = elements.room.value || ROOMS[0].id;
  elements.room.innerHTML = ROOMS.map(
    (room) => `<option value="${room.id}">${getRoomName(room)}</option>`,
  ).join("");
  elements.room.value = selectedRoom;
}

function bindEvents() {
  elements.languageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.language = button.dataset.language;
      localStorage.setItem(LANGUAGE_STORAGE_KEY, state.language);
      render();
    });
  });

  elements.viewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view;
      if (state.view === "month") {
        state.cursor = new Date(state.cursor.getFullYear(), state.cursor.getMonth(), 1);
      } else {
        state.cursor = startOfWeek(state.cursor);
      }
      render();
    });
  });

  elements.previousRange.addEventListener("click", () => {
    state.cursor =
      state.view === "month"
        ? new Date(state.cursor.getFullYear(), state.cursor.getMonth() - 1, 1)
        : addDays(state.cursor, -7);
    render();
  });

  elements.nextRange.addEventListener("click", () => {
    state.cursor =
      state.view === "month"
        ? new Date(state.cursor.getFullYear(), state.cursor.getMonth() + 1, 1)
        : addDays(state.cursor, 7);
    render();
  });

  elements.startDate.addEventListener("change", () => {
    if (!elements.endDate.value || elements.endDate.value < elements.startDate.value) {
      elements.endDate.value = elements.startDate.value;
    }
  });

  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    saveBooking();
  });

  elements.clearForm.addEventListener("click", resetForm);
  elements.deleteBooking.addEventListener("click", deleteSelectedBooking);
}

function render() {
  renderStaticText();
  renderLanguageToggle();
  renderViewToggle();
  renderCalendar();
  renderBookingList();
}

function renderStaticText() {
  document.documentElement.lang = state.language;
  document.title = `Casa Lidia ${t("appTitle")}`;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.placeholder = t(element.dataset.i18nPlaceholder);
  });

  document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
    element.setAttribute("aria-label", t(element.dataset.i18nAria));
  });

  const languageToggle = document.querySelector(".language-toggle");
  languageToggle.setAttribute("aria-label", t("language"));
  populateRooms();
}

function renderLanguageToggle() {
  elements.languageButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.language === state.language);
  });
}

function renderViewToggle() {
  elements.viewButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === state.view);
  });
}

function renderCalendar() {
  const dates = state.view === "month" ? getMonthDates(state.cursor) : getWeekDates(state.cursor);
  const rangeStart = dates[0];
  const rangeEnd = dates[dates.length - 1];
  const rangeStartISO = toISODate(rangeStart);
  const rangeEndISO = toISODate(rangeEnd);

  elements.calendarGrid.className = `calendar-grid ${state.view}`;
  elements.calendarGrid.style.setProperty("--day-count", String(dates.length));
  elements.calendarTitle.textContent =
    state.view === "month" ? formatMonth(state.cursor) : t("weeklyCalendar");
  elements.rangeSubtitle.textContent = `${formatReadableDate(rangeStart)} - ${formatReadableDate(
    rangeEnd,
  )}`;

  const fragments = [];
  fragments.push(
    `<div class="grid-cell header-cell corner-cell" role="columnheader" style="grid-row: 1; grid-column: 1;">${t(
      "room",
    )}</div>`,
  );

  dates.forEach((date, dateIndex) => {
    const label =
      state.view === "month"
        ? `${date.getDate()}`
        : `${weekdayShort(date)} ${date.getDate()}`;
    fragments.push(
      `<div class="grid-cell header-cell" role="columnheader" style="grid-row: 1; grid-column: ${
        dateIndex + 2
      };">${label}</div>`,
    );
  });

  ROOMS.forEach((room, roomIndex) => {
    const gridRow = roomIndex + 2;
    const roomName = getRoomName(room);
    fragments.push(
      `<div class="grid-cell room-cell" role="rowheader" style="grid-row: ${gridRow}; grid-column: 1;">${roomName}</div>`,
    );

    dates.forEach((date, dateIndex) => {
      const booking = findBooking(room.id, date);
      const isoDate = toISODate(date);
      const isToday = isoDate === toISODate(today);
      const title = booking
        ? `${roomName}: ${booking.guestName}, ${formatPeople(booking.people)}, ${booking.phone}`
        : `${roomName}: ${t("available").toLowerCase()}`;

      fragments.push(`
        <div class="grid-cell day-cell" role="gridcell" style="grid-row: ${gridRow}; grid-column: ${
          dateIndex + 2
        };">
          <button
            class="day-button ${booking ? "occupied" : ""} ${isToday ? "today" : ""}"
            type="button"
            data-room-id="${room.id}"
            data-date="${isoDate}"
            ${booking ? `data-booking-id="${booking.id}"` : ""}
            title="${escapeAttribute(title)}"
          >
            <span class="day-number">${date.getDate()}</span>
            ${booking ? "" : `<span class="cell-meta">${t("free")}</span>`}
          </button>
        </div>
      `);
    });

    getVisibleBookings(room.id, rangeStartISO, rangeEndISO).forEach((booking) => {
      const startColumn =
        dates.findIndex((date) => toISODate(date) === maxISODate(booking.startDate, rangeStartISO)) +
        2;
      const endColumn =
        dates.findIndex((date) => toISODate(date) === minISODate(booking.endDate, rangeEndISO)) +
        3;
      const bookingRoomName = getRoomName(ROOMS.find((item) => item.id === booking.roomId));
      const title = `${bookingRoomName}: ${booking.guestName}, ${formatPeople(booking.people)}, ${
        booking.phone
      }`;

      fragments.push(`
        <button
          class="booking-span"
          type="button"
          data-booking-id="${booking.id}"
          style="grid-row: ${gridRow}; grid-column: ${startColumn} / ${endColumn};"
          title="${escapeAttribute(title)}"
        >
          <strong>${escapeHtml(booking.guestName)}</strong>
          <span>${formatPeople(booking.people)} - ${escapeHtml(booking.phone)}</span>
        </button>
      `);
    });
  });

  elements.calendarGrid.innerHTML = fragments.join("");
  elements.calendarGrid.querySelectorAll(".day-button").forEach((button) => {
    button.addEventListener("click", () => handleCalendarCellClick(button));
  });
  elements.calendarGrid.querySelectorAll(".booking-span").forEach((button) => {
    button.addEventListener("click", () => editBooking(button.dataset.bookingId));
  });
}

function renderBookingList() {
  const sorted = [...state.bookings]
    .filter((booking) => booking.endDate >= toISODate(today))
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.roomId.localeCompare(b.roomId));

  if (sorted.length === 0) {
    elements.bookingList.innerHTML = `<p class="empty-state">${t("noUpcoming")}</p>`;
    return;
  }

  elements.bookingList.innerHTML = sorted
    .map((booking) => {
      const room = ROOMS.find((item) => item.id === booking.roomId);
      return `
        <button class="booking-item" type="button" data-booking-id="${booking.id}">
          <strong>${escapeHtml(booking.guestName)}</strong>
          <span>${getRoomName(room)} - ${formatISODate(booking.startDate)} - ${formatISODate(
            booking.endDate,
          )}</span>
          <span>${formatPeople(booking.people)} - ${escapeHtml(booking.phone)}</span>
        </button>
      `;
    })
    .join("");

  elements.bookingList.querySelectorAll(".booking-item").forEach((button) => {
    button.addEventListener("click", () => editBooking(button.dataset.bookingId));
  });
}

function handleCalendarCellClick(button) {
  const bookingId = button.dataset.bookingId;
  if (bookingId) {
    editBooking(bookingId);
    return;
  }

  elements.bookingId.value = "";
  elements.room.value = button.dataset.roomId;
  elements.startDate.value = button.dataset.date;
  elements.endDate.value = button.dataset.date;
  elements.guestName.value = "";
  elements.phone.value = "";
  elements.people.value = "2";
  elements.notes.value = "";
  elements.deleteBooking.classList.add("hidden");
  elements.guestName.focus();
}

function saveBooking() {
  const booking = {
    id: elements.bookingId.value || createId(),
    roomId: elements.room.value,
    startDate: elements.startDate.value,
    endDate: elements.endDate.value,
    guestName: elements.guestName.value.trim(),
    phone: elements.phone.value.trim(),
    people: Number(elements.people.value),
    notes: elements.notes.value.trim(),
  };

  if (booking.endDate < booking.startDate) {
    showToast(t("invalidDateRange"));
    return;
  }

  const overlap = state.bookings.find((existing) => {
    if (existing.id === booking.id || existing.roomId !== booking.roomId) return false;
    return rangesOverlap(existing.startDate, existing.endDate, booking.startDate, booking.endDate);
  });

  if (overlap) {
    showToast(t("overlap"));
    return;
  }

  state.bookings = [
    ...state.bookings.filter((existing) => existing.id !== booking.id),
    booking,
  ].sort((a, b) => a.startDate.localeCompare(b.startDate));

  persistBookings();
  editBooking(booking.id);
  render();
  showToast(t("bookingSaved"));
}

function editBooking(id) {
  const booking = state.bookings.find((item) => item.id === id);
  if (!booking) return;

  elements.bookingId.value = booking.id;
  elements.room.value = booking.roomId;
  elements.startDate.value = booking.startDate;
  elements.endDate.value = booking.endDate;
  elements.guestName.value = booking.guestName;
  elements.phone.value = booking.phone;
  elements.people.value = booking.people;
  elements.notes.value = booking.notes || "";
  elements.deleteBooking.classList.remove("hidden");
  focusVisibleRange(booking);
}

function deleteSelectedBooking() {
  const id = elements.bookingId.value;
  if (!id) return;

  state.bookings = state.bookings.filter((booking) => booking.id !== id);
  persistBookings();
  resetForm();
  render();
  showToast(t("bookingDeleted"));
}

function resetForm() {
  elements.bookingId.value = "";
  elements.room.value = ROOMS[0].id;
  elements.startDate.value = state.selectedDate;
  elements.endDate.value = state.selectedDate;
  elements.guestName.value = "";
  elements.phone.value = "";
  elements.people.value = "2";
  elements.notes.value = "";
  elements.deleteBooking.classList.add("hidden");
}

function focusVisibleRange(booking) {
  const bookingStart = parseISODate(booking.startDate);
  if (state.view === "month") {
    state.cursor = new Date(bookingStart.getFullYear(), bookingStart.getMonth(), 1);
  } else {
    state.cursor = startOfWeek(bookingStart);
  }
  render();
}

function findBooking(roomId, date) {
  const isoDate = toISODate(date);
  return state.bookings.find(
    (booking) =>
      booking.roomId === roomId && isoDate >= booking.startDate && isoDate <= booking.endDate,
  );
}

function getVisibleBookings(roomId, rangeStart, rangeEnd) {
  return state.bookings.filter(
    (booking) =>
      booking.roomId === roomId && rangesOverlap(booking.startDate, booking.endDate, rangeStart, rangeEnd),
  );
}

function loadBookings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistBookings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.bookings));
}

function loadLanguage() {
  const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return TRANSLATIONS[storedLanguage] ? storedLanguage : "en";
}

function getMonthDates(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const count = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: count }, (_, index) => new Date(year, month, index + 1));
}

function getWeekDates(date) {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

function startOfWeek(date) {
  const clone = startOfDay(date);
  const day = clone.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(clone, diff);
}

function addDays(date, days) {
  const clone = new Date(date);
  clone.setDate(clone.getDate() + days);
  return clone;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseISODate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function rangesOverlap(startA, endA, startB, endB) {
  return startA <= endB && startB <= endA;
}

function maxISODate(first, second) {
  return first > second ? first : second;
}

function minISODate(first, second) {
  return first < second ? first : second;
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `booking-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function t(key) {
  return TRANSLATIONS[state.language][key] || TRANSLATIONS.en[key] || key;
}

function getRoomName(room) {
  return `${t("room")} ${room.number}`;
}

function formatPeople(count) {
  const label = Number(count) === 1 ? t("person") : t("peoplePlural");
  return `${count} ${label}`;
}

function formatMonth(date) {
  return capitalizeFirst(
    new Intl.DateTimeFormat(getLocale(), { month: "long", year: "numeric" }).format(date),
  );
}

function formatReadableDate(date) {
  return new Intl.DateTimeFormat(getLocale(), {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatISODate(value) {
  return formatReadableDate(parseISODate(value));
}

function weekdayShort(date) {
  return capitalizeFirst(new Intl.DateTimeFormat(getLocale(), { weekday: "short" }).format(date));
}

function getLocale() {
  return state.language === "ro" ? "ro-RO" : "en";
}

function capitalizeFirst(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("\n", " ");
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    elements.toast.classList.remove("show");
  }, 2600);
}

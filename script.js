const ROOMS = [
  ...Array.from({ length: 7 }, (_, index) => ({
    id: `room-${index + 1}`,
    number: index + 1,
  })),
  {
    id: "casuta",
    name: "Casuta",
  },
];

const STORAGE_KEY = "casa-lidia-bookings";
const BACKUP_STORAGE_KEY = "casa-lidia-bookings-backup";
const API_BOOKINGS_ENDPOINT = "/api/bookings";
const ACCESS_STORAGE_KEY = "casa-lidia-access-granted";
const ACCESS_HASH_STORAGE_KEY = "casa-lidia-access-hash";
const ACCESS_CODE_HASH = "44b350ed060a41a1af57c7d07ed0aca3039777404d3a09d0380e68b6977d9874";
const TRANSLATIONS = {
  accessTitle: "Acces privat",
  accessCode: "Cod de acces",
  accessCodePlaceholder: "Cod de acces",
  unlock: "Deblochează",
  accessError: "Codul de acces nu este corect.",
  appTitle: "Disponibilitate camere",
  calendarView: "Vizualizare calendar",
  month: "Lună",
  week: "Săptămână",
  booking: "Rezervare",
  newBooking: "Adaugă",
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
  minimizeReservation: "Minimizează rezervarea",
  expandReservation: "Extinde rezervarea",
  available: "Disponibil",
  unavailable: "Indisponibil",
  weeklyCalendar: "Calendar săptămânal",
  noUpcoming: "Nu există rezervări viitoare.",
  exportBookings: "Export",
  importBookings: "Import",
  free: "Liber",
  bookingSaved: "Rezervarea a fost salvată.",
  bookingDeleted: "Rezervarea a fost ștearsă.",
  backupRestored: "Rezervările au fost restaurate din backup-ul local.",
  exportReady: "Exportul rezervărilor a fost descărcat.",
  importComplete: "Rezervările importate au fost adăugate.",
  importInvalid: "Fișierul nu conține rezervări valide.",
  storageError: "Rezervările nu au putut fi salvate în acest browser.",
  serverSyncError: "Sincronizarea cu serverul nu este disponibilă. Backup-ul local este salvat.",
  serverSynced: "Rezervările sunt salvate pe server.",
  invalidDateRange: "Data de final trebuie să fie în aceeași zi sau după data de început.",
  overlap: "Camera este deja indisponibilă pentru una sau mai multe zile selectate.",
  person: "persoană",
  peoplePlural: "persoane",
};
const today = startOfDay(new Date());

const state = {
  view: "month",
  cursor: new Date(today.getFullYear(), today.getMonth(), 1),
  bookings: loadBookings(),
  selectedDate: toISODate(today),
  accessGranted: sessionStorage.getItem(ACCESS_STORAGE_KEY) === "true",
  accessHash: sessionStorage.getItem(ACCESS_HASH_STORAGE_KEY) || "",
  bookingPanelCollapsed: window.matchMedia("(max-width: 920px)").matches,
  serverAvailable: false,
};

const elements = {
  accessScreen: document.querySelector("#access-screen"),
  appShell: document.querySelector("#app-shell"),
  accessForm: document.querySelector("#access-form"),
  accessCode: document.querySelector("#access-code"),
  accessError: document.querySelector("#access-error"),
  viewButtons: document.querySelectorAll(".toggle-button"),
  calendarGrid: document.querySelector("#calendar-grid"),
  calendarTitle: document.querySelector("#calendar-title"),
  rangeSubtitle: document.querySelector("#range-subtitle"),
  occupancySummary: document.querySelector("#occupancy-summary"),
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
  toggleBookingPanel: document.querySelector("#toggle-booking-panel"),
  bookingPanel: document.querySelector(".booking-panel"),
  deleteBooking: document.querySelector("#delete-booking"),
  exportBookings: document.querySelector("#export-bookings"),
  importBookings: document.querySelector("#import-bookings"),
  importFile: document.querySelector("#import-file"),
  bookingList: document.querySelector("#booking-list"),
  toast: document.querySelector("#toast"),
};

initialize();

function initialize() {
  populateRooms();
  bindEvents();
  resetForm();
  render();
  if (state.accessGranted) {
    hydrateBookingsFromServer();
  }
}

function populateRooms() {
  const selectedRoom = elements.room.value || ROOMS[0].id;
  elements.room.innerHTML = ROOMS.map(
    (room) => `<option value="${room.id}">${getRoomName(room)}</option>`,
  ).join("");
  elements.room.value = selectedRoom;
}

function bindEvents() {
  elements.accessForm.addEventListener("submit", (event) => {
    event.preventDefault();
    unlockApp();
  });

  elements.viewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view;
      if (state.view === "month") {
        state.cursor = new Date(today.getFullYear(), today.getMonth(), 1);
      } else {
        state.cursor = startOfWeek(today);
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

  elements.clearForm.addEventListener("click", () => {
    resetForm();
    expandBookingPanel();
  });
  elements.toggleBookingPanel.addEventListener("click", toggleBookingPanel);
  elements.deleteBooking.addEventListener("click", deleteSelectedBooking);
  elements.exportBookings.addEventListener("click", exportBookings);
  elements.importBookings.addEventListener("click", () => elements.importFile.click());
  elements.importFile.addEventListener("change", importBookings);
}

function render() {
  renderStaticText();
  renderAccessState();
  renderBookingPanelState();
  renderViewToggle();
  renderCalendar();
  renderBookingList();
}

function renderStaticText() {
  document.documentElement.lang = "ro";
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

  if (elements.accessError.textContent) {
    elements.accessError.textContent = t("accessError");
  }
  populateRooms();
}

function renderViewToggle() {
  elements.viewButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === state.view);
  });
}

function renderAccessState() {
  elements.accessScreen.classList.toggle("hidden", state.accessGranted);
  elements.appShell.classList.toggle("hidden", !state.accessGranted);
}

function renderBookingPanelState() {
  elements.bookingPanel.classList.toggle("collapsed", state.bookingPanelCollapsed);
  elements.toggleBookingPanel.textContent = state.bookingPanelCollapsed ? "+" : "-";
  elements.toggleBookingPanel.setAttribute(
    "aria-label",
    t(state.bookingPanelCollapsed ? "expandReservation" : "minimizeReservation"),
  );
  elements.toggleBookingPanel.setAttribute("aria-expanded", String(!state.bookingPanelCollapsed));
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
  elements.occupancySummary.innerHTML = renderOccupancySummary(dates);

  const fragments = [];
  fragments.push(
    `<div class="grid-cell header-cell corner-cell" role="columnheader" style="grid-row: 1; grid-column: 1;">${t(
      "room",
    )}</div>`,
  );

  dates.forEach((date, dateIndex) => {
    const dayName = weekdayShort(date);
    fragments.push(
      `<div class="grid-cell header-cell" role="columnheader" style="grid-row: 1; grid-column: ${
        dateIndex + 2
      };">
        <span class="header-weekday">${dayName}</span>
        <span class="header-day">${date.getDate()}</span>
      </div>`,
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
  expandBookingPanel();
  elements.guestName.focus();
}

async function unlockApp() {
  const accessCodeHash = await sha256Hex(elements.accessCode.value.trim());

  if (accessCodeHash !== ACCESS_CODE_HASH) {
    elements.accessError.textContent = t("accessError");
    elements.accessCode.select();
    return;
  }

  state.accessGranted = true;
  state.accessHash = accessCodeHash;
  sessionStorage.setItem(ACCESS_STORAGE_KEY, "true");
  sessionStorage.setItem(ACCESS_HASH_STORAGE_KEY, accessCodeHash);
  elements.accessError.textContent = "";
  render();
  hydrateBookingsFromServer();
}

function toggleBookingPanel() {
  state.bookingPanelCollapsed = !state.bookingPanelCollapsed;
  renderBookingPanelState();
}

function expandBookingPanel() {
  if (!state.bookingPanelCollapsed) return;

  state.bookingPanelCollapsed = false;
  renderBookingPanelState();
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
  expandBookingPanel();
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

function exportBookings() {
  const payload = {
    exportedAt: new Date().toISOString(),
    bookings: state.bookings,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = `casa-lidia-bookings-${toISODate(today)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  showToast(t("exportReady"));
}

async function importBookings() {
  const file = elements.importFile.files[0];
  if (!file) return;

  try {
    const parsedBookings = JSON.parse(await file.text());
    const importedBookings = normalizeBookings(parsedBookings);
    if (importedBookings.length === 0) {
      showToast(t("importInvalid"));
      return;
    }

    state.bookings = mergeBookings(state.bookings, importedBookings);
    persistBookings();
    render();
    showToast(t("importComplete"));
  } catch {
    showToast(t("importInvalid"));
  } finally {
    elements.importFile.value = "";
  }
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

function renderOccupancySummary(dates) {
  const weekGroups = getVisibleWeekGroups(dates);

  return weekGroups
    .map(
      (weekDates) => `
        <span class="occupancy-pill">
          ${formatCompactDateRange(weekDates[0], weekDates[weekDates.length - 1])}:
          <strong>${calculateOccupancyPercent(weekDates)}%</strong>
        </span>
      `,
    )
    .join("");
}

function calculateOccupancyPercent(dates) {
  const occupiedNights = ROOMS.reduce(
    (total, room) =>
      total + dates.filter((date) => Boolean(findBooking(room.id, date))).length,
    0,
  );
  const totalNights = ROOMS.length * dates.length;

  return totalNights === 0 ? 0 : Math.round((occupiedNights / totalNights) * 100);
}

function getVisibleWeekGroups(dates) {
  return dates.reduce((groups, date) => {
    const weekKey = toISODate(startOfWeek(date));
    const currentGroup = groups.find((group) => group.weekKey === weekKey);

    if (currentGroup) {
      currentGroup.dates.push(date);
    } else {
      groups.push({ weekKey, dates: [date] });
    }

    return groups;
  }, []).map((group) => group.dates);
}

async function hydrateBookingsFromServer() {
  const localBookings = loadBookings();
  const serverBookings = await fetchServerBookings();

  if (!serverBookings) return;

  state.serverAvailable = true;

  if (serverBookings.length === 0 && localBookings.length > 0) {
    state.bookings = localBookings;
    persistBookings();
    render();
    return;
  }

  state.bookings = serverBookings;
  persistBookingsLocally();
  render();
}

function persistBookings() {
  persistBookingsLocally();
  saveBookingsToServer();
}

function persistBookingsLocally() {
  try {
    const serializedBookings = JSON.stringify(state.bookings);
    localStorage.setItem(STORAGE_KEY, serializedBookings);
    localStorage.setItem(BACKUP_STORAGE_KEY, serializedBookings);
  } catch {
    showToast(t("storageError"));
  }
}

async function fetchServerBookings() {
  try {
    const response = await fetch(API_BOOKINGS_ENDPOINT, {
      cache: "no-store",
      headers: createApiHeaders({ Accept: "application/json" }),
    });

    if (!response.ok) return null;

    return normalizeBookings(await response.json());
  } catch {
    return null;
  }
}

async function saveBookingsToServer() {
  try {
    const response = await fetch(API_BOOKINGS_ENDPOINT, {
      method: "PUT",
      headers: createApiHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(state.bookings),
    });

    if (!response.ok) throw new Error("Server rejected bookings");
    state.serverAvailable = true;
  } catch {
    state.serverAvailable = false;
    showToast(t("serverSyncError"));
  }
}

function createApiHeaders(headers = {}) {
  return {
    ...headers,
    "X-Access-Code-Hash": state.accessHash,
  };
}

function loadBookings() {
  const primaryBookings = readStoredBookings(STORAGE_KEY);
  if (primaryBookings.length > 0) return primaryBookings;

  const backupBookings = readStoredBookings(BACKUP_STORAGE_KEY);
  if (backupBookings.length > 0) {
    return backupBookings;
  }

  return [];
}

function readStoredBookings(key) {
  try {
    const rawBookings = localStorage.getItem(key);
    if (!rawBookings) return [];

    const parsedBookings = JSON.parse(rawBookings);
    return normalizeBookings(parsedBookings);
  } catch {
    return [];
  }
}

function normalizeBookings(value) {
  const rawBookings = Array.isArray(value) ? value : value?.bookings;
  if (!Array.isArray(rawBookings)) return [];

  return rawBookings
    .map((booking) => ({
      id: typeof booking.id === "string" && booking.id ? booking.id : createId(),
      roomId: typeof booking.roomId === "string" ? booking.roomId : "",
      startDate: typeof booking.startDate === "string" ? booking.startDate : "",
      endDate: typeof booking.endDate === "string" ? booking.endDate : "",
      guestName: typeof booking.guestName === "string" ? booking.guestName : "",
      phone: typeof booking.phone === "string" ? booking.phone : "",
      people: Number(booking.people) || 1,
      notes: typeof booking.notes === "string" ? booking.notes : "",
    }))
    .filter(
      (booking) =>
        ROOMS.some((room) => room.id === booking.roomId) &&
        isISODate(booking.startDate) &&
        isISODate(booking.endDate) &&
        booking.endDate >= booking.startDate &&
        booking.guestName,
    )
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

function mergeBookings(currentBookings, importedBookings) {
  const mergedBookings = [...currentBookings];

  importedBookings.forEach((importedBooking) => {
    const existingIndex = mergedBookings.findIndex((booking) => booking.id === importedBooking.id);
    if (existingIndex >= 0) {
      mergedBookings[existingIndex] = importedBooking;
      return;
    }

    const hasOverlap = mergedBookings.some(
      (booking) =>
        booking.roomId === importedBooking.roomId &&
        rangesOverlap(
          booking.startDate,
          booking.endDate,
          importedBooking.startDate,
          importedBooking.endDate,
        ),
    );

    if (!hasOverlap) {
      mergedBookings.push(importedBooking);
    }
  });

  return mergedBookings.sort((a, b) => a.startDate.localeCompare(b.startDate));
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

function isISODate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
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
  return TRANSLATIONS[key] || key;
}

function getRoomName(room) {
  if (room.name) {
    return room.name;
  }

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

function formatCompactDateRange(startDate, endDate) {
  const formatter = new Intl.DateTimeFormat(getLocale(), {
    day: "numeric",
    month: "short",
  });

  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
}

function weekdayShort(date) {
  return capitalizeFirst(new Intl.DateTimeFormat(getLocale(), { weekday: "short" }).format(date));
}

function getLocale() {
  return "ro-RO";
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

async function sha256Hex(value) {
  const encodedValue = new TextEncoder().encode(value);
  const digest = await window.crypto.subtle.digest("SHA-256", encodedValue);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    elements.toast.classList.remove("show");
  }, 2600);
}

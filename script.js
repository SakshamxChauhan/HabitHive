
const API_URL = "https://jsonplaceholder.typicode.com/todos?_limit=12";
const STORAGE_KEY = "habitTrackerData_v1";

const state = {
  habits: [],
  filter: "all",
  sort: "default",
  search: "",
};

const habitForm = document.getElementById("habit-form");
const habitInput = document.getElementById("habit-input");
const searchInput = document.getElementById("search-input");
const filterSelect = document.getElementById("filter-select");
const sortSelect = document.getElementById("sort-select");
const habitList = document.getElementById("habit-list");
const progressText = document.getElementById("progress-text");
const progressFill = document.getElementById("progress-fill");

const generateId = () =>
  (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);

// Persist habits to localStorage for a better user experience.
const saveHabits = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.habits));
};

const loadHabits = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    console.error("Failed to parse localStorage data:", error);
    return null;
  }
};

const updateProgress = () => {
  const total = state.habits.length;
  const completedCount = state.habits.filter((habit) => habit.completed).length;
  const percentage = total ? (completedCount / total) * 100 : 0;

  progressText.textContent = `${completedCount} / ${total} completed`;
  progressFill.style.width = `${percentage}%`;
};

const getProcessedHabits = () => {
  let habits = [...state.habits];

  if (state.search.trim()) {
    const query = state.search.toLowerCase();
    habits = habits.filter((habit) => habit.title.toLowerCase().includes(query));
  }

  if (state.filter === "completed") {
    habits = habits.filter((habit) => habit.completed);
  } else if (state.filter === "incomplete") {
    habits = habits.filter((habit) => !habit.completed);
  }

  if (state.sort === "alphabetical") {
    habits.sort((a, b) => a.title.localeCompare(b.title));
  } else if (state.sort === "status") {
    habits.sort((a, b) => Number(a.completed) - Number(b.completed));
  }

  return habits;
};

const createHabitItemMarkup = (habit) => `
  <li class="habit-item">
    <div class="habit-main">
      <input
        type="checkbox"
        class="toggle-checkbox"
        data-id="${habit.id}"
        ${habit.completed ? "checked" : ""}
        aria-label="Mark ${habit.title} as completed"
      />
      <p class="habit-title ${habit.completed ? "completed" : ""}">${habit.title}</p>
    </div>
    <button class="delete-btn" data-id="${habit.id}" aria-label="Delete ${habit.title}">
      Delete
    </button>
  </li>
`;

const renderHabits = () => {
  const habits = getProcessedHabits();

  if (!habits.length) {
    habitList.innerHTML = `<li class="empty-state">No habits found.</li>`;
    updateProgress();
    return;
  }

  // map() is used to transform each habit object into HTML markup.
  habitList.innerHTML = habits.map(createHabitItemMarkup).join("");
  updateProgress();
};

const addHabit = (title) => {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) return;

  state.habits.unshift({
    id: generateId(),
    title: trimmedTitle,
    completed: false,
  });

  saveHabits();
  renderHabits();
};

const toggleHabit = (id) => {
  // find() identifies the exact habit object that should be toggled.
  const habit = state.habits.find((entry) => String(entry.id) === id);
  if (!habit) return;

  habit.completed = !habit.completed;
  saveHabits();
  renderHabits();
};

const deleteHabit = (id) => {
  state.habits = state.habits.filter((entry) => String(entry.id) !== id);
  saveHabits();
  renderHabits();
};

const fetchHabitsFromAPI = async () => {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error("Failed to fetch habits");

  const data = await response.json();

  // map() shapes API data into our internal habit format.
  return data.map((todo) => ({
    id: String(todo.id),
    title: todo.title,
    completed: todo.completed,
  }));
};

const initialize = async () => {
  const cachedHabits = loadHabits();

  if (cachedHabits && cachedHabits.length) {
    state.habits = cachedHabits;
    renderHabits();
    return;
  }

  try {
    state.habits = await fetchHabitsFromAPI();
  } catch (error) {
    console.error(error);
    state.habits = [];
  }

  saveHabits();
  renderHabits();
};

habitForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addHabit(habitInput.value);
  habitInput.value = "";
  habitInput.focus();
});

searchInput.addEventListener("input", (event) => {
  state.search = event.target.value;
  renderHabits();
});

filterSelect.addEventListener("change", (event) => {
  state.filter = event.target.value;
  renderHabits();
});

sortSelect.addEventListener("change", (event) => {
  state.sort = event.target.value;
  renderHabits();
});

habitList.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  if (target.classList.contains("delete-btn")) {
    deleteHabit(target.dataset.id ?? "");
  }
});

habitList.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  if (target.classList.contains("toggle-checkbox")) {
    toggleHabit(target.dataset.id ?? "");
  }
});

initialize();
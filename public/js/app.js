const form = document.querySelector("#task-form");
const list = document.querySelector("#task-list");
const status = document.querySelector("#status");
const summary = document.querySelector("#summary");
const filter = document.querySelector("#filter");
const search = document.querySelector("#search");
const submitButton = document.querySelector("#submit-button");
let tasks = [];
function setStatus(message, kind = "info") {
  status.textContent = message;
  status.dataset.kind = kind;
}
async function apiRequest(path, options = {}) {
  const response = await fetch(path, options);
  if (response.status === 204) {
    return null;
  }
  let data = null;
  try {
    data = await response.json();
  } catch {
  }
  if (!response.ok) {
    let message = data?.error ||
      `Ошибка сервера: HTTP ${response.status}`;
    if (response.status === 404) {
      message = data?.error || "Запись не найдена (404).";
    } else if (response.status === 422) {
      message = data?.error || "Сервер отклонил данные (422).";
    }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return data;
}
function renderTasks() {
  const query = search.value.trim().toLowerCase();
  const selectedStatus = filter.value;
  const doneCount = tasks.filter(task => task.done).length;
  const activeCount = tasks.length - doneCount;
  summary.textContent =
    `Всего: ${tasks.length} · Активные: ${activeCount} · Выполненные: ${doneCount}`;
  const visibleTasks = tasks.filter(task => {
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "active" && !task.done) ||
      (selectedStatus === "done" && task.done);
    const matchesSearch =
      task.title.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });
  list.replaceChildren();
  if (visibleTasks.length === 0) {
    const emptyMessage = document.createElement("div");
    emptyMessage.className = "empty";
    emptyMessage.textContent = tasks.length === 0
      ? "Задач пока нет. Создайте первую задачу."
      : "По заданным условиям задачи не найдены.";
    list.append(emptyMessage);
    return;
  }
  visibleTasks.forEach(task => {
    const card = document.createElement("article");
    card.className = "task-card";
    const title = document.createElement("h3");
    title.textContent = task.title;
    const category = document.createElement("p");
    category.textContent = `Категория: ${task.category}`;
    const priority = document.createElement("p");
    priority.textContent = `Приоритет: ${task.priority}`;
    const taskStatus = document.createElement("p");
    taskStatus.textContent = task.done
      ? "Статус: Выполнено"
      : "Статус: Активна";
    const actions = document.createElement("div");
    actions.className = "actions";
    const toggleButton = document.createElement("button");
    toggleButton.type = "button";
    toggleButton.dataset.action = "toggle";
    toggleButton.dataset.id = String(task.id);
    toggleButton.textContent = task.done
      ? "Вернуть"
      : "Выполнено";
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.dataset.action = "delete";
    deleteButton.dataset.id = String(task.id);
    deleteButton.className = "secondary";
    deleteButton.textContent = "Удалить";
    actions.append(toggleButton, deleteButton);
    card.append(
      title,
      category,
      priority,
      taskStatus,
      actions
    );
    list.append(card);
  });
}
async function loadTasks() {
  try {
    setStatus("Загрузка задач...");
    const data = await apiRequest("/api/tasks");
    if (!data || !Array.isArray(data.items)) {
      throw new Error("Сервер вернул данные в неожиданном формате.");
    }
    tasks = data.items;
    renderTasks();
    setStatus("Список задач успешно загружен.", "success");
  } catch (error) {
    setStatus(error.message || "Не удалось загрузить задачи.", "error");
  }
}
form.addEventListener("submit", async event => {
  event.preventDefault();
  const formData = new FormData(form);
  const title = String(formData.get("title") || "").trim();
  const category = String(formData.get("category") || "");
  const priority = String(formData.get("priority") || "");
  if (title.length < 4) {
    setStatus(
      "Название задачи должно содержать минимум 4 символа.",
      "error"
    );
    return;
  }
  submitButton.disabled = true;
  try {
    setStatus("Создание задачи...");
    await apiRequest("/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title,
        category,
        priority
      })
    });
    form.reset();
    await loadTasks();
    setStatus("Задача успешно создана.", "success");
  } catch (error) {
    setStatus(
      error.message || "Не удалось создать задачу.",
      "error"
    );
  } finally {
    submitButton.disabled = false;
  }
});
list.addEventListener("click", async event => {
  const button = event.target.closest(
    "button[data-action]"
  );
  if (!button || !list.contains(button)) {
    return;
  }
  const taskId = button.dataset.id;
  const action = button.dataset.action;
  const task = tasks.find(
    item => String(item.id) === taskId
  );
  if (!task) {
    setStatus(
      "Не удалось найти задачу в локальном списке.",
      "error"
    );
    return;
  }
  button.disabled = true;
  try {
    if (action === "toggle") {
      setStatus("Изменение статуса задачи...");
      await apiRequest(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          done: !task.done
        })
      });
      await loadTasks();
      setStatus("Статус задачи обновлён.", "success");
    }
    else if (action === "delete") {
      setStatus("Удаление задачи...");
      await apiRequest(`/api/tasks/${taskId}`, {
        method: "DELETE"
      });
      await loadTasks();
      setStatus("Задача удалена.", "success");
    }
  } catch (error) {
    setStatus(
      error.message || "Не удалось выполнить операцию.",
      "error"
    );
  } finally {
    button.disabled = false;
  }
});
filter.addEventListener("change", renderTasks);
search.addEventListener("input", renderTasks);
document
  .querySelector("#refresh-button")
  .addEventListener("click", loadTasks);
loadTasks();
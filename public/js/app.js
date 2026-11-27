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
  // TODO 1: выполните fetch, проверьте response.ok.
  // Для ответа 204 верните null, иначе прочитайте JSON.
  // При HTTP-ошибке по возможности возьмите сообщение из поля error.
}
function renderTasks() {
  // TODO 2: примените фильтр статуса + поиск по названию,
  // затем сформируйте карточки через createElement/textContent.
  // На каждой карточке разместите кнопки data-action=toggle/delete и data-id.
  // Выведите количество всех, активных и выполненных задач.
}
async function loadTasks() {
  // TODO 3: GET /api/tasks, заполните tasks и вызовите renderTasks().
  setStatus("TODO: запросите список задач");
}
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  // TODO 4: POST /api/tasks, body=JSON.stringify({title,category,priority}).
  // Блокируйте submitButton, обрабатывайте ошибку, после успеха вызовите loadTasks().
});
list.addEventListener("click", async (event) => {
  // TODO 5: делегирование: closest('button[data-action]'), data-id.
  // toggle → PATCH /api/tasks/:id с {done: !task.done}.
  // delete → DELETE /api/tasks/:id. После выполнения обновите список.
});
filter.addEventListener("change", renderTasks);
search.addEventListener("input", renderTasks);
document.querySelector("#refresh-button").addEventListener("click", loadTasks);
// TODO 6: начальная загрузка.

// ---------- Data Model ----------
let todos = [];
let currentLayout = "list"; // 'list' or 'grid'

// Load from localStorage
function loadFromStorage() {
  const stored = localStorage.getItem("professional_todo_app");
  if (stored) {
    try {
      todos = JSON.parse(stored);
      todos = todos.map((t) => ({
        id: t.id,
        text: t.text,
        completed: t.completed || false,
        createdAt: t.createdAt || new Date().toLocaleString("fa-IR"),
      }));
    } catch (e) {
      console.warn(e);
    }
  }
  if (!todos.length) {
    todos = [
      {
        id: Date.now() + 1,
        text: "کدنویسی دموی TodoList حرفه‌ای",
        completed: false,
        createdAt: new Date().toLocaleString("fa-IR"),
      },
      {
        id: Date.now() + 2,
        text: "اضافه کردن قابلیت ویرایش درون خطی",
        completed: false,
        createdAt: new Date().toLocaleString("fa-IR"),
      },
      {
        id: Date.now() + 3,
        text: "ذخیره در حافظه مرورگر",
        completed: true,
        createdAt: new Date().toLocaleString("fa-IR"),
      },
    ];
  }

  // Load saved layout preference
  const savedLayout = localStorage.getItem("todo_layout_preference");
  if (savedLayout === "grid" || savedLayout === "list") {
    currentLayout = savedLayout;
  }
}

function saveToStorage() {
  localStorage.setItem("professional_todo_app", JSON.stringify(todos));
}

function saveLayoutPreference() {
  localStorage.setItem("todo_layout_preference", currentLayout);
}

// Update statistics
function updateStats() {
  const total = todos.length;
  const completed = todos.filter((t) => t.completed).length;
  const pending = total - completed;
  document.getElementById("totalCount").innerText = `${total} وظیفه`;
  document.getElementById("completedCount").innerText =
    `${completed} انجام شده`;
  document.getElementById("pendingCount").innerText = `${pending} باقی‌مانده`;
}

// Escape HTML
function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Apply current layout class to todo-list
function applyLayout() {
  const todoListEl = document.getElementById("todoList");
  if (!todoListEl) return;
  if (currentLayout === "grid") {
    todoListEl.classList.add("grid-view");
  } else {
    todoListEl.classList.remove("grid-view");
  }
  // Update toggle button text/icon
  const toggleBtn = document.getElementById("layoutToggleBtn");
  if (toggleBtn) {
    const iconSpan = toggleBtn.querySelector(".toggle-icon");
    if (currentLayout === "grid") {
      toggleBtn.innerHTML = '<span class="toggle-icon">نمای ردیفی</span>';
    } else {
      toggleBtn.innerHTML = '<span class="toggle-icon">نمای ستونی</span>';
    }
  }
}

// Render the entire list
function renderTodoList() {
  const listContainer = document.getElementById("todoList");
  if (!listContainer) return;

  if (todos.length === 0) {
    listContainer.innerHTML = `<div class="empty-message">✨ هیچ وظیفه‌ای وجود ندارد. افزودن وظیفه را شروع کنید!</div>`;
    updateStats();
    applyLayout(); // ensure layout class is still applied even when empty
    return;
  }

  let itemsHtml = "";
  for (let todo of todos) {
    const checkStatus = todo.completed ? "checked" : "";
    const completedClass = todo.completed ? "completed" : "";
    const formattedDate = todo.createdAt || "تاریخ نامشخص";
    itemsHtml += `
      <li class="todo-item ${completedClass}" data-id="${todo.id}">
        <div class="todo-content">
          <input type="checkbox" class="todo-check" ${checkStatus} data-id="${todo.id}">
          <div class="todo-text-wrapper">
            <div class="todo-text" data-original-text="${escapeHtml(todo.text)}">${escapeHtml(todo.text)}</div>
            <div class="todo-date">📅 ${escapeHtml(formattedDate)}</div>
          </div>
        </div>
        <div class="todo-actions">
          <button class="edit-btn" data-id="${todo.id}">✏️ ویرایش</button>
          <button class="delete-btn" data-id="${todo.id}">🗑️ حذف</button>
        </div>
      </li>
    `;
  }
  listContainer.innerHTML = itemsHtml;
  applyLayout(); // re-apply grid/list class after innerHTML change
  updateStats();
}

// Add new todo
function addTodo(taskText) {
  const text = taskText.trim();
  if (text === "") {
    alert("لطفاً متن وظیفه را وارد کنید.");
    return false;
  }
  const newTodo = {
    id: Date.now(),
    text: text,
    completed: false,
    createdAt: new Date().toLocaleString("fa-IR"),
  };
  todos.push(newTodo);
  saveToStorage();
  renderTodoList();
  return true;
}

// Delete todo
function deleteTodoById(id) {
  if (confirm("آیا از حذف این وظیفه مطمئن هستید؟")) {
    todos = todos.filter((todo) => todo.id !== id);
    saveToStorage();
    renderTodoList();
  }
}

// Toggle complete without full re-render
function toggleComplete(id, completedState) {
  const todo = todos.find((t) => t.id === id);
  if (!todo) return;

  todo.completed = completedState;
  saveToStorage();

  const todoItem = document.querySelector(`.todo-item[data-id='${id}']`);
  if (todoItem) {
    if (completedState) {
      todoItem.classList.add("completed");
    } else {
      todoItem.classList.remove("completed");
    }
    const checkbox = todoItem.querySelector(".todo-check");
    if (checkbox) checkbox.checked = completedState;
  }
  updateStats();
}

// Inline edit
function startInlineEdit(todoId, textElement, originalText) {
  if (textElement.querySelector(".inline-input")) return;

  const input = document.createElement("input");
  input.type = "text";
  input.value = originalText;
  input.className = "inline-input";
  input.setAttribute("aria-label", "ویرایش وظیفه");

  textElement.innerHTML = "";
  textElement.appendChild(input);
  input.focus();
  input.select();

  const saveEdit = () => {
    const newValue = input.value.trim();
    if (newValue === "") {
      cancelEdit();
      return;
    }
    const todo = todos.find((t) => t.id === todoId);
    if (todo) {
      todo.text = newValue;
      textElement.setAttribute("data-original-text", escapeHtml(newValue));
      textElement.innerHTML = escapeHtml(newValue);
      saveToStorage();
    } else {
      cancelEdit();
    }
  };

  const cancelEdit = () => {
    textElement.innerHTML = escapeHtml(originalText);
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  });

  input.addEventListener("blur", () => {
    setTimeout(() => {
      if (document.activeElement !== input) saveEdit();
    }, 50);
  });
}

// Event delegation
function setupEventDelegation() {
  const listContainer = document.getElementById("todoList");
  if (!listContainer) return;

  listContainer.addEventListener("click", (e) => {
    const checkbox = e.target.closest(".todo-check");
    if (checkbox && checkbox.dataset.id) {
      const id = parseInt(checkbox.dataset.id);
      toggleComplete(id, checkbox.checked);
      e.stopPropagation();
      return;
    }

    const delBtn = e.target.closest(".delete-btn");
    if (delBtn && delBtn.dataset.id) {
      const id = parseInt(delBtn.dataset.id);
      deleteTodoById(id);
      e.stopPropagation();
      return;
    }

    const editBtn = e.target.closest(".edit-btn");
    if (editBtn && editBtn.dataset.id) {
      const id = parseInt(editBtn.dataset.id);
      const todoItem = editBtn.closest(".todo-item");
      if (todoItem) {
        const textDiv = todoItem.querySelector(".todo-text");
        if (textDiv) {
          const originalText =
            textDiv.getAttribute("data-original-text") || textDiv.innerText;
          startInlineEdit(id, textDiv, originalText);
        }
      }
      e.stopPropagation();
      return;
    }
  });
}

// Toggle layout between list and grid
function setupLayoutToggle() {
  const toggleBtn = document.getElementById("layoutToggleBtn");
  if (!toggleBtn) return;

  toggleBtn.addEventListener("click", () => {
    currentLayout = currentLayout === "list" ? "grid" : "list";
    saveLayoutPreference();
    applyLayout();
  });
}

// Add task feature
function initAddFeature() {
  const addButton = document.getElementById("addTodoBtn");
  const inputField = document.getElementById("taskInput");

  const addHandler = () => {
    const rawText = inputField.value;
    if (addTodo(rawText)) {
      inputField.value = "";
      inputField.focus();
    }
  };

  addButton.addEventListener("click", addHandler);
  inputField.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addHandler();
    }
  });
}

// Initialization
function init() {
  loadFromStorage();
  renderTodoList();
  setupEventDelegation();
  initAddFeature();
  setupLayoutToggle();
  document.getElementById("taskInput")?.focus();
}

// Start app
init();

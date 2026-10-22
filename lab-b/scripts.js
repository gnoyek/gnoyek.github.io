class Todo {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem("todoTasks")) || [];
        this.term = "";
        this.editingIndex = null;

        this.taskList = document.querySelector(".task-list");
        this.taskInput = document.querySelector(".add-task-input");
        this.dateInput = document.querySelector(".add-task-due-date");
        this.addButton = document.querySelector(".add-task-button");
        this.searchInput = document.querySelector(".search-bar");

        this.dateInput.min = this.tomorrow();

        this.addButton.addEventListener("click", () => this.addTask());
        this.searchInput.addEventListener("input", (e) => {
            this.term = e.target.value.trim();
            this.draw();
        });

        // Zapis edycji po kliknięciu poza aktualnie edytowany wiersz
        document.addEventListener("mousedown", (e) => {
            if (this.editingIndex !== null && !e.target.closest(".task-item.editing")) {
                this.saveEdit();
            }
        });

        this.draw();
    }

    // Propozycja LLM
    tomorrow() {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toLocaleDateString("sv-SE"); // Zwraca format YYYY-MM-DD w lokalnej strefie
    }

    get filteredTasks() {
        if (this.term.length < 2) return this.tasks;
        const q = this.term.toLowerCase();
        return this.tasks.filter(t => t.text.toLowerCase().includes(q));
    }

    isValid(textInput, dateInput) {
        const text = textInput.value.trim();
        textInput.setCustomValidity(
            text.length < 3 || text.length > 255 ? "Treść zadania musi mieć od 3 do 255 znaków." : ""
        );
        dateInput.setCustomValidity(
            dateInput.value && dateInput.value < this.tomorrow() ? "Data musi być w przyszłości albo pozostać pusta." : ""
        );
        return textInput.reportValidity() && dateInput.reportValidity();
    }

    addTask() {
        if (!this.isValid(this.taskInput, this.dateInput)) return;

        this.tasks.push({
            text: this.taskInput.value.trim(),
            dueDate: this.dateInput.value,
            completed: false
        });

        this.taskInput.value = "";
        this.dateInput.value = "";
        this.saveAndDraw();
    }

    deleteTask(index) {
        if (this.editingIndex === index) this.editingIndex = null;
        this.tasks.splice(index, 1);
        this.saveAndDraw();
    }

    saveEdit() {
        const row = this.taskList.querySelector(".task-item.editing");
        if (!row) return true;

        const [textInput, dateInput] = row.querySelectorAll(".edit-text, .edit-date");
        if (!this.isValid(textInput, dateInput)) return false;

        this.tasks[this.editingIndex].text = textInput.value.trim();
        this.tasks[this.editingIndex].dueDate = dateInput.value;
        this.editingIndex = null;
        this.saveAndDraw();
        return true;
    }

    // LLM generated function to highlight search term in task text
    highlight(text) {
        const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        if (this.term.length < 2) return escaped;
        const regex = new RegExp(`(${this.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
        return escaped.replace(regex, "<mark>$1</mark>");
    }

    saveAndDraw() {
        localStorage.setItem("todoTasks", JSON.stringify(this.tasks));
        this.draw();
    }

    draw() {
        this.taskList.innerHTML = "";

        this.filteredTasks.forEach((task) => {
            const index = this.tasks.indexOf(task);
            const isEditing = index === this.editingIndex;

            const row = document.createElement("div");
            row.className = `task-item ${task.completed ? "completed" : ""} ${isEditing ? "editing" : ""}`;

            if (isEditing) {
                row.innerHTML = `
                    <input type="checkbox" ${task.completed ? "checked" : ""}>
                    <input type="text" class="edit-text" maxlength="255">
                    <input type="date" class="task-date edit-date" min="${this.tomorrow()}" value="${task.dueDate || ""}">
                    <button type="button" class="delete-task">×</button>
                `;
                row.querySelector(".edit-text").value = task.text;
            } else {
                row.innerHTML = `
                    <input type="checkbox" ${task.completed ? "checked" : ""}>
                    <span>${this.highlight(task.text)}</span>
                    <span class="task-date">${task.dueDate || ""}</span>
                    <button type="button" class="delete-task">×</button>
                `;
            }

            // Obsługa zdarzeń bezpośrednio na elementach wiersza
            row.querySelector('input[type="checkbox"]').addEventListener("change", (e) => {
                task.completed = e.target.checked;
                this.saveAndDraw();
            });

            row.querySelector(".delete-task").addEventListener("click", (e) => {
                e.stopPropagation();
                this.deleteTask(index);
            });

            row.addEventListener("click", (e) => {
                if (e.target.tagName !== "INPUT" && !isEditing) {
                    this.editingIndex = index;
                    this.draw();
                }
            });

            this.taskList.append(row);
        });
    }
}

document.todo = new Todo();
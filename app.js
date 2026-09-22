/**
 * TaskSphere - Project & Task Manager
 * Main Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- State Storage Keys ---
    const STORAGE_KEY_TASKS = 'tasksphere_tasks_v1';
    const STORAGE_KEY_PROJECTS = 'tasksphere_projects_v1';

    // --- Initial Sample Data ---
    const DEFAULT_PROJECTS = [
        { id: 'proj-1', name: 'Web Redesign', color: '#6366f1' },
        { id: 'proj-2', name: 'Mobile App', color: '#ec4899' },
        { id: 'proj-3', name: 'Marketing Campaign', color: '#10b981' },
        { id: 'proj-4', name: 'Personal Goals', color: '#f59e0b' }
    ];

    const today = new Date();
    const formatDateStr = (daysOffset) => {
        const d = new Date(today);
        d.setDate(d.getDate() + daysOffset);
        return d.toISOString().split('T')[0];
    };

    const DEFAULT_TASKS = [
        {
            id: 'task-101',
            title: 'Design Glassmorphic UI Components',
            description: 'Create responsive dark-mode cards, modal popups, and sidebar buttons.',
            projectId: 'proj-1',
            status: 'completed',
            priority: 'urgent',
            dueDate: formatDateStr(-1),
            subtasks: [
                { id: 'sub-1', text: 'Color palette definition', completed: true },
                { id: 'sub-2', text: 'Typography & Google Fonts', completed: true },
                { id: 'sub-3', text: 'Glassmorphism backdrop blur', completed: true }
            ],
            createdAt: Date.now() - 86400000 * 3
        },
        {
            id: 'task-102',
            title: 'Implement Kanban Drag and Drop Logic',
            description: 'Enable HTML5 drag and drop across column bodies with hover drop targets.',
            projectId: 'proj-1',
            status: 'in-progress',
            priority: 'high',
            dueDate: formatDateStr(0),
            subtasks: [
                { id: 'sub-4', text: 'Dragstart & dataTransfer setup', completed: true },
                { id: 'sub-5', text: 'Dragover visual indicators', completed: true },
                { id: 'sub-6', text: 'Drop event status handler', completed: false }
            ],
            createdAt: Date.now() - 86400000 * 2
        },
        {
            id: 'task-103',
            title: 'Setup Firebase Auth & Firestore Sync',
            description: 'Integrate social logins and remote persistent backup API.',
            projectId: 'proj-2',
            status: 'todo',
            priority: 'high',
            dueDate: formatDateStr(3),
            subtasks: [
                { id: 'sub-7', text: 'Google OAuth config', completed: false },
                { id: 'sub-8', text: 'User document schema', completed: false }
            ],
            createdAt: Date.now() - 86400000
        },
        {
            id: 'task-104',
            title: 'Social Media Banner & Copy Design',
            description: 'Prepare high-res launch banners and promo copy for Twitter and LinkedIn.',
            projectId: 'proj-3',
            status: 'review',
            priority: 'medium',
            dueDate: formatDateStr(2),
            subtasks: [
                { id: 'sub-9', text: 'Design 1200x630px OG images', completed: true },
                { id: 'sub-10', text: 'Write announcement post draft', completed: false }
            ],
            createdAt: Date.now() - 43200000
        },
        {
            id: 'task-105',
            title: 'Weekly Workout & Health Tracking',
            description: 'Complete 4 gym sessions and maintain daily hydration goal.',
            projectId: 'proj-4',
            status: 'in-progress',
            priority: 'low',
            dueDate: formatDateStr(5),
            subtasks: [
                { id: 'sub-11', text: 'Upper body training', completed: true },
                { id: 'sub-12', text: 'Lower body training', completed: false },
                { id: 'sub-13', text: '3km cardio run', completed: false }
            ],
            createdAt: Date.now()
        }
    ];

    // --- State Variables ---
    let projects = JSON.parse(localStorage.getItem(STORAGE_KEY_PROJECTS)) || DEFAULT_PROJECTS;
    let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY_TASKS)) || DEFAULT_TASKS;

    let activeFilter = 'all'; // 'all', 'today', 'upcoming', 'high-priority', 'completed', or project ID
    let activeViewMode = 'kanban'; // 'kanban' or 'list'
    let currentSearchTerm = '';
    let currentPriorityFilter = 'all';
    let currentSortBy = 'dueDate';
    let currentEditingTaskId = null;
    let modalSubtasksTemp = []; // Temporary subtasks array during task edit/create

    // Save initial defaults if localstorage empty
    if (!localStorage.getItem(STORAGE_KEY_PROJECTS)) {
        localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
    }
    if (!localStorage.getItem(STORAGE_KEY_TASKS)) {
        localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
    }

    // --- DOM Elements ---
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const projectsList = document.getElementById('projectsList');
    const searchInput = document.getElementById('searchInput');
    const priorityFilterSelect = document.getElementById('priorityFilter');
    const sortBySelect = document.getElementById('sortBySelect');
    
    const viewKanbanBtn = document.getElementById('viewKanbanBtn');
    const viewListBtn = document.getElementById('viewListBtn');
    const kanbanBoardView = document.getElementById('kanbanBoardView');
    const listViewContainer = document.getElementById('listViewContainer');
    const listBody = document.getElementById('listBody');
    const emptyState = document.getElementById('emptyState');

    const currentViewTitle = document.getElementById('currentViewTitle');
    const currentViewSubtitle = document.getElementById('currentViewSubtitle');
    const headerProgressFill = document.getElementById('headerProgressFill');
    const headerProgressText = document.getElementById('headerProgressText');

    // Counts
    const countAll = document.getElementById('countAll');
    const countToday = document.getElementById('countToday');
    const countUpcoming = document.getElementById('countUpcoming');
    const countHighPriority = document.getElementById('countHighPriority');
    const countCompleted = document.getElementById('countCompleted');

    // Modals
    const taskModal = document.getElementById('taskModal');
    const modalTitle = document.getElementById('modalTitle');
    const taskForm = document.getElementById('taskForm');
    const taskIdInput = document.getElementById('taskId');
    const taskTitleInput = document.getElementById('taskTitleInput');
    const taskProjectSelect = document.getElementById('taskProjectSelect');
    const taskStatusSelect = document.getElementById('taskStatusSelect');
    const taskPrioritySelect = document.getElementById('taskPrioritySelect');
    const taskDueDateInput = document.getElementById('taskDueDateInput');
    const taskDescInput = document.getElementById('taskDescInput');
    const newSubtaskInput = document.getElementById('newSubtaskInput');
    const addSubtaskBtn = document.getElementById('addSubtaskBtn');
    const subtasksEditorList = document.getElementById('subtasksEditorList');
    
    const projectModal = document.getElementById('projectModal');
    const projectForm = document.getElementById('projectForm');
    const projectNameInput = document.getElementById('projectNameInput');
    const projectColorInput = document.getElementById('projectColorInput');
    const colorPickerGrid = document.getElementById('colorPickerGrid');

    // Action Buttons
    const openTaskModalBtn = document.getElementById('openTaskModalBtn');
    const closeTaskModalBtn = document.getElementById('closeTaskModalBtn');
    const cancelTaskModalBtn = document.getElementById('cancelTaskModalBtn');
    const openProjectModalBtn = document.getElementById('openProjectModalBtn');
    const closeProjectModalBtn = document.getElementById('closeProjectModalBtn');
    const cancelProjectModalBtn = document.getElementById('cancelProjectModalBtn');
    const emptyStateCreateBtn = document.getElementById('emptyStateCreateBtn');
    const exportDataBtn = document.getElementById('exportDataBtn');
    const importDataBtn = document.getElementById('importDataBtn');
    const importFileInput = document.getElementById('importFileInput');
    const resetDemoBtn = document.getElementById('resetDemoBtn');

    // --- Utility Functions ---
    function saveState() {
        localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
        localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
        renderApp();
    }

    function getProjectById(projId) {
        return projects.find(p => p.id === projId) || { name: 'General', color: '#94a3b8' };
    }

    function isSameDay(date1Str, date2) {
        if (!date1Str) return false;
        const d1 = new Date(date1Str + 'T00:00:00');
        return d1.toDateString() === date2.toDateString();
    }

    function isUpcoming(date1Str) {
        if (!date1Str) return false;
        const d1 = new Date(date1Str + 'T00:00:00');
        const t = new Date(today.toDateString());
        return d1 > t;
    }

    function isOverdue(dateStr) {
        if (!dateStr) return false;
        const d = new Date(dateStr + 'T23:59:59');
        return d < new Date();
    }

    function formatDisplayDate(dateStr) {
        if (!dateStr) return 'No due date';
        const d = new Date(dateStr + 'T00:00:00');
        if (isSameDay(dateStr, today)) return 'Today';
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (isSameDay(dateStr, tomorrow)) return 'Tomorrow';
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    // --- Render Functions ---

    function updateNavBadges() {
        countAll.textContent = tasks.length;
        countToday.textContent = tasks.filter(t => isSameDay(t.dueDate, today)).length;
        countUpcoming.textContent = tasks.filter(t => isUpcoming(t.dueDate)).length;
        countHighPriority.textContent = tasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length;
        countCompleted.textContent = tasks.filter(t => t.status === 'completed').length;
    }

    function renderProjectsList() {
        projectsList.innerHTML = '';
        projects.forEach(proj => {
            const taskCount = tasks.filter(t => t.projectId === proj.id).length;
            const li = document.createElement('li');
            li.className = `project-item ${activeFilter === proj.id ? 'active' : ''}`;
            li.dataset.projectId = proj.id;
            
            li.innerHTML = `
                <div class="project-left">
                    <span class="project-color-dot" style="background-color: ${proj.color};"></span>
                    <span class="project-name">${proj.name}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span class="badge">${taskCount}</span>
                    <button class="project-delete-btn" data-id="${proj.id}" title="Delete Project"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            `;

            li.addEventListener('click', (e) => {
                if (e.target.closest('.project-delete-btn')) return;
                setActiveFilter(proj.id);
            });

            const delBtn = li.querySelector('.project-delete-btn');
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteProject(proj.id);
            });

            projectsList.appendChild(li);
        });

        // Also update Project select options in Modal
        taskProjectSelect.innerHTML = '';
        projects.forEach(proj => {
            const opt = document.createElement('option');
            opt.value = proj.id;
            opt.textContent = proj.name;
            taskProjectSelect.appendChild(opt);
        });
    }

    function getFilteredTasks() {
        let result = tasks.slice();

        // 1. Sidebar Nav / Project Filter
        if (activeFilter === 'today') {
            result = result.filter(t => isSameDay(t.dueDate, today));
        } else if (activeFilter === 'upcoming') {
            result = result.filter(t => isUpcoming(t.dueDate));
        } else if (activeFilter === 'high-priority') {
            result = result.filter(t => t.priority === 'high' || t.priority === 'urgent');
        } else if (activeFilter === 'completed') {
            result = result.filter(t => t.status === 'completed');
        } else if (activeFilter !== 'all') {
            // Project ID
            result = result.filter(t => t.projectId === activeFilter);
        }

        // 2. Search Keyword
        if (currentSearchTerm.trim()) {
            const q = currentSearchTerm.toLowerCase();
            result = result.filter(t => 
                t.title.toLowerCase().includes(q) ||
                (t.description && t.description.toLowerCase().includes(q)) ||
                (t.subtasks && t.subtasks.some(s => s.text.toLowerCase().includes(q)))
            );
        }

        // 3. Priority Dropdown Filter
        if (currentPriorityFilter !== 'all') {
            result = result.filter(t => t.priority === currentPriorityFilter);
        }

        // 4. Sorting
        result.sort((a, b) => {
            if (currentSortBy === 'dueDate') {
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            } else if (currentSortBy === 'priority') {
                const weights = { urgent: 4, high: 3, medium: 2, low: 1 };
                return weights[b.priority] - weights[a.priority];
            } else if (currentSortBy === 'title') {
                return a.title.localeCompare(b.title);
            } else if (currentSortBy === 'createdAt') {
                return b.createdAt - a.createdAt;
            }
            return 0;
        });

        return result;
    }

    function updateProgressHeader(filteredTasks) {
        if (filteredTasks.length === 0) {
            headerProgressFill.style.width = '0%';
            headerProgressText.textContent = '0%';
            return;
        }
        const completedCount = filteredTasks.filter(t => t.status === 'completed').length;
        const percent = Math.round((completedCount / filteredTasks.length) * 100);
        headerProgressFill.style.width = `${percent}%`;
        headerProgressText.textContent = `${percent}%`;
    }

    function renderApp() {
        updateNavBadges();
        renderProjectsList();

        const filteredTasks = getFilteredTasks();
        updateProgressHeader(filteredTasks);

        // Update Title Header
        if (activeFilter === 'all') {
            currentViewTitle.textContent = 'All Tasks';
            currentViewSubtitle.textContent = 'Overview of all ongoing & completed tasks';
        } else if (activeFilter === 'today') {
            currentViewTitle.textContent = 'Today\'s Schedule';
            currentViewSubtitle.textContent = 'Tasks due for completion today';
        } else if (activeFilter === 'upcoming') {
            currentViewTitle.textContent = 'Upcoming Tasks';
            currentViewSubtitle.textContent = 'Tasks scheduled for future dates';
        } else if (activeFilter === 'high-priority') {
            currentViewTitle.textContent = 'High Priority Tasks';
            currentViewSubtitle.textContent = 'Critical and urgent items requiring attention';
        } else if (activeFilter === 'completed') {
            currentViewTitle.textContent = 'Completed Archive';
            currentViewSubtitle.textContent = 'Finished project tasks';
        } else {
            const p = getProjectById(activeFilter);
            currentViewTitle.textContent = p.name;
            currentViewSubtitle.textContent = `Project specific view`;
        }

        // Toggle Views
        if (filteredTasks.length === 0) {
            kanbanBoardView.classList.add('hidden');
            listViewContainer.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');

        if (activeViewMode === 'kanban') {
            kanbanBoardView.classList.remove('hidden');
            listViewContainer.classList.add('hidden');
            renderKanban(filteredTasks);
        } else {
            kanbanBoardView.classList.add('hidden');
            listViewContainer.classList.remove('hidden');
            renderListView(filteredTasks);
        }
    }

    function renderKanban(filteredTasks) {
        const statuses = ['todo', 'in-progress', 'review', 'completed'];
        
        statuses.forEach(status => {
            const colBody = document.getElementById(`colBody${capitalizeFirst(status)}`);
            const colCount = document.getElementById(`countCol${capitalizeFirst(status)}`);
            colBody.innerHTML = '';

            const colTasks = filteredTasks.filter(t => t.status === status);
            colCount.textContent = colTasks.length;

            colTasks.forEach(task => {
                const card = createKanbanCard(task);
                colBody.appendChild(card);
            });
        });
    }

    function createKanbanCard(task) {
        const proj = getProjectById(task.projectId);
        const card = document.createElement('div');
        card.className = 'task-card';
        card.draggable = true;
        card.dataset.taskId = task.id;

        // Subtasks progress
        const totalSubs = task.subtasks ? task.subtasks.length : 0;
        const doneSubs = task.subtasks ? task.subtasks.filter(s => s.completed).length : 0;
        const subPercent = totalSubs > 0 ? Math.round((doneSubs / totalSubs) * 100) : 0;

        const overdueClass = (task.status !== 'completed' && isOverdue(task.dueDate)) ? 'overdue' : '';

        card.innerHTML = `
            <div class="task-card-header">
                <span class="project-tag" style="background-color: ${proj.color}20; color: ${proj.color}; border: 1px solid ${proj.color}40;">
                    <span style="width: 6px; height: 6px; border-radius: 50%; background-color: ${proj.color};"></span>
                    ${proj.name}
                </span>
                <span class="priority-badge priority-${task.priority}">${task.priority}</span>
            </div>
            <h4 class="task-title">${escapeHTML(task.title)}</h4>
            ${task.description ? `<p class="task-desc">${escapeHTML(task.description)}</p>` : ''}
            
            ${totalSubs > 0 ? `
                <div class="subtasks-summary">
                    <div class="subtasks-header">
                        <span><i class="fa-solid fa-list-check"></i> Subtasks</span>
                        <span>${doneSubs}/${totalSubs} (${subPercent}%)</span>
                    </div>
                    <div class="subtask-progress-bar">
                        <div class="subtask-progress-fill" style="width: ${subPercent}%;"></div>
                    </div>
                </div>
            ` : ''}

            <div class="task-card-footer">
                <div class="due-date ${overdueClass}">
                    <i class="fa-regular fa-calendar"></i>
                    <span>${formatDisplayDate(task.dueDate)}</span>
                </div>
                <div class="card-actions">
                    <button class="action-icon-btn btn-edit" title="Edit Task"><i class="fa-solid fa-pen"></i></button>
                    <button class="action-icon-btn btn-delete" title="Delete Task"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>
        `;

        // Card Drag events
        card.addEventListener('dragstart', (e) => {
            card.classList.add('dragging');
            e.dataTransfer.setData('text/plain', task.id);
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
        });

        // Edit / Delete Listeners
        card.querySelector('.btn-edit').addEventListener('click', (e) => {
            e.stopPropagation();
            openTaskModal(task.id);
        });

        card.querySelector('.btn-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTask(task.id);
        });

        card.addEventListener('click', () => {
            openTaskModal(task.id);
        });

        return card;
    }

    function renderListView(filteredTasks) {
        listBody.innerHTML = '';

        filteredTasks.forEach(task => {
            const proj = getProjectById(task.projectId);
            const row = document.createElement('div');
            row.className = 'list-row';

            const totalSubs = task.subtasks ? task.subtasks.length : 0;
            const doneSubs = task.subtasks ? task.subtasks.filter(s => s.completed).length : 0;
            const isDone = task.status === 'completed';
            const overdueClass = (!isDone && isOverdue(task.dueDate)) ? 'overdue' : '';

            row.innerHTML = `
                <div class="col-check">
                    <input type="checkbox" class="list-checkbox" ${isDone ? 'checked' : ''}>
                </div>
                <div class="col-task list-task-details">
                    <div class="list-task-title ${isDone ? 'completed-text' : ''}">${escapeHTML(task.title)}</div>
                    ${totalSubs > 0 ? `<div class="list-task-subtext"><i class="fa-solid fa-list-check"></i> ${doneSubs}/${totalSubs} subtasks completed</div>` : ''}
                </div>
                <div class="col-project">
                    <span class="project-tag" style="background-color: ${proj.color}20; color: ${proj.color};">
                        ${proj.name}
                    </span>
                </div>
                <div class="col-priority">
                    <span class="priority-badge priority-${task.priority}">${task.priority}</span>
                </div>
                <div class="col-date due-date ${overdueClass}">
                    ${formatDisplayDate(task.dueDate)}
                </div>
                <div class="col-actions card-actions">
                    <button class="action-icon-btn btn-edit"><i class="fa-solid fa-pen"></i></button>
                    <button class="action-icon-btn btn-delete"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            `;

            // Checkbox toggle status
            const checkbox = row.querySelector('.list-checkbox');
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                task.status = checkbox.checked ? 'completed' : 'todo';
                saveState();
            });

            row.querySelector('.btn-edit').addEventListener('click', (e) => {
                e.stopPropagation();
                openTaskModal(task.id);
            });

            row.querySelector('.btn-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTask(task.id);
            });

            row.addEventListener('click', (e) => {
                if (e.target.tagName !== 'INPUT' && !e.target.closest('.card-actions')) {
                    openTaskModal(task.id);
                }
            });

            listBody.appendChild(row);
        });
    }

    // --- Drag and Drop Logic for Kanban Columns ---
    const kanbanColumns = document.querySelectorAll('.column-body');
    kanbanColumns.forEach(col => {
        col.addEventListener('dragover', (e) => {
            e.preventDefault();
            col.classList.add('drag-over');
        });

        col.addEventListener('dragleave', () => {
            col.classList.remove('drag-over');
        });

        col.addEventListener('drop', (e) => {
            e.preventDefault();
            col.classList.remove('drag-over');
            const taskId = e.dataTransfer.getData('text/plain');
            const targetStatus = col.parentElement.dataset.status;

            const task = tasks.find(t => t.id === taskId);
            if (task && task.status !== targetStatus) {
                task.status = targetStatus;
                saveState();
            }
        });
    });

    // --- Actions & Event Handlers ---

    function setActiveFilter(filterId) {
        activeFilter = filterId;
        
        // Update Nav UI active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.filter === filterId);
        });
        document.querySelectorAll('.project-item').forEach(item => {
            item.classList.toggle('active', item.dataset.projectId === filterId);
        });

        renderApp();
    }

    function openTaskModal(taskId = null, defaultStatus = 'todo') {
        currentEditingTaskId = taskId;
        taskForm.reset();
        modalSubtasksTemp = [];

        if (taskId) {
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                modalTitle.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit Task';
                taskIdInput.value = task.id;
                taskTitleInput.value = task.title;
                taskProjectSelect.value = task.projectId;
                taskStatusSelect.value = task.status;
                taskPrioritySelect.value = task.priority;
                taskDueDateInput.value = task.dueDate || '';
                taskDescInput.value = task.description || '';
                modalSubtasksTemp = task.subtasks ? JSON.parse(JSON.stringify(task.subtasks)) : [];
            }
        } else {
            modalTitle.innerHTML = '<i class="fa-solid fa-plus-circle"></i> Create New Task';
            taskIdInput.value = '';
            taskStatusSelect.value = defaultStatus;
            // Pre-select current active project if viewing a project
            if (activeFilter !== 'all' && activeFilter !== 'today' && activeFilter !== 'upcoming' && activeFilter !== 'high-priority' && activeFilter !== 'completed') {
                taskProjectSelect.value = activeFilter;
            }
        }

        renderSubtasksEditor();
        taskModal.classList.remove('hidden');
        taskTitleInput.focus();
    }

    function closeTaskModal() {
        taskModal.classList.add('hidden');
        currentEditingTaskId = null;
    }

    function renderSubtasksEditor() {
        subtasksEditorList.innerHTML = '';
        modalSubtasksTemp.forEach((sub, index) => {
            const li = document.createElement('li');
            li.className = 'subtask-editor-item';
            li.innerHTML = `
                <div class="subtask-item-left">
                    <input type="checkbox" ${sub.completed ? 'checked' : ''} data-index="${index}">
                    <span class="${sub.completed ? 'done' : ''}">${escapeHTML(sub.text)}</span>
                </div>
                <button type="button" class="action-icon-btn btn-delete" data-index="${index}"><i class="fa-solid fa-xmark"></i></button>
            `;

            li.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
                modalSubtasksTemp[index].completed = e.target.checked;
                renderSubtasksEditor();
            });

            li.querySelector('.btn-delete').addEventListener('click', () => {
                modalSubtasksTemp.splice(index, 1);
                renderSubtasksEditor();
            });

            subtasksEditorList.appendChild(li);
        });
    }

    addSubtaskBtn.addEventListener('click', addSubtaskFromInput);
    newSubtaskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSubtaskFromInput();
        }
    });

    function addSubtaskFromInput() {
        const text = newSubtaskInput.value.trim();
        if (!text) return;
        modalSubtasksTemp.push({
            id: 'sub-' + Date.now() + Math.random().toString(36).substring(2, 5),
            text: text,
            completed: false
        });
        newSubtaskInput.value = '';
        renderSubtasksEditor();
    }

    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = taskTitleInput.value.trim();
        if (!title) return;

        if (currentEditingTaskId) {
            const task = tasks.find(t => t.id === currentEditingTaskId);
            if (task) {
                task.title = title;
                task.projectId = taskProjectSelect.value;
                task.status = taskStatusSelect.value;
                task.priority = taskPrioritySelect.value;
                task.dueDate = taskDueDateInput.value;
                task.description = taskDescInput.value.trim();
                task.subtasks = modalSubtasksTemp;
            }
        } else {
            const newTask = {
                id: 'task-' + Date.now(),
                title: title,
                projectId: taskProjectSelect.value,
                status: taskStatusSelect.value,
                priority: taskPrioritySelect.value,
                dueDate: taskDueDateInput.value,
                description: taskDescInput.value.trim(),
                subtasks: modalSubtasksTemp,
                createdAt: Date.now()
            };
            tasks.unshift(newTask);
        }

        saveState();
        closeTaskModal();
    });

    function deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            tasks = tasks.filter(t => t.id !== taskId);
            saveState();
        }
    }

    // --- Project Creation & Deletion ---

    function openProjectModal() {
        projectForm.reset();
        projectModal.classList.remove('hidden');
        projectNameInput.focus();
    }

    function closeProjectModal() {
        projectModal.classList.add('hidden');
    }

    // Color picker selection
    colorPickerGrid.addEventListener('click', (e) => {
        const opt = e.target.closest('.color-option');
        if (!opt) return;
        document.querySelectorAll('.color-option').forEach(el => el.classList.remove('active'));
        opt.classList.add('active');
        projectColorInput.value = opt.dataset.color;
    });

    projectForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = projectNameInput.value.trim();
        if (!name) return;

        const newProj = {
            id: 'proj-' + Date.now(),
            name: name,
            color: projectColorInput.value
        };

        projects.push(newProj);
        saveState();
        closeProjectModal();
        setActiveFilter(newProj.id);
    });

    function deleteProject(projId) {
        if (projects.length <= 1) {
            alert('You must keep at least one project.');
            return;
        }
        if (confirm('Deleting this project will also delete associated tasks. Continue?')) {
            projects = projects.filter(p => p.id !== projId);
            tasks = tasks.filter(t => t.projectId !== projId);
            if (activeFilter === projId) {
                activeFilter = 'all';
            }
            saveState();
        }
    }

    // --- Search, Filters & Sorting Listeners ---

    searchInput.addEventListener('input', (e) => {
        currentSearchTerm = e.target.value;
        renderApp();
    });

    priorityFilterSelect.addEventListener('change', (e) => {
        currentPriorityFilter = e.target.value;
        renderApp();
    });

    sortBySelect.addEventListener('change', (e) => {
        currentSortBy = e.target.value;
        renderApp();
    });

    // View Toggle
    viewKanbanBtn.addEventListener('click', () => {
        activeViewMode = 'kanban';
        viewKanbanBtn.classList.add('active');
        viewListBtn.classList.remove('active');
        renderApp();
    });

    viewListBtn.addEventListener('click', () => {
        activeViewMode = 'list';
        viewListBtn.classList.add('active');
        viewKanbanBtn.classList.remove('active');
        renderApp();
    });

    // Sidebar Nav Filters
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            setActiveFilter(item.dataset.filter);
        });
    });

    // Column add buttons
    document.querySelectorAll('.column-add-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            openTaskModal(null, btn.dataset.status);
        });
    });

    // Sidebar Mobile Toggle
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // Global Modal Trigger Buttons
    openTaskModalBtn.addEventListener('click', () => openTaskModal());
    closeTaskModalBtn.addEventListener('click', closeTaskModal);
    cancelTaskModalBtn.addEventListener('click', closeTaskModal);
    emptyStateCreateBtn.addEventListener('click', () => openTaskModal());

    openProjectModalBtn.addEventListener('click', openProjectModal);
    closeProjectModalBtn.addEventListener('click', closeProjectModal);
    cancelProjectModalBtn.addEventListener('click', closeProjectModal);

    // Export & Import Backup Utilities
    exportDataBtn.addEventListener('click', () => {
        const data = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            projects: projects,
            tasks: tasks
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `TaskSphere-Backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });

    importDataBtn.addEventListener('click', () => {
        importFileInput.click();
    });

    importFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data.projects && data.tasks) {
                    projects = data.projects;
                    tasks = data.tasks;
                    saveState();
                    alert('Data imported successfully!');
                } else {
                    alert('Invalid JSON backup file structure.');
                }
            } catch (err) {
                alert('Error parsing JSON file: ' + err.message);
            }
        };
        reader.readAsText(file);
    });

    resetDemoBtn.addEventListener('click', () => {
        if (confirm('Reset to initial sample tasks and projects? Custom data will be overwritten.')) {
            projects = DEFAULT_PROJECTS;
            tasks = DEFAULT_TASKS;
            saveState();
        }
    });

    // --- Helper Escape HTML ---
    function escapeHTML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function capitalizeFirst(str) {
        if (str === 'in-progress') return 'InProgress';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Initial App Render
    renderApp();
});

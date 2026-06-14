document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://127.0.0.1:8001/api/categories';
    let currentCategories = [];
    let editingCategoryId = null;
    let categoryToDelete = null;

    const userRole = localStorage.getItem('empl_role');
    if (userRole === 'Касир') {
        const btnAdd = document.getElementById('btn-open-modal');
        if (btnAdd) btnAdd.remove();

        const actionTh = document.querySelector('th.manager-only');
        if (actionTh) actionTh.remove();
    }

    const modal = document.getElementById('category-modal');
    const form = document.getElementById('category-form');
    const tableBody = document.getElementById('categories-table-body');
    const searchInput = document.getElementById('search-input');

    const errorBox = document.getElementById('modal-error-message');
    const errorText = document.getElementById('modal-error-text');

    function showGlobalAlert(message, type = 'success') {
        let container = document.getElementById('global-alerts-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'global-alerts-container';
            container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px;';
            document.body.appendChild(container);
        }

        const alertEl = document.createElement('div');
        alertEl.className = `alert alert-${type}`;
        const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation';
        alertEl.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
        container.appendChild(alertEl);

        setTimeout(() => {
            alertEl.style.opacity = '0';
            alertEl.style.transform = 'translateY(-10px)';
            alertEl.style.transition = 'all 0.3s ease';
            setTimeout(() => alertEl.remove(), 300);
        }, 3000);
    }

    const toggleModal = () => {
        modal.classList.toggle('hidden');
        errorBox.style.display = 'none';
        document.querySelectorAll('.form-group input').forEach(el => {
            el.style.borderColor = 'var(--border-color)';
        });
    };

    document.getElementById('btn-close-modal').addEventListener('click', toggleModal);
    document.getElementById('btn-cancel').addEventListener('click', toggleModal);

    function loadCategories() {
        const search = searchInput.value.trim();
        const queryParams = new URLSearchParams({ search: search });

        fetch(`${API_URL}/?${queryParams.toString()}`)
            .then(response => response.json())
            .then(data => {
                currentCategories = data;
                tableBody.innerHTML = '';

                if (data.length === 0) {
                    const colspan = userRole === 'Касир' ? 2 : 3;
                    tableBody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center;">Категорій не знайдено</td></tr>`;
                    return;
                }

                data.forEach(cat => {
                    let actionTd = '';
                    if (userRole !== 'Касир') {
                        actionTd = `
                            <td class="manager-only">
                                <button class="icon-btn edit" onclick="openEditModal('${cat.category_number}')" title="Редагувати"><i class="fa-solid fa-pen"></i></button>
                                <button class="icon-btn delete" onclick="openDeleteModal('${cat.category_number}')" title="Видалити"><i class="fa-solid fa-trash"></i></button>
                            </td>
                        `;
                    }

                    const row = `
                        <tr>
                            <td><strong>${cat.category_number}</strong></td>
                            <td>${cat.category_name}</td>
                            ${actionTd}
                        </tr>
                    `;
                    tableBody.insertAdjacentHTML('beforeend', row);
                });
            })
            .catch(error => console.error("Помилка завантаження:", error));
    }

    searchInput.addEventListener('input', loadCategories);

    // Створення
    const btnOpenModal = document.getElementById('btn-open-modal');
    if (btnOpenModal) {
        btnOpenModal.addEventListener('click', () => {
            editingCategoryId = null;
            document.getElementById('modal-title').textContent = 'Додати категорію';
            form.reset();

            const idInput = document.getElementById('category_number');
            let nextId = 1;

            if (currentCategories.length > 0) {
                const maxId = Math.max(...currentCategories.map(c => parseInt(c.category_number)));
                nextId = maxId + 1;
            }

            idInput.value = nextId;
            idInput.disabled = true;

            toggleModal();
        });
    }

    // Редагування
    window.openEditModal = (id) => {
        editingCategoryId = parseInt(id);
        const cat = currentCategories.find(c => c.category_number === editingCategoryId);
        if (!cat) return;

        document.getElementById('modal-title').textContent = 'Редагувати категорію';
        document.getElementById('category_number').value = cat.category_number;
        document.getElementById('category_number').disabled = true;
        document.getElementById('category_name').value = cat.category_name;

        toggleModal();
    };

    // PUT + Валідація
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        errorBox.style.display = 'none';

        const categoryNameInput = document.getElementById('category_name');
        const categoryNameValue = categoryNameInput.value.trim();

        if (!categoryNameValue) {
            errorText.textContent = "Будь ласка, заповніть всі обов'язкові поля.";
            errorBox.style.display = 'flex';
            categoryNameInput.style.borderColor = 'var(--color-rust)';
            return;
        }

        const nameRegex = /^[A-Za-zА-Яа-яІіЇїЄєҐґ\s'’\-]+$/;

        if (!nameRegex.test(categoryNameValue)) {
            errorText.textContent = "Назва категорії може містити лише літери, пробіли, апострофи та дефіси.";
            errorBox.style.display = 'flex';
            categoryNameInput.style.borderColor = 'var(--color-rust)';
            return;
        }

        categoryNameInput.style.borderColor = 'var(--border-color)';

        const payload = {
            category_name: categoryNameValue
        };

        let method = 'POST';
        let url = `${API_URL}/`;

        if (editingCategoryId) {
            method = 'PUT';
            url = `${API_URL}/${editingCategoryId}/`;
        } else {
            payload.category_number = parseInt(document.getElementById('category_number').value);
        }

        fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(async response => {
            if (response.ok || response.status === 201) {
                showGlobalAlert(editingCategoryId ? 'Назву категорії оновлено!' : 'Категорію успішно додано!', 'success');
                toggleModal();
                loadCategories();
            } else {
                const errData = await response.json();
                errorText.textContent = errData.error || errData.detail || 'Помилка збереження';
                errorBox.style.display = 'flex';
            }
        })
        .catch(error => {
            console.error('Помилка збереження:', error);
            errorText.textContent = 'Сервер не відповідає. Спробуйте пізніше.';
            errorBox.style.display = 'flex';
        });
    });

    // Кастомне видалення
    const deleteModal = document.getElementById('delete-modal');
    const btnCancelDelete = document.getElementById('btn-cancel-delete');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');

    if (deleteModal) {
        window.openDeleteModal = (id) => {
            categoryToDelete = id;
            document.getElementById('delete-modal-text').innerHTML = `Ви дійсно хочете видалити категорію №<strong>${id}</strong>?`;
            deleteModal.classList.remove('hidden');
        };

        btnCancelDelete.addEventListener('click', () => {
            deleteModal.classList.add('hidden');
            categoryToDelete = null;
        });

        btnConfirmDelete.addEventListener('click', () => {
            if (!categoryToDelete) return;

            fetch(`${API_URL}/${categoryToDelete}/`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            })
            .then(async response => {
                deleteModal.classList.add('hidden');
                if (response.ok || response.status === 204) {
                    showGlobalAlert('Категорію успішно видалено!', 'success');
                    loadCategories();
                } else {
                    const errData = await response.json();
                    showGlobalAlert(errData.detail || errData.error || 'Помилка видалення', 'error');
                }
                categoryToDelete = null;
            })
            .catch(error => {
                console.error('Помилка видалення:', error);
                deleteModal.classList.add('hidden');
                showGlobalAlert('Сталася помилка при видаленні', 'error');
            });
        });
    }

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.add('hidden');
                categoryToDelete = null;
                if (errorBox) errorBox.style.display = 'none';
                form.querySelectorAll('input').forEach(el => el.style.borderColor = 'var(--border-color)');
            }
        });
    });

    loadCategories();
});


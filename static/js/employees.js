document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://127.0.0.1:8001/api/employees';
    let currentEmployees = [];
    let editingEmployeeId = null;
    let employeeToDelete = null;

    const modal = document.getElementById('employee-modal');
    const form = document.getElementById('employee-form');
    const tableBody = document.getElementById('employees-table-body');
    const searchInput = document.getElementById('search-input');
    const roleFilter = document.getElementById('role-filter');

    const errorBox = document.getElementById('modal-error-message');
    const errorText = document.getElementById('modal-error-text');

    setupCustomSelect('role-filter');

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
        document.querySelectorAll('.form-group input, .form-group select').forEach(el => {
            el.style.borderColor = 'var(--border-color)';
        });
    };

    document.getElementById('btn-close-modal').addEventListener('click', toggleModal);
    document.getElementById('btn-cancel').addEventListener('click', toggleModal);

    function loadEmployees() {
        const search = searchInput.value.trim();
        const role = roleFilter.value;
        const queryParams = new URLSearchParams({ search: search, role: role });

        const formatDate = (dateString) => {
            if (!dateString) return '-';
            const date = new Date(dateString);
            return date.toLocaleDateString('uk-UA');
        };

        const calculateAge = (dateString) => {
            if (!dateString) return '';
            const birthDate = new Date(dateString);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return age;
        };

        fetch(`${API_URL}/?${queryParams.toString()}`)
            .then(response => response.json())
            .then(data => {
                currentEmployees = data;
                tableBody.innerHTML = '';

                if (data.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="9" style="text-align: center;">Записів не знайдено</td></tr>';
                    return;
                }

                data.forEach(emp => {
                    const roleClass = emp.empl_role === 'Менеджер' ? 'role-manager' : 'role-cashier';
                    const patronymic = emp.empl_patronymic ? emp.empl_patronymic : '';
                    const fullName = `${emp.empl_surname} ${emp.empl_name} ${patronymic}`.trim();

                    // Повна адреса
                    const zip = emp.zip_code ? `, ${emp.zip_code}` : '';
                    const fullAddress = `м. ${emp.city}, вул. ${emp.street}${zip}`;

                    // Дата народження з віком
                    const dobFormatted = formatDate(emp.date_of_birth);
                    const age = calculateAge(emp.date_of_birth);
                    const dobDisplay = emp.date_of_birth ? `${dobFormatted} (${age} р.)` : '-';

                    const row = `
                        <tr>
                            <td><strong>${emp.id_employee}</strong></td>
                            <td>${fullName}</td>
                            <td><span class="role-badge ${roleClass}">${emp.empl_role}</span></td>
                            <td>${emp.phone_number}</td>
                            
                            <td>
                                <div class="address-wrapper" data-tooltip="${fullAddress}">
                                    <span class="address-text">${fullAddress}</span>
                                </div>
                            </td>
                            
                            <td>${dobDisplay}</td>
                            <td>${formatDate(emp.date_of_start)}</td>
                            <td>${parseFloat(emp.salary).toFixed(2)} ₴</td>
                            <td>
                                <button class="icon-btn edit" onclick="openEditModal('${emp.id_employee}')" title="Редагувати"><i class="fa-solid fa-pen"></i></button>
                                <button class="icon-btn delete" onclick="openDeleteModal('${emp.id_employee}')" title="Видалити"><i class="fa-solid fa-trash"></i></button>
                            </td>
                        </tr>
                    `;
                    tableBody.insertAdjacentHTML('beforeend', row);
                });
            })
            .catch(error => console.error("Помилка завантаження:", error));
    }

    searchInput.addEventListener('input', loadEmployees);
    roleFilter.addEventListener('change', loadEmployees);

    // Створення
    document.getElementById('btn-open-modal').addEventListener('click', () => {
        editingEmployeeId = null;
        document.getElementById('modal-title').textContent = 'Додати працівника';
        form.reset();

        document.getElementById('id_employee').disabled = false;
        document.getElementById('phone_number').value = '+380';

        document.getElementById('password-group').style.display = 'flex';
        document.getElementById('employee_password').required = true;

        toggleModal();
    });

    // Редагування
    window.openEditModal = (id) => {
        editingEmployeeId = id;
        const emp = currentEmployees.find(e => e.id_employee === id);
        if (!emp) return;

        document.getElementById('modal-title').textContent = 'Редагувати працівника';

        document.getElementById('id_employee').value = emp.id_employee;
        document.getElementById('id_employee').disabled = true;

        document.getElementById('empl_role').value = emp.empl_role;
        document.getElementById('empl_surname').value = emp.empl_surname;
        document.getElementById('empl_name').value = emp.empl_name;
        document.getElementById('empl_patronymic').value = emp.empl_patronymic || '';
        document.getElementById('salary').value = parseFloat(emp.salary).toFixed(2);
        document.getElementById('phone_number').value = emp.phone_number;
        document.getElementById('date_of_birth').value = emp.date_of_birth;
        document.getElementById('date_of_start').value = emp.date_of_start;
        document.getElementById('city').value = emp.city;
        document.getElementById('street').value = emp.street;
        document.getElementById('zip_code').value = emp.zip_code;

        document.getElementById('password-group').style.display = 'none';
        document.getElementById('employee_password').required = false;

        toggleModal();
    };

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        errorBox.style.display = 'none';

        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        requiredFields.forEach(field => {
            if (field.offsetParent !== null && !field.value.trim()) {
                isValid = false;
                field.style.borderColor = 'var(--color-rust)';
            } else {
                field.style.borderColor = 'var(--border-color)';
            }
        });

        if (!isValid) {
            errorText.textContent = "Будь ласка, заповніть всі обов'язкові поля виділені червоним.";
            errorBox.style.display = 'flex';
            return;
        }

        const payload = {
            empl_role: document.getElementById('empl_role').value,
            empl_surname: document.getElementById('empl_surname').value,
            empl_name: document.getElementById('empl_name').value,
            empl_patronymic: document.getElementById('empl_patronymic').value || null,
            salary: document.getElementById('salary').value,
            phone_number: document.getElementById('phone_number').value,
            date_of_birth: document.getElementById('date_of_birth').value,
            date_of_start: document.getElementById('date_of_start').value,
            city: document.getElementById('city').value,
            street: document.getElementById('street').value,
            zip_code: document.getElementById('zip_code').value
        };

        let method = 'POST';
        let url = `${API_URL}/`;

        if (editingEmployeeId) {
            method = 'PUT';
            url = `${API_URL}/${editingEmployeeId}/`;
            payload.id_employee = editingEmployeeId;
        } else {
            payload.id_employee = document.getElementById('id_employee').value;
            payload.password = document.getElementById('employee_password').value;
        }

        fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(async response => {
            if (response.ok || response.status === 201) {
                showGlobalAlert(editingEmployeeId ? 'Дані працівника успішно оновлено!' : 'Працівника успішно додано!', 'success');
                toggleModal();
                loadEmployees();
            } else {
                const errData = await response.json();
                errorText.textContent = errData.error || errData.detail || 'Невідома помилка при збереженні';
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

    window.openDeleteModal = (id) => {
        employeeToDelete = id;
        document.getElementById('delete-modal-text').innerHTML = `Ви дійсно хочете безповоротно видалити працівника з ID <strong>${id}</strong>?`;
        deleteModal.classList.remove('hidden');
    };

    btnCancelDelete.addEventListener('click', () => {
        deleteModal.classList.add('hidden');
        employeeToDelete = null;
    });

    btnConfirmDelete.addEventListener('click', () => {
        if (!employeeToDelete) return;

        fetch(`${API_URL}/${employeeToDelete}/`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        })
        .then(async response => {
            deleteModal.classList.add('hidden');
            if (response.ok || response.status === 204) {
                showGlobalAlert('Працівника успішно видалено!', 'success');
                loadEmployees();
            } else {
                const errData = await response.json();
                showGlobalAlert(errData.detail || errData.error || 'Помилка видалення', 'error');
            }
            employeeToDelete = null;
        })
        .catch(error => {
            console.error('Помилка видалення:', error);
            deleteModal.classList.add('hidden');
            showGlobalAlert('Сталася помилка при видаленні', 'error');
        });
    });

    // Розширення адреси
    const tooltipEl = document.createElement('div');
    tooltipEl.className = 'smart-tooltip';
    document.body.appendChild(tooltipEl);

    tableBody.addEventListener('mouseover', (e) => {
        const wrapper = e.target.closest('.address-wrapper');
        if (!wrapper) return;

        const textEl = wrapper.querySelector('.address-text');

        if (textEl.scrollWidth > textEl.clientWidth) {
            wrapper.style.cursor = 'help';
            tooltipEl.textContent = wrapper.getAttribute('data-tooltip');
            tooltipEl.classList.add('show');

            const rect = wrapper.getBoundingClientRect();
            const tooltipHeight = tooltipEl.offsetHeight;

            let top = rect.bottom + window.scrollY + 8;
            let left = rect.left + window.scrollX;

            if (rect.bottom + tooltipHeight + 10 > window.innerHeight) {
                top = rect.top + window.scrollY - tooltipHeight - 8;
            }

            tooltipEl.style.top = `${top}px`;
            tooltipEl.style.left = `${left}px`;
        } else {
            wrapper.style.cursor = 'default';
        }
    });

    tableBody.addEventListener('mouseout', (e) => {
        const wrapper = e.target.closest('.address-wrapper');
        if (wrapper) {
            tooltipEl.classList.remove('show');
        }
    });

    loadEmployees();
});


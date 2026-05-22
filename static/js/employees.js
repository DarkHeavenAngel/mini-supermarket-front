document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://127.0.0.1:8001/api/employees';

    // Елементи модального вікна
    const modal = document.getElementById('employee-modal');
    const btnOpen = document.getElementById('btn-open-modal');
    const btnClose = document.getElementById('btn-close-modal');
    const btnCancel = document.getElementById('btn-cancel');
    const form = document.getElementById('employee-form');
    const tableBody = document.getElementById('employees-table-body');

    // Відкриття / Закриття вікна
    const toggleModal = () => modal.classList.toggle('hidden');
    btnOpen.addEventListener('click', toggleModal);
    btnClose.addEventListener('click', toggleModal);
    btnCancel.addEventListener('click', toggleModal);

    // Завантаження списку працівників
    function loadEmployees() {
        fetch(API_URL)
            .then(response => response.json())
            .then(data => {
                tableBody.innerHTML = '';

                if (data.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Немає записів</td></tr>';
                    return;
                }

                data.forEach(emp => {
                    // Колір плашки залежить від ролі
                    const roleClass = emp.empl_role === 'Менеджер' ? 'role-manager' : 'role-cashier';

                    const row = `
                        <tr>
                            <td>${emp.id_employee}</td>
                            <td>${emp.empl_surname} ${emp.empl_name}</td>
                            <td><span class="role-badge ${roleClass}">${emp.empl_role}</span></td>
                            <td>${emp.phone_number}</td>
                            <td>${emp.city}</td>
                            <td>${parseFloat(emp.salary).toFixed(2)} ₴</td>
                            <td>
                                <button class="icon-btn edit" title="Редагувати"><i class="fa-solid fa-pen"></i></button>
                                <button class="icon-btn delete" title="Видалити"><i class="fa-solid fa-trash"></i></button>
                            </td>
                        </tr>
                    `;
                    tableBody.insertAdjacentHTML('beforeend', row);
                });
            })
            .catch(error => {
                console.error("Помилка завантаження:", error);
                tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: red;">Помилка з\'єднання з сервером</td></tr>';
            });
    }

    // Додавання нового працівника
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Збираємо дані
        const payload = {
            id_employee: document.getElementById('id_employee').value,
            empl_role: document.getElementById('empl_role').value,
            empl_surname: document.getElementById('empl_surname').value,
            empl_name: document.getElementById('empl_name').value,
            salary: document.getElementById('salary').value,
            phone_number: document.getElementById('phone_number').value,
            date_of_birth: document.getElementById('date_of_birth').value,
            date_of_start: document.getElementById('date_of_start').value,
            city: document.getElementById('city').value,
            street: document.getElementById('street').value,
            zip_code: document.getElementById('zip_code').value
        };

        // POST запит на бекенд
        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Працівника успішно додано!');
                form.reset();
                toggleModal(); // Закриваємо вікно
                loadEmployees(); // Оновлюємо таблицю щоб побачити нового працівника
            } else {
                alert('Помилка: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Помилка:', error);
            alert("Сталася помилка відправки даних.");
        });
    });

    loadEmployees();
});


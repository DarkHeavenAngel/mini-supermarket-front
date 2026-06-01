document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://127.0.0.1:8001/api/customers';
    const userRole = localStorage.getItem('empl_role');
    let currentCustomers = [];
    let editingCardId = null;
    let cardToDelete = null;

    const modal = document.getElementById('customer-modal');
    const form = document.getElementById('customer-form');
    const tableBody = document.getElementById('customers-table-body');
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

    if (userRole === 'Касир') {
        const btnAdd = document.getElementById('btn-open-modal');
        if (btnAdd) btnAdd.style.display = 'none';
    }

    const toggleModal = () => {
        modal.classList.toggle('hidden');
        errorBox.style.display = 'none';
        form.querySelectorAll('input').forEach(el => el.style.borderColor = 'var(--border-color)');
    };

    document.getElementById('btn-close-modal').addEventListener('click', toggleModal);
    document.getElementById('btn-cancel').addEventListener('click', toggleModal);

    const tooltipEl = document.createElement('div');
    tooltipEl.className = 'smart-tooltip';
    document.body.appendChild(tooltipEl);

    tableBody.addEventListener('mouseover', (e) => {
        const wrapper = e.target.closest('.address-wrapper');
        if (!wrapper) return;
        const textEl = wrapper.querySelector('.address-text');
        if (textEl.scrollWidth > textEl.clientWidth) {
            tooltipEl.textContent = wrapper.getAttribute('data-tooltip');
            tooltipEl.classList.add('show');
            const rect = wrapper.getBoundingClientRect();
            let top = rect.bottom + window.scrollY + 8;
            if (rect.bottom + 100 > window.innerHeight) top = rect.top + window.scrollY - 40;
            tooltipEl.style.top = `${top}px`;
            tooltipEl.style.left = `${rect.left + window.scrollX}px`;
        }
    });
    tableBody.addEventListener('mouseout', () => tooltipEl.classList.remove('show'));

    function loadCustomers() {
        const search = searchInput.value.trim();
        fetch(`${API_URL}/?search=${search}`)
            .then(res => res.json())
            .then(data => {
                currentCustomers = data;
                tableBody.innerHTML = '';

                if (data.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Клієнтів не знайдено</td></tr>';
                    return;
                }

                data.forEach(cust => {
                    const fullAddress = `м. ${cust.city}, вул. ${cust.street}, ${cust.zip_code}`;
                    const patronymic = cust.cust_patronymic || '';

                    let actions = `<button class="icon-btn edit" onclick="openEditModal('${cust.card_number}')" title="Редагувати"><i class="fa-solid fa-pen"></i></button>`;

                    if (userRole === 'Менеджер') {
                        actions += `<button class="icon-btn delete" onclick="openDeleteModal('${cust.card_number}')" title="Видалити"><i class="fa-solid fa-trash"></i></button>`;
                    }

                    tableBody.insertAdjacentHTML('beforeend', `
                        <tr>
                            <td><strong>${cust.card_number}</strong></td>
                            <td>${cust.cust_surname}</td>
                            <td>${cust.cust_name}</td>
                            <td>${patronymic}</td>
                            <td>${cust.phone_number}</td>
                            <td><div class="address-wrapper" data-tooltip="${fullAddress}"><span class="address-text">${fullAddress}</span></div></td>
                            <td>${cust.percent}%</td>
                            <td>${actions}</td>
                        </tr>
                    `);
                });
            })
            .catch(err => console.error("Помилка завантаження:", err));
    }

    searchInput.addEventListener('input', loadCustomers);

    document.getElementById('btn-open-modal').addEventListener('click', () => {
        editingCardId = null;
        document.getElementById('modal-title').textContent = 'Додати клієнта';
        form.reset();
        document.getElementById('card_number').disabled = false;
        toggleModal();
    });

    window.openEditModal = (id) => {
        editingCardId = id;
        const cust = currentCustomers.find(c => c.card_number == id);
        if (!cust) return;
        document.getElementById('modal-title').textContent = 'Редагувати клієнта';
        document.getElementById('card_number').value = cust.card_number;
        document.getElementById('card_number').disabled = true;
        document.getElementById('cust_surname').value = cust.cust_surname;
        document.getElementById('cust_name').value = cust.cust_name;
        document.getElementById('cust_patronymic').value = cust.cust_patronymic || '';
        document.getElementById('phone_number').value = cust.phone_number;
        document.getElementById('city').value = cust.city;
        document.getElementById('street').value = cust.street;
        document.getElementById('zip_code').value = cust.zip_code;
        document.getElementById('percent').value = cust.percent;
        toggleModal();
    };

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const payload = {
            card_number: document.getElementById('card_number').value,
            cust_surname: document.getElementById('cust_surname').value,
            cust_name: document.getElementById('cust_name').value,
            cust_patronymic: document.getElementById('cust_patronymic').value,
            phone_number: document.getElementById('phone_number').value,
            city: document.getElementById('city').value,
            street: document.getElementById('street').value,
            zip_code: document.getElementById('zip_code').value,
            percent: document.getElementById('percent').value
        };

        fetch(editingCardId ? `${API_URL}/${editingCardId}/` : `${API_URL}/`, {
            method: editingCardId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(res => {
            if (res.ok) {
                showGlobalAlert('Збережено успішно!');
                toggleModal();
                loadCustomers();
            } else {
                res.json().then(err => {
                    errorText.textContent = err.error || err.detail || 'Помилка збереження';
                    errorBox.style.display = 'flex';
                });
            }
        });
    });

    const deleteModal = document.getElementById('delete-modal');
    window.openDeleteModal = (id) => {
        cardToDelete = id;
        document.getElementById('delete-modal-text').innerHTML = `Видалити картку №<strong>${id}</strong>?`;
        deleteModal.classList.remove('hidden');
    };

    document.getElementById('btn-confirm-delete').addEventListener('click', () => {
        fetch(`${API_URL}/${cardToDelete}/`, { method: 'DELETE' }).then(() => {
            deleteModal.classList.add('hidden');
            showGlobalAlert('Видалено!');
            loadCustomers();
        });
    });

    document.getElementById('btn-cancel-delete').addEventListener('click', () => deleteModal.classList.add('hidden'));

    loadCustomers();
});


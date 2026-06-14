document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://127.0.0.1:8001/api/checks';
    const PROD_URL = 'http://127.0.0.1:8001/api/store_products';
    const CARD_URL = 'http://127.0.0.1:8001/api/customers';
    const EMP_URL = 'http://127.0.0.1:8001/api/employees';

    const userRole = localStorage.getItem('empl_role');
    let currentChecks = [];
    let availableProducts = [];
    let checkToDelete = null;

    const tableBody = document.getElementById('checks-table-body');
    const dateFrom = document.getElementById('date-from');
    const dateTo = document.getElementById('date-to');

    if (userRole === 'Менеджер') {
        document.querySelectorAll('.cashier-only').forEach(el => el.remove());
    }
    if (userRole === 'Касир') {
        document.querySelectorAll('.manager-only').forEach(el => el.remove());
    }

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

    function loadChecks() {
        let url = `${API_URL}/?`;
        if (dateFrom.value) url += `start_date=${dateFrom.value}&`;
        if (dateTo.value) url += `end_date=${dateTo.value}&`;

        const cashierFilter = document.getElementById('cashier-filter');
        if (cashierFilter && cashierFilter.value) {
            url += `id_employee=${cashierFilter.value}&`;
        }

        fetch(url)
            .then(res => res.json())
            .then(data => {
                currentChecks = data;
                tableBody.innerHTML = '';

                if (data.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Чеки не знайдено</td></tr>';
                    return;
                }

                data.forEach(c => {
                    const dateObj = new Date(c.print_date);
                    const formattedDate = dateObj.toLocaleString('uk-UA');

                    let actions = `<button class="icon-btn edit" onclick="openViewModal('${c.check_number}')" title="Деталі чека"><i class="fa-solid fa-eye"></i></button>`;
                    if (userRole === 'Менеджер') {
                        actions += `<button class="icon-btn delete" onclick="openDeleteModal('${c.check_number}')" title="Видалити"><i class="fa-solid fa-trash"></i></button>`;
                    }

                    tableBody.insertAdjacentHTML('beforeend', `
                        <tr>
                            <td><strong>${c.check_number}</strong></td>
                            <td>${formattedDate}</td>
                            <td>${c.empl_surname} ${c.empl_name.charAt(0)}.</td>
                            <td>${c.percent ? c.percent + '%' : '-'}</td>
                            <td><strong>${parseFloat(c.sum_total).toFixed(2)}</strong></td>
                            <td>${parseFloat(c.vat).toFixed(2)}</td>
                            <td>${actions}</td>
                        </tr>
                    `);
                });
            });
    }

    document.getElementById('btn-filter-dates').addEventListener('click', loadChecks);

    document.getElementById('btn-reset-dates').addEventListener('click', () => {
        const fpFrom = document.getElementById('date-from')._flatpickr;
        const fpTo = document.getElementById('date-to')._flatpickr;

        if (fpFrom) fpFrom.clear();
        else document.getElementById('date-from').value = '';

        if (fpTo) fpTo.clear();
        else document.getElementById('date-to').value = '';

        const cashierFilter = document.getElementById('cashier-filter');
        if (cashierFilter) {
            cashierFilter.value = '';
            const wrapper = cashierFilter.parentNode;
            if (wrapper && wrapper.classList.contains('custom-select-wrapper')) {
                wrapper.querySelector('span').textContent = 'Всі касири';
            }
        }

        loadChecks();
    });

    if (userRole === 'Менеджер') {
        fetch(`${EMP_URL}/?role=Касир`)
            .then(res => res.json())
            .then(data => {
                const cashierSelect = document.getElementById('cashier-filter');
                if (cashierSelect) {
                    data.forEach(emp => {
                        cashierSelect.insertAdjacentHTML('beforeend', `<option value="${emp.id_employee}">${emp.empl_surname} ${emp.empl_name}</option>`);
                    });
                    setupCustomSelect('cashier-filter');
                    cashierSelect.addEventListener('change', loadChecks);
                }
            });
    }

    // Створення
    const createModal = document.getElementById('create-check-modal');
    const itemsContainer = document.getElementById('check-items-container');
    const errorBox = document.getElementById('create-error-message');
    const errorText = document.getElementById('create-error-text');

    if (userRole === 'Касир') {
        fetch(PROD_URL).then(res => res.json()).then(data => availableProducts = data.filter(p => p.products_number > 0));
        fetch(CARD_URL).then(res => res.json()).then(data => {
            const cardSelect = document.getElementById('card_number');
            data.forEach(c => {
                cardSelect.insertAdjacentHTML('beforeend', `<option value="${c.card_number}">${c.cust_surname} ${c.cust_name} (-${c.percent}%)</option>`);
            });
            setupCustomSelect('card_number');
        });

        window.checkScrollLimit = () => {
            const rows = itemsContainer.querySelectorAll('.check-row');
            if (rows.length > 3) {
                itemsContainer.classList.add('scroll-active');
            } else {
                itemsContainer.classList.remove('scroll-active');
            }
        };

        window.removeCheckRow = (rowId) => {
            const row = document.getElementById(`row-${rowId}`);
            if (row) {
                const wrapper = row.querySelector('.custom-select-wrapper');
                if (wrapper && wrapper.optionsContainerRef) {
                    wrapper.optionsContainerRef.remove();
                }
                row.remove();
                window.checkScrollLimit();
            }
        };

        document.getElementById('btn-open-modal').addEventListener('click', () => {
            document.getElementById('create-check-form').reset();

            itemsContainer.querySelectorAll('.custom-select-wrapper').forEach(w => {
                if(w.optionsContainerRef) w.optionsContainerRef.remove();
            });
            itemsContainer.innerHTML = '';
            errorBox.style.display = 'none';
            document.getElementById('card_number').dispatchEvent(new Event('change'));

            addCheckRow();
            createModal.classList.remove('hidden');

            document.body.style.overflow = 'hidden';
        });

        const closeCreateModal = () => {
            createModal.classList.add('hidden');
            document.body.style.overflow = '';
            itemsContainer.querySelectorAll('.custom-select-wrapper').forEach(w => {
                if(w.optionsContainerRef) w.optionsContainerRef.remove();
            });
        };
        document.getElementById('btn-close-create').addEventListener('click', closeCreateModal);
        document.getElementById('btn-cancel-create').addEventListener('click', closeCreateModal);

        window.addCheckRow = () => {
            const rowId = Date.now();
            const selectId = `item-upc-${rowId}`;

            let options = '<option value="" disabled selected>Оберіть товар...</option>';
            availableProducts.forEach(p => {
                const badge = p.promotional_product ? ' (АКЦІЯ)' : '';
                const formattedPrice = parseFloat(p.selling_price).toFixed(2);
                options += `<option value="${p.upc}" data-max="${p.products_number}">${p.product_name}${badge} - ${formattedPrice}₴ (Залишок: ${p.products_number})</option>`;
            });

            const rowHTML = `
                <div class="check-row" id="row-${rowId}">
                    <div style="min-width: 0;">
                        <select id="${selectId}" class="item-upc" required>${options}</select>
                    </div>
                    <div>
                        <input type="number" class="item-qty" placeholder="К-сть" required min="1" step="1">
                    </div>
                    <button type="button" class="remove-row-btn" onclick="removeCheckRow('${rowId}')" title="Видалити рядок">
                        <i class="fa-solid fa-circle-minus"></i>
                    </button>
                </div>
            `;
            itemsContainer.insertAdjacentHTML('beforeend', rowHTML);

            setupCustomSelect(selectId);
            window.checkScrollLimit();

            itemsContainer.scrollTop = itemsContainer.scrollHeight;
        };

        document.getElementById('btn-add-item').addEventListener('click', addCheckRow);
        document.getElementById('create-check-form').addEventListener('submit', (e) => {
            e.preventDefault();
            errorBox.style.display = 'none';

            const rows = document.querySelectorAll('.check-row');
            if (rows.length === 0) {
                errorText.textContent = "Чек не може бути порожнім!";
                errorBox.style.display = 'flex';
                return;
            }

            let isValid = true;
            let items = [];

            rows.forEach(row => {
                const select = row.querySelector('.item-upc');
                const qtyInput = row.querySelector('.item-qty');
                const customSelectTrigger = row.querySelector('.custom-select-trigger');

                if (customSelectTrigger) customSelectTrigger.style.borderColor = 'var(--border-color)';
                qtyInput.style.borderColor = 'var(--border-color)';

                if (!select.value || !qtyInput.value) {
                    isValid = false;

                    if (!select.value && customSelectTrigger) customSelectTrigger.style.borderColor = 'var(--color-rust)';
                    if (!qtyInput.value) qtyInput.style.borderColor = 'var(--color-rust)';

                    errorText.textContent = "Будь ласка, оберіть товар та вкажіть його кількість для всіх позицій.";
                    errorBox.style.display = 'flex';
                }
                else {
                    const selectedOption = select.options[select.selectedIndex];
                    const maxQty = parseInt(selectedOption.getAttribute('data-max'));
                    const reqQty = parseInt(qtyInput.value);

                    if (reqQty > maxQty) {
                        qtyInput.style.borderColor = 'var(--color-rust)';
                        errorText.textContent = `Ви не можете пробити більше товарів, ніж є на складі! (Залишок: ${maxQty})`;
                        errorBox.style.display = 'flex';
                        isValid = false;
                    }
                    items.push({ upc: select.value, quantity: reqQty });
                }
            });

            if (!isValid) return;

            const payload = {
                card_number: document.getElementById('card_number').value || null,
                items: items
            };

            fetch(API_URL + '/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).then(async res => {
                if (res.ok) {
                    showGlobalAlert('Чек успішно пробито!');
                    closeCreateModal();
                    loadChecks();
                    fetch(PROD_URL).then(r => r.json()).then(data => availableProducts = data.filter(p => p.products_number > 0));
                } else {
                    const err = await res.json();
                    errorText.textContent = err.error || 'Помилка при створенні чека';
                    errorBox.style.display = 'flex';
                }
            });
        });
    }

    // Перегляд
    const viewModal = document.getElementById('view-check-modal');
    window.openViewModal = (checkNum) => {
        fetch(`${API_URL}/${checkNum}/`)
            .then(res => res.json())
            .then(data => {
                let itemsHTML = '';
                data.items.forEach(item => {
                    const totalItemPrice = (item.selling_price * item.product_number).toFixed(2);
                    itemsHTML += `
                        <div class="receipt-item">
                            <div class="receipt-item-name">${item.product_name} <br> <small>${item.product_number} x ${item.selling_price} ₴</small></div>
                            <div>${totalItemPrice}</div>
                        </div>
                    `;
                });

                const dateObj = new Date(data.print_date);
                const html = `
                    <div class="receipt-header">
                        <h3>Міні-супермаркет ZLAGODA</h3>
                        <div>Чек № ${data.check_number}</div>
                        <div>Касир: ${data.id_employee}</div>
                        <div>${dateObj.toLocaleString('uk-UA')}</div>
                    </div>
                    ${itemsHTML}
                    <div class="receipt-divider"></div>
                    <div class="receipt-total">
                        <span>ПДВ (20%):</span>
                        <span>${parseFloat(data.vat).toFixed(2)} ₴</span>
                    </div>
                    <div class="receipt-total" style="margin-top: 10px;">
                        <span>ДО СПЛАТИ:</span>
                        <span>${parseFloat(data.sum_total).toFixed(2)} ₴</span>
                    </div>
                    <div style="text-align: center; margin-top: 20px; font-size: 12px;">Дякуємо за покупку!</div>
                `;
                document.getElementById('receipt-content').innerHTML = html;
                viewModal.classList.remove('hidden');
            });
    };
    document.getElementById('btn-close-view').addEventListener('click', () => viewModal.classList.add('hidden'));

    // Видалення
    const deleteModal = document.getElementById('delete-modal');
    if (userRole === 'Менеджер') {
        window.openDeleteModal = (checkNum) => {
            checkToDelete = checkNum;
            document.getElementById('delete-modal-text').innerHTML = `Ви дійсно хочете видалити чек № <strong>${checkNum}</strong>?`;
            deleteModal.classList.remove('hidden');
        };

        document.getElementById('btn-cancel-delete').addEventListener('click', () => {
            deleteModal.classList.add('hidden');
            checkToDelete = null;
        });

        document.getElementById('btn-confirm-delete').addEventListener('click', () => {
            if (!checkToDelete) return;

            const returnItems = document.getElementById('return-items-checkbox').checked;

            fetch(`${API_URL}/${checkToDelete}/?return_items=${returnItems}`, { method: 'DELETE' })
                .then(async res => {
                    deleteModal.classList.add('hidden');
                    if (res.ok) {
                        showGlobalAlert('Чек видалено!', 'success');
                        loadChecks();
                    } else {
                        const errData = await res.json();
                        showGlobalAlert(errData.error || errData.detail || 'Помилка видалення', 'error');
                    }
                    checkToDelete = null;
                    document.getElementById('return-items-checkbox').checked = false;
                });
        });
    }

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.add('hidden');
                document.body.style.overflow = '';

                if (overlay.id === 'delete-modal') {
                    checkToDelete = null;
                }
            }
        });
    });

    loadChecks();
});


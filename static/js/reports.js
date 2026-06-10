document.addEventListener('DOMContentLoaded', () => {
    const userRole = localStorage.getItem('empl_role');

    if (userRole !== 'Менеджер') return;

    const EMPL_URL = 'http://127.0.0.1:8001/api/employees/';
    const PROD_URL = 'http://127.0.0.1:8001/api/products/';
    const REPORT_PROD_URL = 'http://127.0.0.1:8001/api/reports/product-sales/';
    const REPORT_SALES_URL = 'http://127.0.0.1:8001/api/reports/total-sales/';

    const previewContainer = document.getElementById('report-preview-container');
    const reportContent = document.getElementById('report-content');

    fetch(`${EMPL_URL}?role=Касир`)
        .then(res => res.json())
        .then(data => {
            const cashierSelect = document.getElementById('report-cashier-id');
            data.forEach(emp => {
                cashierSelect.insertAdjacentHTML('beforeend', `<option value="${emp.id_employee}">${emp.empl_surname} ${emp.empl_name}</option>`);
            });
            setupCustomSelect('report-cashier-id');
        });

    fetch(PROD_URL)
        .then(res => res.json())
        .then(data => {
            const prodSelect = document.getElementById('report-product-id');
            prodSelect.innerHTML = '<option value="" disabled selected>Оберіть товар...</option>';
            data.forEach(p => {
                prodSelect.insertAdjacentHTML('beforeend', `<option value="${p.id_product}">${p.product_name} (ID: ${p.id_product})</option>`);
            });
            setupCustomSelect('report-product-id');
        });

    function updatePrintDate() {
        const now = new Date();
        document.getElementById('print-date').textContent = `Дата формування: ${now.toLocaleDateString('uk-UA')} ${now.toLocaleTimeString('uk-UA')}`;
    }

    function validateForm(form, errorBox, errorText) {
        let isValid = true;

        errorBox.style.display = 'none';
        form.querySelectorAll('input, select').forEach(el => el.style.borderColor = 'var(--border-color, #d1d5db)');

        form.querySelectorAll('[required]').forEach(field => {
            if (field.offsetParent !== null && !field.value.trim()) {
                isValid = false;
                field.style.borderColor = 'var(--color-rust)';
            }
        });

        if (!isValid) {
            errorText.textContent = "Будь ласка, заповніть всі обов'язкові поля, виділені червоним.";
            errorBox.style.display = 'flex';
        }

        return isValid;
    }

    // Звіт 1
    document.getElementById('product-report-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.target;
        const errorBox = document.getElementById('product-error-message');
        const errorText = document.getElementById('product-error-text');

        if (!validateForm(form, errorBox, errorText)) return;

        const idProduct = document.getElementById('report-product-id').value;
        const dateFromInput = document.getElementById('p-date-from');
        const dateToInput = document.getElementById('p-date-to');

        if (dateFromInput.value > dateToInput.value) {
            errorText.textContent = 'Початкова дата не може бути більшою за кінцеву!';
            errorBox.style.display = 'flex';
            dateFromInput.style.borderColor = 'var(--color-rust)';
            dateToInput.style.borderColor = 'var(--color-rust)';
            return;
        }

        fetch(`${REPORT_PROD_URL}?id_product=${idProduct}&start_date=${dateFromInput.value}&end_date=${dateToInput.value}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) throw new Error(data.error);

                document.getElementById('print-report-title').textContent = "Звіт: Продажі конкретного товару";
                updatePrintDate();

                let html = `
                    <h3 class="no-print">Попередній перегляд: Продажі товару</h3>
                    <p><strong>Період:</strong> з ${dateFromInput.value} по ${dateToInput.value}</p>
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>ID Товару</th>
                                <th>Назва товару</th>
                                <th>Продано одиниць (звичайних та акційних)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${data.id_product}</td>
                                <td>${data.product_name || 'Невідомо'}</td>
                                <td><strong>${data.total_items_sold} од.</strong></td>
                            </tr>
                        </tbody>
                    </table>
                `;

                if (data.message) {
                    html += `<p style="color: var(--color-rust); text-align: center; margin-top: 15px;">${data.message}</p>`;
                }

                reportContent.innerHTML = html;
                previewContainer.style.display = 'block';
                previewContainer.scrollIntoView({ behavior: 'smooth' });
            })
            .catch(err => {
                errorText.textContent = err.message || 'Помилка при формуванні звіту';
                errorBox.style.display = 'flex';
            });
    });

    // Звіт 2
    document.getElementById('sales-report-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.target;
        const errorBox = document.getElementById('sales-error-message');
        const errorText = document.getElementById('sales-error-text');

        if (!validateForm(form, errorBox, errorText)) return;

        const idCashier = document.getElementById('report-cashier-id').value;
        const dateFromInput = document.getElementById('s-date-from');
        const dateToInput = document.getElementById('s-date-to');

        if (dateFromInput.value > dateToInput.value) {
            errorText.textContent = 'Початкова дата не може бути більшою за кінцеву!';
            errorBox.style.display = 'flex';
            dateFromInput.style.borderColor = 'var(--color-rust)';
            dateToInput.style.borderColor = 'var(--color-rust)';
            return;
        }

        let url = `${REPORT_SALES_URL}?start_date=${dateFromInput.value}&end_date=${dateToInput.value}`;
        if (idCashier) url += `&id_employee=${idCashier}`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.error) throw new Error(data.error);

                document.getElementById('print-report-title').textContent = "Звіт: Загальний виторг";
                updatePrintDate();

                let cashierText = 'Всі касири';
                if (idCashier) {
                    const selectEl = document.getElementById('report-cashier-id');
                    cashierText = selectEl.options[selectEl.selectedIndex].text;
                }

                let html = `
                    <h3 class="no-print">Попередній перегляд: Загальний виторг</h3>
                    <p><strong>Період:</strong> з ${dateFromInput.value} по ${dateToInput.value}</p>
                    <p><strong>Працівник:</strong> ${cashierText}</p>
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>Кількість створених чеків</th>
                                <th>Загальна сума продажів (з ПДВ)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${data.total_checks_printed} шт.</td>
                                <td><strong>${parseFloat(data.total_revenue).toFixed(2)} ₴</strong></td>
                            </tr>
                        </tbody>
                    </table>
                `;

                reportContent.innerHTML = html;
                previewContainer.style.display = 'block';
                previewContainer.scrollIntoView({ behavior: 'smooth' });
            })
            .catch(err => {
                errorText.textContent = err.message || 'Помилка при формуванні звіту';
                errorBox.style.display = 'flex';
            });
    });
});


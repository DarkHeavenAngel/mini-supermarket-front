document.addEventListener('DOMContentLoaded', () => {
    const userRole = localStorage.getItem('empl_role');

    if (userRole !== 'Менеджер') return;

    const EMPL_URL = 'http://127.0.0.1:8001/api/employees/';
    const PROD_URL = 'http://127.0.0.1:8001/api/products/';
    const REPORT_PROD_URL = 'http://127.0.0.1:8001/api/reports/product-sales/';
    const REPORT_SALES_URL = 'http://127.0.0.1:8001/api/reports/total-sales/';
    const REPORT_TEAM_URL = 'http://127.0.0.1:8001/api/reports/team/';

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

                if (data.sold_products && data.sold_products.length > 0) {
                    html += `
                        <h4 style="margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">
                            Деталізація проданих товарів:
                        </h4>
                        <table class="report-table" style="font-size: 14px;">
                            <thead>
                                <tr>
                                    <th>UPC</th>
                                    <th>Назва товару</th>
                                    <th style="text-align: center;">Продано одиниць</th>
                                    <th style="text-align: right;">Сума з продажу (₴)</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;

                    data.sold_products.forEach(item => {
                        html += `
                            <tr>
                                <td><strong>${item.upc}</strong></td>
                                <td>${item.product_name}</td>
                                <td style="text-align: center;">${item.total_quantity}</td>
                                <td style="text-align: right;">${parseFloat(item.total_product_revenue).toFixed(2)}</td>
                            </tr>
                        `;
                    });

                    html += `
                            </tbody>
                        </table>
                    `;
                } else if (data.total_checks_printed > 0) {
                     html += `<p style="margin-top: 20px; color: var(--text-muted);">Немає детальної інформації по товарах.</p>`;
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

    setupCustomSelect('report-author-id');

    const teamForm = document.getElementById('team-report-form');
    if (teamForm) {
        teamForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const errorBox = document.getElementById('team-error-message');
            const errorText = document.getElementById('team-error-text');

            errorBox.style.display = 'none';

            const author = document.getElementById('report-author-id').value;
            const selectWrapper = document.getElementById('report-author-id').parentNode;

            if (!author) {
                errorText.textContent = "Будь ласка, оберіть члена команди зі списку!";
                errorBox.style.display = 'flex';
                if (selectWrapper && selectWrapper.classList.contains('custom-select-wrapper')) {
                    selectWrapper.querySelector('.custom-select-trigger').style.borderColor = 'var(--color-rust)';
                }
                return;
            } else {
                if (selectWrapper && selectWrapper.classList.contains('custom-select-wrapper')) {
                    selectWrapper.querySelector('.custom-select-trigger').style.borderColor = 'var(--border-color, #d1d5db)';
                }
            }

            fetch(`${REPORT_TEAM_URL}?author=${author}`)
                .then(res => res.json())
                .then(data => {
                    if (data.error) throw new Error(data.error);

                    document.getElementById('print-report-title').textContent = `Індивідуальний звіт запитів: ${data.author}`;
                    updatePrintDate();

                    let html = `
                        <h3 class="no-print" style="margin-bottom: 20px;">Попередній перегляд: ${data.author}</h3>
                    `;

                    if (author === 'olha_mykhailyk') {

                        html += `
                            <h4 style="margin-bottom: 10px; border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">
                                1. Виручка та кількість проданих одиниць за категоріями
                            </h4>
                            <table class="report-table" style="margin-bottom: 40px;">
                                <thead>
                                    <tr>
                                        <th>Назва категорії</th>
                                        <th style="text-align: center;">Продано одиниць</th>
                                        <th style="text-align: right;">Загальна виручка (₴)</th>
                                    </tr>
                                </thead>
                                <tbody>
                        `;
                        if (data.category_sales_summary && data.category_sales_summary.length > 0) {
                            data.category_sales_summary.forEach(row => {
                                html += `
                                    <tr>
                                        <td>${row['Назва категорії']}</td>
                                        <td style="text-align: center;">${row['Продано одиниць']}</td>
                                        <td style="text-align: right;"><strong>${parseFloat(row['Загальна виручка']).toFixed(2)}</strong></td>
                                    </tr>
                                `;
                            });
                        } else {
                            html += `<tr><td colspan="3" style="text-align: center;">Даних немає</td></tr>`;
                        }
                        html += `</tbody></table>`;

                        html += `
                            <h4 style="margin-bottom: 10px; border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">
                                2. Чеки, які містять абсолютно всі акційні товари
                            </h4>
                            <table class="report-table">
                                <thead>
                                    <tr>
                                        <th>Номер чеку</th>
                                        <th>Дата чеку</th>
                                        <th>Прізвище касира</th>
                                        <th style="text-align: right;">Сума чеку (₴)</th>
                                    </tr>
                                </thead>
                                <tbody>
                        `;
                        if (data.checks_with_all_promo_items && data.checks_with_all_promo_items.length > 0) {
                            data.checks_with_all_promo_items.forEach(row => {
                                const dateObj = new Date(row['Дата чеку']);
                                const formattedDate = dateObj.toLocaleString('uk-UA');
                                html += `
                                    <tr>
                                        <td><strong>${row['Номер чеку']}</strong></td>
                                        <td>${formattedDate}</td>
                                        <td>${row['Прізвище касира']}</td>
                                        <td style="text-align: right;">${parseFloat(row['Сума чеку']).toFixed(2)}</td>
                                    </tr>
                                `;
                            });
                        } else {
                            html += `<tr><td colspan="4" style="text-align: center;">Чеки, що задовольняють умову, відсутні</td></tr>`;
                        }
                        html += `</tbody></table>`;
                    } else if (author === 'olha_marushchenko') {

                        html += `
                            <h4 style="margin-bottom: 10px; border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">
                                1. Кількість чеків, створених кожним касиром
                            </h4>
                            <table class="report-table" style="margin-bottom: 40px;">
                                <thead>
                                    <tr>
                                        <th>ID Касира</th>
                                        <th>Прізвище та Ім'я</th>
                                        <th>Телефон</th>
                                        <th style="text-align: center;">Кількість чеків</th>
                                    </tr>
                                </thead>
                                <tbody>
                        `;
                        if (data.cashier_check_counts && data.cashier_check_counts.length > 0) {
                            data.cashier_check_counts.forEach(row => {
                                html += `
                                    <tr>
                                        <td><strong>${row['id_employee']}</strong></td>
                                        <td>${row['empl_surname']} ${row['empl_name']}</td>
                                        <td>${row['phone_number']}</td>
                                        <td style="text-align: center;"><strong>${row['total_checks']}</strong></td>
                                    </tr>
                                `;
                            });
                        } else {
                            html += `<tr><td colspan="4" style="text-align: center;">Даних немає</td></tr>`;
                        }
                        html += `</tbody></table>`;

                        html += `
                            <h4 style="margin-bottom: 10px; border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">
                                2. Товари, які купували абсолютно всі клієнти з картками
                            </h4>
                            <table class="report-table">
                                <thead>
                                    <tr>
                                        <th>Назва товару</th>
                                        <th>Характеристики</th>
                                        <th style="text-align: right;">Ціна (₴)</th>
                                    </tr>
                                </thead>
                                <tbody>
                        `;
                        if (data.products_bought_by_all_card_holders && data.products_bought_by_all_card_holders.length > 0) {
                            data.products_bought_by_all_card_holders.forEach(row => {
                                html += `
                                    <tr>
                                        <td><strong>${row['product_name']}</strong></td>
                                        <td>${row['characteristics']}</td>
                                        <td style="text-align: right;">${parseFloat(row['selling_price']).toFixed(2)}</td>
                                    </tr>
                                `;
                            });
                        } else {
                            html += `<tr><td colspan="3" style="text-align: center;">Товари, що задовольняють умову, відсутні</td></tr>`;
                        }
                        html += `</tbody></table>`;
                    }

                    reportContent.innerHTML = html;

                    previewContainer.style.display = 'block';
                    previewContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                })
                .catch(err => {
                    errorText.textContent = err.message || 'Помилка при формуванні звіту команди';
                    errorBox.style.display = 'flex';
                });
        });
    }
});


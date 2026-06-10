document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://127.0.0.1:8001/api/store_products';
    const PROD_URL = 'http://127.0.0.1:8001/api/products';

    const userRole = localStorage.getItem('empl_role');
    let currentStoreProducts = [];
    let currentBaseProducts = [];
    let editingUPC = null;
    let productToDelete = null;

    const modal = document.getElementById('store-product-modal');
    const form = document.getElementById('store-product-form');
    const tableBody = document.getElementById('store-products-table-body');
    const searchInput = document.getElementById('search-input');
    const sortFilter = document.getElementById('sort-filter');

    const promoSelect = document.getElementById('promotional_product');
    const priceInput = document.getElementById('selling_price');
    const upcPromGroup = document.getElementById('upc-prom-group');
    const upcPromSelect = document.getElementById('upc_prom');

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
        if (btnAdd) btnAdd.remove();
        const thAction = document.querySelector('th.manager-only');
        if (thAction) thAction.remove();
    }

    const toggleModal = () => {
        modal.classList.toggle('hidden');
        errorBox.style.display = 'none';
        form.querySelectorAll('[required]').forEach(el => el.style.borderColor = 'var(--border-color)');
    };

    document.getElementById('btn-close-modal').addEventListener('click', toggleModal);
    document.getElementById('btn-cancel').addEventListener('click', toggleModal);

    // Автопідстановка
    function autoFillUpcProm() {
        const isPromo = promoSelect.value === 'true';
        const selectedProductId = document.getElementById('id_product').value;

        if (isPromo && selectedProductId) {
            const baseProduct = currentStoreProducts.find(sp => sp.id_product == selectedProductId && sp.promotional_product === false);

            const promoWrapper = upcPromSelect.parentNode;
            const isCustomSelect = promoWrapper && promoWrapper.classList.contains('custom-select-wrapper');

            if (baseProduct) {
                upcPromSelect.value = baseProduct.upc;
                if (isCustomSelect) {
                    promoWrapper.querySelector('span').textContent = `${baseProduct.upc} - ${baseProduct.product_name}`;
                }
                errorBox.style.display = 'none';


                if (!editingUPC) {
                    document.getElementById('products_number').value = baseProduct.products_number;
                }
            } else {
                upcPromSelect.value = '';
                if (isCustomSelect) {
                    promoWrapper.querySelector('span').textContent = 'Оберіть оригінальний товар';
                }

                if (!editingUPC) {
                    errorText.textContent = "Увага: Для цього товару ще немає звичайної партії на складі. Акція неможлива.";
                    errorBox.style.display = 'flex';
                }
            }
        }
    }

    promoSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        errorBox.style.display = 'none';

        if (val === 'true') {
            upcPromGroup.style.display = 'block';
            upcPromSelect.setAttribute('required', 'required');
            priceInput.disabled = true;
            priceInput.value = '';
            priceInput.placeholder = 'Автоматично (-20%)';
            priceInput.removeAttribute('required');
            autoFillUpcProm();
        } else if (val === 'false') {
            upcPromGroup.style.display = 'none';
            upcPromSelect.removeAttribute('required');
            priceInput.disabled = false;
            priceInput.placeholder = '0.00';
            priceInput.setAttribute('required', 'required');
        } else {
            upcPromGroup.style.display = 'none';
            upcPromSelect.removeAttribute('required');
            priceInput.disabled = false;
            priceInput.placeholder = '0.00';
        }
    });

    document.getElementById('id_product').addEventListener('change', autoFillUpcProm);

    async function loadBaseProducts() {
        try {
            const res = await fetch(PROD_URL);
            currentBaseProducts = await res.json();
            const idProductSelect = document.getElementById('id_product');

            currentBaseProducts.forEach(p => {
                idProductSelect.insertAdjacentHTML('beforeend', `<option value="${p.id_product}">${p.id_product} - ${p.product_name}</option>`);
            });
            setupCustomSelect('sort-filter');
            setupCustomSelect('id_product');
            setupCustomSelect('promotional_product');
        } catch (error) {
            console.error('Помилка завантаження довідника товарів', error);
        }
    }

    function loadStoreProducts() {
        const search = searchInput.value.trim();
        const sort = sortFilter.value;

        fetch(`${API_URL}/?search=${search}&sort=${sort}`)
            .then(res => res.json())
            .then(data => {
                currentStoreProducts = data;
                tableBody.innerHTML = '';

                upcPromSelect.innerHTML = '<option value="" disabled selected>Оберіть оригінальний товар</option>';
                data.filter(sp => !sp.promotional_product).forEach(sp => {
                    upcPromSelect.insertAdjacentHTML('beforeend', `<option value="${sp.upc}">${sp.upc} - ${sp.product_name}</option>`);
                });
                const oldWrapper = upcPromSelect.parentNode;
                if (oldWrapper && oldWrapper.classList.contains('custom-select-wrapper')) {
                    oldWrapper.parentNode.insertBefore(upcPromSelect, oldWrapper);
                    oldWrapper.remove();
                }
                setupCustomSelect('upc_prom');

                if (data.length === 0) {
                    const colspan = userRole === 'Касир' ? 6 : 7;
                    tableBody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center;">Товарів не знайдено</td></tr>`;
                    return;
                }

                data.forEach(sp => {
                    const typeBadge = sp.promotional_product
                        ? '<span class="tbl-badge badge-manager" style="color:#d44000; border-color: rgba(212,64,0,0.3); background: rgba(212,64,0,0.1);">Акційний</span>'
                        : '<span class="tbl-badge badge-category">Звичайний</span>';

                    let actions = '';
                    if (userRole === 'Менеджер') {
                        actions = `
                            <td class="manager-only">
                                <button class="icon-btn edit" onclick="openEditModal('${sp.upc}')" title="Редагувати"><i class="fa-solid fa-pen"></i></button>
                                <button class="icon-btn delete" onclick="openDeleteModal('${sp.upc}')" title="Списати"><i class="fa-solid fa-trash"></i></button>
                            </td>
                        `;
                    }

                    tableBody.insertAdjacentHTML('beforeend', `
                        <tr>
                            <td><strong>${sp.upc}</strong></td>
                            <td>${sp.product_name}</td>
                            <td>${typeBadge}</td>
                            <td><strong>${parseFloat(sp.selling_price).toFixed(2)}</strong></td>
                            <td>${sp.products_number}</td>
                            <td><span style="color: var(--text-muted);">${sp.upc_prom || '-'}</span></td>
                            ${actions}
                        </tr>
                    `);
                });
            });
    }

    searchInput.addEventListener('input', loadStoreProducts);
    sortFilter.addEventListener('change', loadStoreProducts);

    // Додавання та редагування
    const btnOpenModal = document.getElementById('btn-open-modal');
    if (btnOpenModal) {
        btnOpenModal.addEventListener('click', () => {
            editingUPC = null;
            document.getElementById('modal-title').textContent = 'Додати партію товару';
            form.reset();

            const upcInput = document.getElementById('upc');
            upcInput.value = '';
            upcInput.placeholder = 'Згенерується автоматично';
            upcInput.disabled = true;

            document.getElementById('promotional_product').value = '';
            document.getElementById('id_product').value = '';
            document.getElementById('promotional_product').dispatchEvent(new Event('change'));
            document.querySelectorAll('.modal-form .custom-select-wrapper').forEach(wrapper => {
                const select = wrapper.querySelector('select');
                const triggerSpan = wrapper.querySelector('.custom-select-trigger span');
                if (select && triggerSpan) {
                    const selectedOption = select.options[select.selectedIndex];
                    triggerSpan.textContent = selectedOption ? selectedOption.text : 'Оберіть...';
                }
            });

            toggleModal();
        });
    }

    window.openEditModal = (upc) => {
        editingUPC = upc;
        const sp = currentStoreProducts.find(p => p.upc === upc);
        if (!sp) return;

        document.getElementById('modal-title').textContent = 'Редагувати товар';

        const upcInput = document.getElementById('upc');
        upcInput.value = sp.upc;
        upcInput.disabled = true;

        document.getElementById('upc').value = sp.upc;
        document.getElementById('upc').disabled = true;
        document.getElementById('id_product').value = sp.id_product;

        const idWrapper = document.getElementById('id_product').parentNode;
        if(idWrapper.querySelector('span')) idWrapper.querySelector('span').textContent = `${sp.id_product} - ${sp.product_name}`;

        const promoSelectEl = document.getElementById('promotional_product');
        promoSelectEl.value = sp.promotional_product ? 'true' : 'false';
        promoSelectEl.dispatchEvent(new Event('change'));

        const promoWrapper = promoSelectEl.parentNode;
        if(promoWrapper.querySelector('span')) promoWrapper.querySelector('span').textContent = sp.promotional_product ? 'Акційний товар' : 'Звичайний товар';

        document.getElementById('products_number').value = sp.products_number;

        if (sp.promotional_product) {
            document.getElementById('upc_prom').value = sp.upc_prom || '';
        } else {
            document.getElementById('selling_price').value = parseFloat(sp.selling_price).toFixed(2);
        }

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
            errorText.textContent = "Будь ласка, заповніть всі обов'язкові поля.";
            errorBox.style.display = 'flex';
            return;
        }

        const upcValue = document.getElementById('upc').value;
        const isPromo = promoSelect.value === 'true';

        if (upcValue) {
            const upcInt = parseInt(upcValue);
            if (!isNaN(upcInt)) {
                const isEven = upcInt % 2 === 0;
                if (isPromo && !isEven) {
                    errorText.textContent = "Увага: Акційний товар має мати ПАРНИЙ UPC.";
                    errorBox.style.display = 'flex';
                    return;
                }
                if (!isPromo && isEven) {
                    errorText.textContent = "Увага: Звичайний товар має мати НЕПАРНИЙ UPC.";
                    errorBox.style.display = 'flex';
                    return;
                }
            }
        }

        const productsNumber = parseInt(document.getElementById('products_number').value);
        if (isPromo) {
            const baseUpc = document.getElementById('upc_prom').value;
            const baseProduct = currentStoreProducts.find(p => p.upc === baseUpc);

            let maxAllowed = baseProduct ? baseProduct.products_number : 0;

            if (editingUPC) {
                const currentPromo = currentStoreProducts.find(p => p.upc === editingUPC);
                if (currentPromo) {
                    maxAllowed += currentPromo.products_number;
                }
            }

            if (baseProduct && productsNumber > maxAllowed) {
                errorText.textContent = `Увага: Кількість акційного товару (${productsNumber}) не може перевищувати загальний доступний залишок (${maxAllowed} од.).`;
                errorBox.style.display = 'flex';
                return;
            }
        }

        const payload = {
            id_product: document.getElementById('id_product').value,
            products_number: document.getElementById('products_number').value,
            promotional_product: isPromo,
            selling_price: isPromo ? 0 : document.getElementById('selling_price').value,
            upc_prom: isPromo ? document.getElementById('upc_prom').value : null
        };

        let method = 'POST';
        let url = `${API_URL}/`;

        if (editingUPC) {
            method = 'PUT';
            url = `${API_URL}/${editingUPC}/`;
        } else {
            payload.upc = document.getElementById('upc').value;
        }

        fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(async response => {
            if (response.ok || response.status === 201) {
                showGlobalAlert(editingUPC ? 'Оновлено!' : 'Товар додано на полиці!', 'success');
                toggleModal();
                loadStoreProducts();
            } else {
                const errData = await response.json();
                errorText.textContent = errData.error || errData.detail || 'Помилка збереження';
                errorBox.style.display = 'flex';
            }
        })
        .catch(error => {
            errorText.textContent = 'Сервер не відповідає.';
            errorBox.style.display = 'flex';
        });
    });

    // Видалення
    const deleteModal = document.getElementById('delete-modal');
    window.openDeleteModal = (upc) => {
        productToDelete = upc;
        const sp = currentStoreProducts.find(p => p.upc === upc);
        const name = sp ? sp.product_name : '';
        document.getElementById('delete-modal-text').innerHTML = `Ви дійсно хочете списати товар <strong>«${name}»</strong> (UPC: ${upc})?`;
        deleteModal.classList.remove('hidden');
    };

    document.getElementById('btn-cancel-delete').addEventListener('click', () => {
        deleteModal.classList.add('hidden');
        productToDelete = null;
    });

    document.getElementById('btn-confirm-delete').addEventListener('click', () => {
        if (!productToDelete) return;
        fetch(`${API_URL}/${productToDelete}/`, { method: 'DELETE' })
            .then(async response => {
                deleteModal.classList.add('hidden');
                if (response.ok || response.status === 204) {
                    showGlobalAlert('Списано!', 'success');
                    loadStoreProducts();
                } else {
                    const errData = await response.json();
                    showGlobalAlert(errData.detail || errData.error || 'Є в чеках', 'error');
                }
                productToDelete = null;
            });
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.add('hidden');

                if (overlay.id === 'delete-modal') {
                    productToDelete = null;
                } else {
                    if (errorBox) errorBox.style.display = 'none';
                    if (form) form.querySelectorAll('[required]').forEach(el => el.style.borderColor = 'var(--border-color)');
                }
            }
        });
    });

    loadBaseProducts().then(loadStoreProducts);
});


document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://127.0.0.1:8001/api/products';
    const CAT_URL = 'http://127.0.0.1:8001/api/categories';

    const userRole = localStorage.getItem('empl_role');
    let currentProducts = [];
    let currentCategories = [];
    let editingProductId = null;
    let productToDelete = null;

    const modal = document.getElementById('product-modal');
    const form = document.getElementById('product-form');
    const tableBody = document.getElementById('products-table-body');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const categorySelect = document.getElementById('category_number');

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

    function loadCategories() {
        fetch(CAT_URL)
            .then(res => res.json())
            .then(data => {
                currentCategories = data;
                data.forEach(cat => {
                    categoryFilter.insertAdjacentHTML('beforeend', `<option value="${cat.category_number}">${cat.category_name}</option>`);
                    categorySelect.insertAdjacentHTML('beforeend', `<option value="${cat.category_number}">${cat.category_name}</option>`);
                });
                setupCustomSelect('category-filter');
                setupCustomSelect('category_number');
            });
    }

    function loadProducts() {
        const search = searchInput.value.trim();
        const cat = categoryFilter.value;

        fetch(`${API_URL}/?search=${search}&category=${cat}`)
            .then(res => res.json())
            .then(data => {
                currentProducts = data;
                tableBody.innerHTML = '';

                if (data.length === 0) {
                    const colspan = userRole === 'Касир' ? 5 : 6;
                    tableBody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center;">Товарів не знайдено</td></tr>`;
                    return;
                }

                data.forEach(prod => {
                    let actions = '';
                    if (userRole === 'Менеджер') {
                        actions = `
                            <td class="manager-only">
                                <button class="icon-btn edit" onclick="openEditModal('${prod.id_product}')" title="Редагувати"><i class="fa-solid fa-pen"></i></button>
                                <button class="icon-btn delete" onclick="openDeleteModal('${prod.id_product}')" title="Видалити"><i class="fa-solid fa-trash"></i></button>
                            </td>
                        `;
                    }

                    tableBody.insertAdjacentHTML('beforeend', `
                        <tr>
                            <td><strong>${prod.id_product}</strong></td>
                            <td>${prod.product_name}</td>
                            <td><span class="role-badge role-manager" style="background: var(--color-muted-green);">${prod.category_name || '-'}</span></td>
                            <td>
                                <div class="address-wrapper" data-tooltip="${prod.characteristics}">
                                    <span class="address-text">${prod.characteristics}</span>
                                </div>
                            </td>
                            <td>${prod.manufacturer}</td>
                            ${actions}
                        </tr>
                    `);
                });
            })
            .catch(err => console.error("Помилка завантаження товарів:", err));
    }

    searchInput.addEventListener('input', loadProducts);
    categoryFilter.addEventListener('change', loadProducts);

    // Додавання та редагування
    const btnOpenModal = document.getElementById('btn-open-modal');
    if (btnOpenModal) {
        btnOpenModal.addEventListener('click', () => {
            editingProductId = null;
            document.getElementById('modal-title').textContent = 'Додати товар';
            form.reset();

            const catWrapper = document.getElementById('category_number').parentNode;
            if (catWrapper && catWrapper.classList.contains('custom-select-wrapper')) {
                catWrapper.querySelector('.custom-select-trigger span').textContent = 'Оберіть категорію';
                catWrapper.querySelectorAll('.custom-option').forEach(opt => opt.classList.remove('selected'));
            }

            const idInput = document.getElementById('id_product');
            let nextId = 1;
            if (currentProducts.length > 0) {
                const maxId = Math.max(...currentProducts.map(p => parseInt(p.id_product)));
                nextId = maxId + 1;
            }
            idInput.value = nextId;
            idInput.disabled = false;

            toggleModal();
        });
    }

    window.openEditModal = (id) => {
        editingProductId = parseInt(id);
        const prod = currentProducts.find(p => p.id_product === editingProductId);
        if (!prod) return;

        document.getElementById('modal-title').textContent = 'Редагувати товар';
        document.getElementById('id_product').value = prod.id_product;
        document.getElementById('id_product').disabled = true;
        document.getElementById('category_number').value = prod.category_number;

        const catWrapper = document.getElementById('category_number').parentNode;
        if (catWrapper && catWrapper.classList.contains('custom-select-wrapper')) {
            catWrapper.querySelector('.custom-select-trigger span').textContent = prod.category_name || 'Оберіть категорію';
            catWrapper.querySelectorAll('.custom-option').forEach(opt => {
                opt.classList.toggle('selected', opt.dataset.value == prod.category_number);
            });
        }

        document.getElementById('product_name').value = prod.product_name;
        document.getElementById('characteristics').value = prod.characteristics;
        document.getElementById('manufacturer').value = prod.manufacturer;

        toggleModal();
    };

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        errorBox.style.display = 'none';

        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
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

        const payload = {
            category_number: document.getElementById('category_number').value,
            product_name: document.getElementById('product_name').value,
            characteristics: document.getElementById('characteristics').value,
            manufacturer: document.getElementById('manufacturer').value
        };

        let method = 'POST';
        let url = `${API_URL}/`;

        if (editingProductId) {
            method = 'PUT';
            url = `${API_URL}/${editingProductId}/`;
        } else {
            payload.id_product = document.getElementById('id_product').value;
        }

        fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(async response => {
            if (response.ok || response.status === 201) {
                showGlobalAlert(editingProductId ? 'Товар оновлено!' : 'Товар успішно додано!', 'success');
                toggleModal();
                loadProducts();
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

    // Видалення
    const deleteModal = document.getElementById('delete-modal');

    window.openDeleteModal = (id) => {
        productToDelete = id;

        const prod = currentProducts.find(p => p.id_product == id);
        const productName = prod ? prod.product_name : '';

        document.getElementById('delete-modal-text').innerHTML = `Ви дійсно хочете видалити товар <strong>«${productName}»</strong> (ID: ${id})?`;
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
                    showGlobalAlert('Товар успішно видалено!', 'success');
                    loadProducts();
                } else {
                    const errData = await response.json();
                    showGlobalAlert(errData.detail || errData.error || 'Неможливо видалити (можливо є в чеках)', 'error');
                }
                productToDelete = null;
            })
            .catch(() => {
                deleteModal.classList.add('hidden');
                showGlobalAlert('Сталася помилка при видаленні', 'error');
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

    loadCategories();
    loadProducts();
});


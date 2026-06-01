document.addEventListener('DOMContentLoaded', () => {
    // Сайдбар
    const toggleBtn = document.getElementById('toggle-btn');
    const sidebar = document.getElementById('sidebar');

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    // Випадаюче підменю "Склад"
    const inventoryToggle = document.getElementById('inventory-toggle');
    const inventorySubmenu = document.getElementById('inventory-submenu');

    if (inventoryToggle && inventorySubmenu) {
        inventoryToggle.addEventListener('click', (e) => {
            e.preventDefault();

            if (sidebar.classList.contains('collapsed')) {
                sidebar.classList.remove('collapsed');
            }

            inventorySubmenu.classList.toggle('active');
            inventoryToggle.parentElement.classList.toggle('open');
        });
    }

    // Відображення поточної дати
    const dateDisplay = document.getElementById('current-date');
    if (dateDisplay) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const today = new Date();
        let dateString = today.toLocaleDateString('uk-UA', options);
        dateString = dateString.charAt(0).toUpperCase() + dateString.slice(1);
        dateDisplay.textContent = dateString;
    }

    const logoutBtn = document.getElementById('logout-btn');
    const welcomeHeader = document.getElementById('welcome-header');
    const token = localStorage.getItem('access_token');

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('empl_role');
        window.location.href = '/login/';
    };

    if (!token) {
        handleLogout();
        return;
    }

    fetch('http://127.0.0.1:8001/api/profile/', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Сесія застаріла або токен недійсний');
        }
        return response.json();
    })
    .then(data => {
        localStorage.setItem('empl_role', data.empl_role);
        document.documentElement.setAttribute('data-role', data.empl_role);

        // Привітання
        if (welcomeHeader) {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('login') === 'success') {
                welcomeHeader.style.display = 'block';
                welcomeHeader.textContent = `Вітаємо у системі, ${data.empl_name}!`;
                window.history.replaceState({}, document.title, window.location.pathname);
            } else {
                welcomeHeader.textContent = '';
                welcomeHeader.style.display = 'none';
            }
        }
    })
    .catch(error => {
        console.error('Помилка доступу до профілю:', error);
        handleLogout();
    });

    // Статистика
    fetch('http://127.0.0.1:8001/api/dashboard/stats/', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        const checksEl = document.getElementById('stat-checks');
        const promoEl = document.getElementById('stat-promo');
        const cardsEl = document.getElementById('stat-cards');

        if (checksEl) checksEl.textContent = data.checks_today;
        if (promoEl) promoEl.textContent = data.promo_items;
        if (cardsEl) cardsEl.textContent = data.total_cards;
    })
    .catch(error => console.error('Помилка завантаження статистики:', error));

    // Модальне вікно виходу
    const logoutModal = document.getElementById('logout-modal');
    const btnCancelLogout = document.getElementById('btn-cancel-logout');
    const btnConfirmLogout = document.getElementById('btn-confirm-logout');

    if (logoutBtn && logoutModal) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logoutModal.classList.remove('hidden');
        });
    }

    if (btnCancelLogout) {
        btnCancelLogout.addEventListener('click', () => {
            logoutModal.classList.add('hidden');
        });
    }

    if (btnConfirmLogout) {
        btnConfirmLogout.addEventListener('click', () => {
            handleLogout();
        });
    }

    if (logoutModal) {
        logoutModal.addEventListener('click', (e) => {
            if (e.target === logoutModal) {
                logoutModal.classList.add('hidden');
            }
        });
    }
});


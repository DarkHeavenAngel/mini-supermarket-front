document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('toggle-btn');
    const sidebar = document.getElementById('sidebar');

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    const dateDisplay = document.getElementById('current-date');
    if (dateDisplay) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const today = new Date();
        let dateString = today.toLocaleDateString('uk-UA', options);
        dateString = dateString.charAt(0).toUpperCase() + dateString.slice(1);
        dateDisplay.textContent = dateString;
    }

    const userNameDisplay = document.getElementById('user-name-display');
    const userRoleBadge = document.getElementById('user-role-badge');
    const logoutBtn = document.getElementById('logout-btn');
    const welcomeHeader = document.getElementById('welcome-header');

    const token = localStorage.getItem('access_token');

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
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
        if (userNameDisplay) userNameDisplay.textContent = `${data.empl_name} ${data.empl_surname}`;
        if (userRoleBadge) userRoleBadge.textContent = data.empl_role;
        if (welcomeHeader) {
            welcomeHeader.textContent = `Вітаємо у системі, ${data.empl_name}!`;
        }
    })
.catch(error => {
        console.error('Помилка доступу до профілю:', error);
        handleLogout();
    });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }
});


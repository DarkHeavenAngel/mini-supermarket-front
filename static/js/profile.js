document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');

    if (!token) return;

    fetch('http://127.0.0.1:8001/api/profile/', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Помилка завантаження даних профілю');
        return response.json();
    })
    .then(data => {
        // Формування ПІБ
        const patronymic = data.empl_patronymic ? data.empl_patronymic : '';
        const fullName = `${data.empl_surname} ${data.empl_name} ${patronymic}`.trim();

        // Підстановка у верхній банер
        document.getElementById('prof-name-large').textContent = fullName;

        // Створення бейджика ролі
        const roleBadgeContainer = document.getElementById('prof-role-badge');
        const roleBadge = document.createElement('span');
        roleBadge.className = 'user-role';
        roleBadge.style.backgroundColor = data.empl_role === 'Менеджер' ? 'var(--color-gold)' : 'var(--color-muted-green)';
        roleBadge.style.fontSize = '14px';
        roleBadge.style.padding = '5px 12px';
        roleBadge.textContent = data.empl_role;
        roleBadgeContainer.appendChild(roleBadge);

        document.getElementById('prof-id').textContent = data.id_employee;
        document.getElementById('prof-phone').textContent = data.phone_number;
        document.getElementById('prof-salary').textContent = `${parseFloat(data.salary).toFixed(2)} грн`;

        const zip = data.zip_code ? data.zip_code : '';
        document.getElementById('prof-address').textContent = `м. ${data.city}, вул. ${data.street}, ${zip}`;

        // Форматування дати
        const formatDate = (dateString) => {
            if (!dateString) return '-';
            const date = new Date(dateString);
            return date.toLocaleDateString('uk-UA');
        };

        document.getElementById('prof-start').textContent = formatDate(data.date_of_start);
        document.getElementById('prof-birth').textContent = formatDate(data.date_of_birth);
    })
    .catch(error => {
        console.error('Помилка при формуванні профілю:', error);
    });
});


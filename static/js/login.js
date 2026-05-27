document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const idEmployee = document.getElementById('id_employee').value;
    const password = document.getElementById('password').value;
    const errorBox = document.getElementById('error-message');

    errorBox.style.display = 'none';

    try {
        // Зверни увагу: запит йде до проєкту бекенду на порт 8000
        const response = await fetch('http://127.0.0.1:8001/api/token/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_employee: idEmployee, password: password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            window.location.href = '/'; // На головну сторінку фронтенду
        } else {
            errorBox.textContent = 'Невірний ID або пароль';
            errorBox.style.display = 'block';
        }
    } catch (err) {
        errorBox.textContent = 'Сервер бекенду не відповідає';
        errorBox.style.display = 'block';
    }
});
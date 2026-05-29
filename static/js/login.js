document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const idEmployee = document.getElementById('id_employee').value.trim();
            const password = document.getElementById('password').value.trim();
            const errorBox = document.getElementById('error-message');
            const errorText = document.getElementById('error-text');
            errorBox.style.display = 'none';

            if (!idEmployee || !password) {
                errorText.textContent = "Будь ласка, заповніть всі обов'язкові поля.";
                errorBox.style.display = 'flex';
                return;
            }

            try {
                const response = await fetch('http://127.0.0.1:8001/api/token/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id_employee: idEmployee,
                        password: password
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('access_token', data.access);
                    localStorage.setItem('refresh_token', data.refresh);
                    window.location.href = '/';
                } else {
                    errorText.textContent = data.detail || 'Невірний ID або пароль';
                    errorBox.style.display = 'flex';
                }
            } catch (err) {
                console.error("Fetch error:", err);
                errorText.textContent = 'Сервер бази даних (бекенд) не відповідає';
                errorBox.style.display = 'flex';
            }
        });
    }
});


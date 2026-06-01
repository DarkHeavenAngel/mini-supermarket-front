// Функція, щоб дані при оновлені нормально відмальовувались
(function() {
    const savedRole = localStorage.getItem('empl_role');
    if (savedRole) {
        document.documentElement.setAttribute('data-role', savedRole);
    }
})();


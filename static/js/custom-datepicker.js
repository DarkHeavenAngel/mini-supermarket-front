document.addEventListener('DOMContentLoaded', () => {
    const dateInputs = document.querySelectorAll('input[type="date"]');

    if (dateInputs.length > 0) {
        flatpickr(dateInputs, {
            locale: "uk",
            dateFormat: "Y-m-d",
            altInput: true,
            altFormat: "d.m.Y",
            allowInput: true,
        });
    }
});


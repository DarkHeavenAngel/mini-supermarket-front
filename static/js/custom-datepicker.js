document.addEventListener('DOMContentLoaded', () => {
    const dateInputs = document.querySelectorAll('input[type="date"]');

    if (dateInputs.length > 0) {
        flatpickr(dateInputs, {
            locale: "uk",
            dateFormat: "Y-m-d",
            altInput: true,
            altFormat: "d.m.Y",
            allowInput: true,
            monthSelectorType: "static",

            onReady: function(selectedDates, dateStr, instance) {
                const dropdown = document.createElement('div');
                dropdown.className = 'custom-month-dropdown hidden';

                const months = instance.l10n.months.longhand;
                months.forEach((monthName, index) => {
                    const monthBtn = document.createElement('div');
                    monthBtn.className = 'custom-month-btn';
                    monthBtn.textContent = monthName;

                    monthBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        instance.changeMonth(index, false);
                        dropdown.classList.add('hidden');
                    });

                    dropdown.appendChild(monthBtn);
                });

                instance.calendarContainer.appendChild(dropdown);

                instance.calendarContainer.addEventListener('click', (e) => {
                    const monthSpan = e.target.closest('.cur-month');

                    if (monthSpan) {
                        e.preventDefault();
                        e.stopPropagation();

                        document.querySelectorAll('.custom-month-dropdown').forEach(el => {
                            if (el !== dropdown) el.classList.add('hidden');
                        });

                        dropdown.classList.toggle('hidden');
                    }
                });
            }
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.flatpickr-calendar')) {
                document.querySelectorAll('.custom-month-dropdown').forEach(el => {
                    el.classList.add('hidden');
                });
            }
        });
    }
});


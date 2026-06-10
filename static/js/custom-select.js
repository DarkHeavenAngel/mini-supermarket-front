window.setupCustomSelect = function(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select-wrapper';
    select.parentNode.insertBefore(wrapper, select);
    wrapper.appendChild(select);

    const trigger = document.createElement('div');
    trigger.className = 'custom-select-trigger';
    const initialText = select.options[select.selectedIndex]?.text || 'Оберіть...';
    trigger.innerHTML = `<span>${initialText}</span><i class="fa-solid fa-chevron-down"></i>`;
    wrapper.appendChild(trigger);

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'custom-options';
    wrapper.appendChild(optionsContainer);

    Array.from(select.options).forEach(option => {
        const customOption = document.createElement('div');
        customOption.className = `custom-option ${option.selected ? 'selected' : ''}`;
        customOption.textContent = option.text;
        customOption.dataset.value = option.value;

        customOption.addEventListener('click', function() {
            select.value = this.dataset.value;
            trigger.querySelector('span').textContent = this.textContent;

            optionsContainer.querySelectorAll('.custom-option').forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');

            wrapper.classList.remove('open');
            select.dispatchEvent(new Event('change'));
        });

        optionsContainer.appendChild(customOption);
    });

    trigger.addEventListener('click', function(e) {
        e.stopPropagation();
        document.querySelectorAll('.custom-select-wrapper').forEach(w => {
            if (w !== wrapper) w.classList.remove('open');
        });
        wrapper.classList.toggle('open');
    });

    document.addEventListener('click', function() {
        wrapper.classList.remove('open');
    });
};


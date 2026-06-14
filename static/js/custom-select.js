window.setupCustomSelect = function(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    if (select.parentNode.classList.contains('custom-select-wrapper')) return;

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

    document.body.appendChild(optionsContainer);
    wrapper.optionsContainerRef = optionsContainer;

    const searchBox = document.createElement('div');
    searchBox.className = 'custom-select-search-box';
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Пошук...';
    searchInput.className = 'custom-select-search-input';
    searchBox.appendChild(searchInput);

    if (select.options.length > 5) {
        optionsContainer.appendChild(searchBox);
    }

    searchBox.addEventListener('click', function(e) {
        e.stopPropagation();
    });

    searchInput.addEventListener('input', function(e) {
        const filter = e.target.value.toLowerCase();
        const customOptions = optionsContainer.querySelectorAll('.custom-option');
        customOptions.forEach(opt => {
            const text = opt.textContent.toLowerCase();
            opt.style.display = text.includes(filter) ? 'block' : 'none';
        });
    });

    Array.from(select.options).forEach(option => {
        if (option.disabled && option.value === "") return;

        const customOption = document.createElement('div');
        customOption.className = `custom-option ${option.selected ? 'selected' : ''}`;
        customOption.textContent = option.text;
        customOption.dataset.value = option.value;

        customOption.addEventListener('click', function(e) {
            e.stopPropagation();
            select.value = this.dataset.value;
            trigger.querySelector('span').textContent = this.textContent;

            optionsContainer.querySelectorAll('.custom-option').forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');

            wrapper.classList.remove('open');
            optionsContainer.classList.remove('open');
            select.dispatchEvent(new Event('change'));
        });

        optionsContainer.appendChild(customOption);
    });

    const updatePosition = () => {
        if (wrapper.classList.contains('open')) {
            const rect = wrapper.getBoundingClientRect();
            optionsContainer.style.top = `${rect.bottom + window.scrollY + 4}px`;
            optionsContainer.style.left = `${rect.left + window.scrollX}px`;
            optionsContainer.style.width = `${rect.width}px`;
        }
    };

    trigger.addEventListener('click', function(e) {
        e.stopPropagation();

        const isOpen = wrapper.classList.contains('open');

        document.querySelectorAll('.custom-select-wrapper.open').forEach(w => {
            if (w !== wrapper) {
                w.classList.remove('open');
                w.optionsContainerRef.classList.remove('open');
            }
        });

        if (isOpen) {
            wrapper.classList.remove('open');
            optionsContainer.classList.remove('open');
        } else {
            wrapper.classList.add('open');
            optionsContainer.classList.add('open');
            updatePosition();

            const searchInput = optionsContainer.querySelector('.custom-select-search-input');
            if (searchInput) {
                searchInput.value = '';
                searchInput.dispatchEvent(new Event('input'));
                setTimeout(() => searchInput.focus(), 100);
            }
        }
    });

    document.addEventListener('click', function(e) {
        if (!wrapper.contains(e.target) && !optionsContainer.contains(e.target)) {
            wrapper.classList.remove('open');
            optionsContainer.classList.remove('open');
        }
    });

    document.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
};


const originalFetch = window.fetch;
window.fetch = async function() {
    let [resource, config] = arguments;

    config = config || {};
    config.headers = config.headers || {};

    const accessToken = localStorage.getItem('access_token');

    if (accessToken) {
        config.headers['Authorization'] = `Bearer ${accessToken}`;
    }

    if (!config.headers['Content-Type'] && !(config.body instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json';
    }

    return originalFetch(resource, config);
};


/**
 * Основная функция для совершения запросов по Yandex API.
 */
const createRequest = (options = {}) => {
    return new Promise((resolve, reject) => {
        // Проверка обязательных параметров
        if (!options.url) {
            const error = new Error('URL is required');
            if (options.callback) options.callback(error, null);
            reject(error);
            return;
        }

        const xhr = new XMLHttpRequest();

        // Формируем URL с query параметрами
        let url = options.url;
        if (options.params && Object.keys(options.params).length > 0) {
            const urlParams = new URLSearchParams();
            Object.keys(options.params).forEach(key => {
                if (options.params[key] !== undefined && options.params[key] !== null) {
                    urlParams.append(key, options.params[key]);
                }
            });
            url += '?' + urlParams.toString();
        }

        xhr.open(options.method || 'GET', url);

        // Устанавливаем заголовки
        if (options.headers) {
            Object.keys(options.headers).forEach(key => {
                xhr.setRequestHeader(key, options.headers[key]);
            });
        }

        // Для POST/PUT запросов устанавливаем Content-Type по умолчанию
        if ((options.method === 'POST' || options.method === 'PUT') && options.data) {
            if (!options.headers || !options.headers['Content-Type']) {
                xhr.setRequestHeader('Content-Type', 'application/json');
            }
        }

        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    let response = null;

                    // Обрабатываем пустой ответ или ответ с текстом
                    if (xhr.responseText) {
                        response = JSON.parse(xhr.responseText);
                    }

                    // Вызываем callback если он предоставлен
                    if (options.callback && typeof options.callback === 'function') {
                        options.callback(null, response);
                    }

                    resolve(response);
                } catch (error) {
                    const parseError = new Error(`Failed to parse response: ${error.message}`);

                    if (options.callback && typeof options.callback === 'function') {
                        options.callback(parseError, null);
                    }

                    reject(parseError);
                }
            } else {
                let errorMessage = `HTTP Error ${xhr.status}: ${xhr.statusText}`;
                let errorResponse = null;

                try {
                    if (xhr.responseText) {
                        errorResponse = JSON.parse(xhr.responseText);
                        if (errorResponse && errorResponse.error) {
                            errorMessage = errorResponse.error.error_msg || errorResponse.error.message || errorMessage;
                        }
                    }
                } catch (e) {
                    // Если не удалось распарсить ошибку, используем стандартное сообщение
                }

                const error = new Error(errorMessage);
                error.status = xhr.status;
                error.response = errorResponse;

                if (options.callback && typeof options.callback === 'function') {
                    options.callback(error, null);
                }

                reject(error);
            }
        };

        xhr.onerror = function() {
            const error = new Error('Network error occurred. Check CORS settings or network connection.');

            if (options.callback && typeof options.callback === 'function') {
                options.callback(error, null);
            }

            reject(error);
        };

        xhr.ontimeout = function() {
            const error = new Error('Request timeout');

            if (options.callback && typeof options.callback === 'function') {
                options.callback(error, null);
            }

            reject(error);
        };

        // Устанавливаем таймаут (по умолчанию 30 секунд)
        xhr.timeout = options.timeout || 30000;

        // Отправляем запрос
        try {
            if ((options.method === 'POST' || options.method === 'PUT') && options.data) {
                // Определяем тип тела запроса
                let body;
                if (options.headers && options.headers['Content-Type'] === 'application/json') {
                    body = JSON.stringify(options.data);
                } else if (options.headers && options.headers['Content-Type'] === 'application/x-www-form-urlencoded') {
                    body = new URLSearchParams(options.data).toString();
                } else {
                    body = options.data;
                }
                xhr.send(body);
            } else {
                xhr.send();
            }
        } catch (error) {
            if (options.callback && typeof options.callback === 'function') {
                options.callback(error, null);
            }
            reject(error);
        }
    });
};

// Вспомогательные функции для конкретных API

/**
 * Создает запрос для VK API
 */
createRequest.vk = (method, params = {}, callback) => {
    return createRequest({
        url: `https://api.vk.com/method/${method}`,
        method: 'GET',
        params: {
            ...params,
            v: '5.131'
        },
        callback
    });
};

/**
 * Создает запрос для Yandex Disk API
 */
createRequest.yandex = (endpoint, options = {}, callback) => {
    const token = localStorage.getItem('yandexToken');

    if (!token) {
        const error = new Error('Yandex token is not set');
        if (callback) callback(error, null);
        return Promise.reject(error);
    }

    return createRequest({
        url: `https://cloud-api.yandex.net/v1/disk${endpoint}`,
        method: options.method || 'GET',
        headers: {
            'Authorization': `OAuth ${token}`,
            ...options.headers
        },
        params: options.params,
        data: options.data,
        callback
    });
};

/**
 * Упрощенная версия для GET запросов
 */
createRequest.get = (url, params = {}, callback) => {
    return createRequest({
        url,
        method: 'GET',
        params,
        callback
    });
};

/**
 * Упрощенная версия для POST запросов
 */
createRequest.post = (url, data = {}, callback) => {
    return createRequest({
        url,
        method: 'POST',
        data,
        callback
    });
};

/**
 * Упрощенная версия для PUT запросов
 */
createRequest.put = (url, data = {}, callback) => {
    return createRequest({
        url,
        method: 'PUT',
        data,
        callback
    });
};

/**
 * Упрощенная версия для DELETE запросов
 */
createRequest.delete = (url, params = {}, callback) => {
    return createRequest({
        url,
        method: 'DELETE',
        params,
        callback
    });
};

export default createRequest;
/**
 * Основная функция для совершения запросов по Yandex API.
 */
const createRequest = (options = {}) => {
    return new Promise((resolve, reject) => {
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

        // Для POST/PUT запросов
        if ((options.method === 'POST' || options.method === 'PUT') && options.data) {
            if (!options.headers || !options.headers['Content-Type']) {
                xhr.setRequestHeader('Content-Type', 'application/json');
            }
        }

        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = xhr.responseText ? JSON.parse(xhr.responseText) : null;

                    // Поддержка callback для обратной совместимости
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
                    errorResponse = xhr.responseText ? JSON.parse(xhr.responseText) : null;
                    if (errorResponse && errorResponse.message) {
                        errorMessage = errorResponse.message;
                    }
                } catch (e) {
                    // Игнорируем ошибки парсинга
                }

                const error = new Error(errorMessage);
                error.response = errorResponse;
                error.status = xhr.status;

                if (options.callback && typeof options.callback === 'function') {
                    options.callback(error, null);
                }

                reject(error);
            }
        };

        xhr.onerror = function() {
            const error = new Error('Network error occurred');

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

        xhr.timeout = options.timeout || 30000;

        try {
            if ((options.method === 'POST' || options.method === 'PUT') && options.data) {
                const body = options.headers && options.headers['Content-Type'] === 'application/json'
                    ? JSON.stringify(options.data)
                    : options.data;
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
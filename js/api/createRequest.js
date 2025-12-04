/**
 * Основная функция для совершения запросов
 * Поддерживает как XMLHttpRequest, так и JSONP
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

        // Для VK API используем JSONP, для остальных - XMLHttpRequest
        if (options.useJsonp || options.url.includes('api.vk.com')) {
            createJsonpRequest(options, resolve, reject);
        } else {
            createXhrRequest(options, resolve, reject);
        }
    });
};

/**
 * Создает JSONP запрос (для VK API)
 */
function createJsonpRequest(options, resolve, reject) {
    // Создаем уникальное имя для callback функции
    const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());

    // Создаем script элемент
    const script = document.createElement('script');

    // Формируем URL с параметрами
    let url = options.url;
    if (options.params) {
        const urlParams = new URLSearchParams();
        Object.keys(options.params).forEach(key => {
            if (options.params[key] !== undefined && options.params[key] !== null) {
                urlParams.append(key, options.params[key]);
            }
        });
        url += (url.includes('?') ? '&' : '?') + urlParams.toString();
    }

    // Добавляем callback параметр
    url += (url.includes('?') ? '&' : '?') + `callback=${callbackName}`;

    // Устанавливаем атрибуты скрипта
    script.src = url;
    script.async = true;
    script.type = 'text/javascript';

    // Определяем глобальную callback функцию
    window[callbackName] = function(response) {
        // Очищаем
        delete window[callbackName];
        document.body.removeChild(script);

        // Вызываем callback если он предоставлен
        if (options.callback && typeof options.callback === 'function') {
            options.callback(null, response);
        }

        resolve(response);
    };

    // Обработка ошибок
    script.onerror = function() {
        delete window[callbackName];
        document.body.removeChild(script);

        const error = new Error('JSONP request failed');

        if (options.callback && typeof options.callback === 'function') {
            options.callback(error, null);
        }

        reject(error);
    };

    // Добавляем таймаут
    const timeout = options.timeout || 30000;
    setTimeout(() => {
        if (window[callbackName]) {
            delete window[callbackName];
            document.body.removeChild(script);

            const error = new Error('JSONP request timeout');

            if (options.callback && typeof options.callback === 'function') {
                options.callback(error, null);
            }

            reject(error);
        }
    }, timeout);

    // Добавляем скрипт на страницу
    document.body.appendChild(script);
}

/**
 * Создает XMLHttpRequest (для Яндекс API)
 */
function createXhrRequest(options, resolve, reject) {
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

    xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
            try {
                const response = xhr.responseText ? JSON.parse(xhr.responseText) : null;

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
            const error = new Error(`HTTP Error ${xhr.status}: ${xhr.statusText}`);

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
}

export default createRequest;
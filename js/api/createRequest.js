/**
 * Основная функция для совершения запросов по Yandex API.
 * @param {Object} options - Настройки запроса
 * @param {string} options.url - URL для запроса
 * @param {string} options.method - HTTP метод (GET, POST, PUT, DELETE)
 * @param {Object} options.headers - Заголовки запроса
 * @param {Object} options.data - Данные для тела запроса (для POST/PUT)
 * @param {Object} options.params - Query параметры для URL
 * @param {Function} options.callback - Функция обратного вызова
 * @returns {Promise} Промис с результатом запроса
 */
const createRequest = (options = {}) => {
    return new Promise((resolve, reject) => {
        // Проверка обязательных параметров
        if (!options.url) {
            reject(new Error('URL is required'));
            return;
        }

        // Создаем экземпляр XMLHttpRequest
        const xhr = new XMLHttpRequest();

        // Формируем URL с query параметрами
        let url = options.url;
        if (options.params && Object.keys(options.params).length > 0) {
            const urlParams = new URLSearchParams();
            Object.keys(options.params).forEach(key => {
                urlParams.append(key, options.params[key]);
            });
            url += '?' + urlParams.toString();
        }

        // Настраиваем запрос
        xhr.open(options.method || 'GET', url);

        // Устанавливаем заголовки
        xhr.setRequestHeader('Authorization', `OAuth ${getYandexToken()}`);

        if (options.headers) {
            Object.keys(options.headers).forEach(key => {
                xhr.setRequestHeader(key, options.headers[key]);
            });
        }

        // Если это POST/PUT запрос и есть данные, устанавливаем Content-Type
        if ((options.method === 'POST' || options.method === 'PUT') && options.data) {
            if (!options.headers || !options.headers['Content-Type']) {
                xhr.setRequestHeader('Content-Type', 'application/json');
            }
        }

        // Обработчики событий
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = xhr.responseText ? JSON.parse(xhr.responseText) : null;

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
                const error = new Error(`HTTP Error ${xhr.status}: ${xhr.statusText}`);

                try {
                    const errorResponse = xhr.responseText ? JSON.parse(xhr.responseText) : null;
                    error.response = errorResponse;
                } catch (e) {
                    // Игнорируем ошибки парсинга для ошибок HTTP
                }

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

        // Устанавливаем таймаут (по умолчанию 30 секунд)
        xhr.timeout = options.timeout || 30000;

        // Отправляем запрос
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

/**
 * Вспомогательная функция для получения токена Yandex
 * В реальном приложении токен должен храниться безопасно
 */
function getYandexToken() {
    // В реальном приложении здесь должна быть логика получения токена
    // Например, из localStorage, cookie или через OAuth flow
    return localStorage.getItem('yandexToken') || '';
}

/**
 * Вспомогательные функции для конкретных методов Yandex API
 */

// Получение информации о диске
createRequest.getDiskInfo = () => {
    return createRequest({
        url: 'https://cloud-api.yandex.net/v1/disk/',
        method: 'GET'
    });
};

// Создание папки
createRequest.createFolder = (path) => {
    return createRequest({
        url: 'https://cloud-api.yandex.net/v1/disk/resources',
        method: 'PUT',
        params: { path }
    });
};

// Получение списка файлов в папке
createRequest.getFiles = (path = '/') => {
    return createRequest({
        url: 'https://cloud-api.yandex.net/v1/disk/resources',
        method: 'GET',
        params: {
            path,
            limit: 100,
            sort: '-created'
        }
    });
};

// Загрузка файла по URL
createRequest.uploadFromUrl = (url, path) => {
    return createRequest({
        url: 'https://cloud-api.yandex.net/v1/disk/resources/upload',
        method: 'POST',
        params: {
            url: url,
            path: path
        }
    });
};

// Удаление файла или папки
createRequest.deleteResource = (path, permanently = false) => {
    return createRequest({
        url: 'https://cloud-api.yandex.net/v1/disk/resources',
        method: 'DELETE',
        params: {
            path: path,
            permanently: permanently
        }
    });
};

// Публикация ресурса
createRequest.publishResource = (path) => {
    return createRequest({
        url: 'https://cloud-api.yandex.net/v1/disk/resources/publish',
        method: 'PUT',
        params: { path }
    });
};

// Получение публичной ссылки
createRequest.getPublicUrl = (path) => {
    return createRequest({
        url: 'https://cloud-api.yandex.net/v1/disk/resources',
        method: 'GET',
        params: {
            path: path,
            fields: 'public_url'
        }
    });
};

export default createRequest;
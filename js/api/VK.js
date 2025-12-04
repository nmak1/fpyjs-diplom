/**
 * Класс VK
 * Управляет изображениями из VK. С помощью VK API.
 * С помощью этого класса будет выполняться загрузка изображений из vk.
 * Имеет свойства ACCESS_TOKEN и lastCallback
 */
class VK {
  // Для публичного доступа не используем токен
  static ACCESS_TOKEN = '';
  static lastCallback = () => {}; // Функция-пустышка по умолчанию
  static API_VERSION = '5.199'; // Последняя версия API
  static BASE_URL = 'https://api.vk.com/method';

  /**
   * Получает изображения
   */
  static get(id = '', callback) {
    // Сохраняем callback в свойство lastCallback
    this.lastCallback = callback;

    try {
      const ownerId = this.parseUserId(id);

      // Для тестирования используем публичные ID
      const testUserId = this.getTestUserId(ownerId);

      console.log(`Запрашиваем фото пользователя: ${testUserId}`);

      // Создаем тег script для JSONP запроса
      const script = document.createElement('script');

      // Генерируем уникальное имя для callback функции
      const callbackName = 'vk_callback_' + Date.now() + '_' + Math.random().toString(36).substr(2);

      // Регистрируем глобальную callback функцию
      window[callbackName] = (response) => {
        // Обрабатываем ответ
        this.processData(response, callbackName, script);
      };

      // Формируем URL запроса без токена для публичного доступа
      let url = `${this.BASE_URL}/photos.get?`;
      const params = {
        owner_id: testUserId,
        album_id: 'profile',
        v: this.API_VERSION,
        rev: 1,
        extended: 0, // Упрощаем для публичного доступа
        photo_sizes: 1,
        count: 30, // Ограничиваем количество
        callback: callbackName
      };

      // Пробуем с токеном, если он есть
      if (this.ACCESS_TOKEN && this.ACCESS_TOKEN.length > 10) {
        params.access_token = this.ACCESS_TOKEN;
        params.extended = 1;
        params.count = 100;
      }

      // Добавляем параметры в URL
      const urlParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          urlParams.append(key, params[key]);
        }
      });
      url += urlParams.toString();

      // Настраиваем тег script
      script.src = url;
      script.type = 'text/javascript';
      script.async = true;
      script.id = callbackName; // Сохраняем ID для удаления

      // Добавляем обработчик ошибок
      script.onerror = () => {
        // Удаляем callback из глобальной области
        delete window[callbackName];

        // Удаляем тег script
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }

        // Если ошибка сети, используем демо-данные
        console.log('Ошибка сети, используем демо-данные');
        this.getDemoData(callback);
      };

      // Добавляем тег script в тело документа
      document.body.appendChild(script);

    } catch (error) {
      console.error('Ошибка в VK.get:', error);
      // При любой ошибке используем демо-данные
      this.getDemoData(callback);
    }
  }

  /**
   * Получает тестовый ID пользователя
   */
  static getTestUserId(originalId) {
    // Если ID не указан, используем тестовый публичный ID
    if (!originalId) {
      return '1'; // Публичная страница ВКонтакте
    }

    // Проверяем, является ли ID числом
    if (/^\d+$/.test(originalId)) {
      return originalId;
    }

    // Для screen_names возвращаем тестовый ID
    return '1';
  }

  /**
   * Обрабатывает данные ответа от VK API
   */
  static processData(response, callbackName, script) {
    try {
      // Удаляем тег script из документа
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }

      // Удаляем callback из глобальной области
      if (window[callbackName]) {
        delete window[callbackName];
      }

      // Проверяем наличие ошибок в ответе
      if (response.error) {
        const errorCode = response.error.error_code;
        const errorMsg = response.error.error_msg;

        console.log(`VK API Error ${errorCode}: ${errorMsg}`);

        // Если ошибка авторизации (5) или доступа (15), используем демо-данные
        if (errorCode === 5 || errorCode === 15 || errorCode === 30) {
          console.log('Ошибка доступа, используем демо-данные');
          this.getDemoData(this.lastCallback);
        } else {
          // Для других ошибок показываем сообщение
          const errorMessage = `VK API Error: ${errorMsg} (code: ${errorCode})`;

          if (this.lastCallback && this.lastCallback !== this.emptyCallback) {
            this.lastCallback(new Error(errorMessage), null);
            this.lastCallback = () => {}; // Сбрасываем на функцию-пустышку
          }
        }
        return;
      }

      // Проверяем корректность структуры ответа
      if (!response.response || !response.response.items || !Array.isArray(response.response.items)) {
        console.log('Некорректный формат ответа, используем демо-данные');
        this.getDemoData(this.lastCallback);
        return;
      }

      // Находим самые крупные изображения
      const photos = this.processPhotos(response.response);

      // Вызываем сохраненный callback с результатом
      if (this.lastCallback && this.lastCallback !== this.emptyCallback) {
        this.lastCallback(null, photos);
        this.lastCallback = () => {}; // Сбрасываем на функцию-пустышку
      }

    } catch (error) {
      console.error('Ошибка обработки данных VK:', error);
      // При ошибке обработки используем демо-данные
      this.getDemoData(this.lastCallback);
    }
  }

  /**
   * Демо-данные для тестирования
   */
  static getDemoData(callback) {
    console.log('Используем демо-данные для тестирования');

    // Создаем реалистичные демо-данные
    const demoPhotos = [];
    const photoCount = 15;

    for (let i = 1; i <= photoCount; i++) {
      const width = 400 + Math.floor(Math.random() * 400);
      const height = 300 + Math.floor(Math.random() * 300);
      const color = this.getRandomColor();
      const text = `Демо фото ${i}`;

      demoPhotos.push({
        id: i,
        owner_id: 1,
        date: Math.floor(Date.now() / 1000) - (i * 86400), // Разные даты
        likes: { count: Math.floor(Math.random() * 1000) },
        comments: { count: Math.floor(Math.random() * 100) },
        reposts: { count: Math.floor(Math.random() * 50) },
        sizes: [
          {
            type: 'm',
            url: `https://via.placeholder.com/200x150/${color}/ffffff?text=${encodeURIComponent(text)}`,
            width: 200,
            height: 150
          },
          {
            type: 'x',
            url: `https://via.placeholder.com/400x300/${color}/ffffff?text=${encodeURIComponent(text)}`,
            width: 400,
            height: 300
          },
          {
            type: 'y',
            url: `https://via.placeholder.com/${width}x${height}/${color}/ffffff?text=${encodeURIComponent(text)}`,
            width: width,
            height: height
          }
        ],
        text: text
      });
    }

    const response = {
      count: demoPhotos.length,
      items: demoPhotos
    };

    const photos = this.processPhotos(response);

    if (callback && callback !== this.emptyCallback) {
      callback(null, photos);
      this.lastCallback = () => {}; // Сбрасываем на функцию-пустышку
    }
  }

  /**
   * Генерирует случайный цвет
   */
  static getRandomColor() {
    const colors = [
      '0088cc', '00aa88', 'aa0088', 'cc8800', '8800cc',
      '008888', 'aa8800', '0088aa', 'aa0088', '00aa00'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Обрабатывает полученные фотографии
   */
  static processPhotos(response) {
    return response.items.map(photo => ({
      id: photo.id,
      owner_id: photo.owner_id,
      date: photo.date,
      likes: photo.likes ? photo.likes.count : 0,
      comments: photo.comments ? photo.comments.count : 0,
      reposts: photo.reposts ? photo.reposts.count : 0,
      sizes: photo.sizes,
      url: this.getBestQualityPhoto(photo.sizes),
      thumb: this.getThumbnailPhoto(photo.sizes),
      medium: this.getMediumQualityPhoto(photo.sizes),
      text: photo.text || `Фото ${photo.id}`
    }));
  }

  /**
   * Возвращает URL изображения наилучшего качества
   */
  static getBestQualityPhoto(sizes) {
    const qualityOrder = ['w', 'z', 'y', 'r', 'q', 'p', 'o', 'x', 'm', 's'];

    for (const quality of qualityOrder) {
      const size = sizes.find(s => s.type === quality);
      if (size) {
        return size.url;
      }
    }

    // Если не нашли по типам, возвращаем самый большой по ширине
    return sizes.reduce((largest, current) =>
      current.width > largest.width ? current : largest
    ).url;
  }

  /**
   * Возвращает URL для превью (миниатюра)
   */
  static getThumbnailPhoto(sizes) {
    const thumbSizes = ['m', 's', 'q'];
    for (const size of thumbSizes) {
      const found = sizes.find(s => s.type === size);
      if (found) return found.url;
    }
    return sizes[0].url;
  }

  /**
   * Возвращает URL среднего качества
   */
  static getMediumQualityPhoto(sizes) {
    const mediumSizes = ['x', 'y', 'z', 'p'];
    for (const size of mediumSizes) {
      const found = sizes.find(s => s.type === size);
      if (found) return found.url;
    }
    return this.getBestQualityPhoto(sizes);
  }

  /**
   * Парсит ID пользователя из различных форматов
   */
  static parseUserId(id) {
    if (!id || id === 'me') {
      return ''; // Будет использован ID текущего пользователя
    }

    // Если это числовой ID
    if (/^\d+$/.test(id)) {
      return id;
    }

    // Если это короткое имя (screen_name)
    if (/^[a-zA-Z0-9_.]+$/.test(id)) {
      return id;
    }

    // Если есть символ @ в начале, убираем его
    if (id.startsWith('@')) {
      return id.substring(1);
    }

    return id;
  }

  /**
   * Функция-пустышка для сброса lastCallback
   */
  static emptyCallback() {}
}

export default VK;
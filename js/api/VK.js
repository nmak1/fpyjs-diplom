/**
 * Класс VK
 * Управляет изображениями из VK. С помощью VK API.
 * С помощью этого класса будет выполняться загрузка изображений из vk.
 * Имеет свойства ACCESS_TOKEN и lastCallback
 */
class VK {
  static ACCESS_TOKEN = '958eb5d439726565e9333aa30e50e0f937ee432e927f0dbd541c541887d919a7c56f95c04217915c32008';
  static lastCallback = () => {}; // Функция-пустышка по умолчанию
  static API_VERSION = '5.131';
  static BASE_URL = 'https://api.vk.com/method';

  /**
   * Получает изображения
   */
  static get(id = '', callback) {
    // Сохраняем callback в свойство lastCallback
    this.lastCallback = callback;

    try {
      const ownerId = this.parseUserId(id);

      if (!ownerId) {
        const error = new Error('User ID is required');
        if (callback) callback(error, null);
        return;
      }

      // Создаем тег script для JSONP запроса
      const script = document.createElement('script');

      // Генерируем уникальное имя для callback функции
      const callbackName = 'vk_callback_' + Date.now() + '_' + Math.random().toString(36).substr(2);

      // Регистрируем глобальную callback функцию
      window[callbackName] = (response) => {
        // Обрабатываем ответ
        this.processData(response, callbackName, script);
      };

      // Формируем URL запроса
      let url = `${this.BASE_URL}/photos.get?`;
      const params = {
        owner_id: ownerId,
        album_id: 'profile',
        access_token: this.ACCESS_TOKEN,
        v: this.API_VERSION,
        rev: 1,
        extended: 1,
        photo_sizes: 1,
        count: 100,
        callback: callbackName
      };

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

        // Вызываем callback с ошибкой
        const error = new Error('Ошибка загрузки данных из VK');
        if (this.lastCallback && this.lastCallback !== this.emptyCallback) {
          this.lastCallback(error, null);
          this.lastCallback = () => {}; // Сбрасываем на функцию-пустышку
        }
      };

      // Добавляем тег script в тело документа
      document.body.appendChild(script);

    } catch (error) {
      if (this.lastCallback && this.lastCallback !== this.emptyCallback) {
        this.lastCallback(error, null);
        this.lastCallback = () => {}; // Сбрасываем на функцию-пустышку
      }
    }
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
        const errorMessage = `VK API Error: ${response.error.error_msg} (code: ${response.error.error_code})`;
        alert(errorMessage);

        if (this.lastCallback && this.lastCallback !== this.emptyCallback) {
          this.lastCallback(new Error(errorMessage), null);
          this.lastCallback = () => {}; // Сбрасываем на функцию-пустышку
        }
        return;
      }

      // Проверяем корректность структуры ответа
      if (!response.response || !response.response.items || !Array.isArray(response.response.items)) {
        alert('Некорректный формат ответа от VK API');

        if (this.lastCallback && this.lastCallback !== this.emptyCallback) {
          this.lastCallback(new Error('Некорректный формат ответа'), null);
          this.lastCallback = () => {}; // Сбрасываем на функцию-пустышку
        }
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
      alert(`Ошибка обработки данных: ${error.message}`);

      if (this.lastCallback && this.lastCallback !== this.emptyCallback) {
        this.lastCallback(error, null);
        this.lastCallback = () => {}; // Сбрасываем на функцию-пустышку
      }
    }
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
      text: photo.text || ''
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

    throw new Error('Invalid user ID format');
  }

  /**
   * Функция-пустышка для сброса lastCallback
   */
  static emptyCallback() {}
}

export default VK;
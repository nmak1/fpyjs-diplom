/**
 * Класс VK
 * Управляет изображениями из VK. С помощью VK API.
 * С помощью этого класса будет выполняться загрузка изображений из vk.
 * Имеет свойства ACCESS_TOKEN и lastCallback
 */
class VK {
  static ACCESS_TOKEN = '958eb5d439726565e9333aa30e50e0f937ee432e927f0dbd541c541887d919a7c56f95c04217915c32008';
  static lastCallback;
  static API_VERSION = '5.131';
  static BASE_URL = 'https://api.vk.com/method';

  /**
   * Получает изображения из профиля пользователя VK
   * @param {string|number} id - ID пользователя или короткое имя
   * @param {Function} callback - Функция обратного вызова
   */
  static get(id = '', callback) {
    // Сохраняем callback для использования в JSONP
    this.lastCallback = callback;

    try {
      // Если ID не указан, получаем фото текущего пользователя
      const ownerId = this.parseUserId(id);

      // Создаем запрос к VK API
      this.makeRequest('photos.get', {
        owner_id: ownerId,
        album_id: 'profile',
        rev: 1,
        extended: 1,
        photo_sizes: 1,
        count: 1000
      }).then(data => {
        const photos = this.processPhotos(data.response);
        callback(null, photos);
      }).catch(error => {
        callback(error, null);
      });

    } catch (error) {
      callback(error, null);
    }
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
   * Выполняет запрос к VK API
   */
  static async makeRequest(method, params = {}) {
    const url = new URL(`${this.BASE_URL}/${method}`);

    // Добавляем обязательные параметры
    const allParams = {
      access_token: this.ACCESS_TOKEN,
      v: this.API_VERSION,
      ...params
    };

    // Добавляем параметры в URL
    Object.keys(allParams).forEach(key => {
      if (allParams[key] !== undefined && allParams[key] !== null) {
        url.searchParams.append(key, allParams[key]);
      }
    });

    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();

      // Проверяем наличие ошибки VK API
      if (data.error) {
        throw new Error(`VK API Error: ${data.error.error_msg} (code: ${data.error.error_code})`);
      }

      return data;

    } catch (error) {
      console.error('VK API request failed:', error);
      throw error;
    }
  }

  /**
   * Обрабатывает полученные фотографии
   */
  static processPhotos(response) {
    if (!response || !response.items || !Array.isArray(response.items)) {
      throw new Error('Invalid response format from VK API');
    }

    return response.items.map(photo => ({
      id: photo.id,
      owner_id: photo.owner_id,
      date: photo.date,
      likes: photo.likes ? photo.likes.count : 0,
      comments: photo.comments ? photo.comments.count : 0,
      reposts: photo.reposts ? photo.reposts.count : 0,
      sizes: photo.sizes,
      // Получаем URL изображения максимального качества
      url: this.getBestQualityPhoto(photo.sizes),
      // Дополнительные URL для разных размеров
      thumb: this.getThumbnailPhoto(photo.sizes),
      medium: this.getMediumQualityPhoto(photo.sizes),
      // Текст описания если есть
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
   * Получает информацию о пользователе
   */
  static async getUserInfo(userId) {
    try {
      const data = await this.makeRequest('users.get', {
        user_ids: userId,
        fields: 'photo_max,photo_max_orig,domain'
      });

      if (data.response && data.response.length > 0) {
        return data.response[0];
      }

      throw new Error('User not found');
    } catch (error) {
      console.error('Failed to get user info:', error);
      throw error;
    }
  }

  /**
   * Проверяет валидность токена
   */
  static async validateToken() {
    try {
      await this.makeRequest('users.get', {});
      return true;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }

  /**
   * Получает фотографии из определенного альбома
   */
  static getAlbumPhotos(userId, albumId = 'profile', callback) {
    this.lastCallback = callback;

    this.makeRequest('photos.get', {
      owner_id: this.parseUserId(userId),
      album_id: albumId,
      extended: 1,
      photo_sizes: 1,
      count: 1000
    }).then(data => {
      const photos = this.processPhotos(data.response);
      callback(null, photos);
    }).catch(error => {
      callback(error, null);
    });
  }

  /**
   * Ищет фотографии по тегу или описанию
   */
  static searchPhotos(userId, query, callback) {
    this.lastCallback = callback;

    // Сначала получаем все фото, затем фильтруем локально
    this.get(userId, (error, photos) => {
      if (error) {
        callback(error, null);
        return;
      }

      const filteredPhotos = photos.filter(photo =>
        photo.text && photo.text.toLowerCase().includes(query.toLowerCase())
      );

      callback(null, filteredPhotos);
    });
  }
}

export default VK;

  /**
   * Передаётся в запрос VK API для обработки ответа.
   * Является обработчиком ответа от сервера.
   */
  static processData(result){

  }
}

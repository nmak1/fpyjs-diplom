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
   * Получает изображения
   */
  static get(id = '', callback) {
    // Сохраняем callback для обратной совместимости
    this.lastCallback = callback;

    try {
      const ownerId = this.parseUserId(id);

      // Используем createRequest вместо fetch
      return createRequest({
        url: `${this.BASE_URL}/photos.get`,
        method: 'GET',
        params: {
          owner_id: ownerId,
          album_id: 'profile',
          access_token: this.ACCESS_TOKEN,
          v: this.API_VERSION,
          rev: 1,
          extended: 1,
          photo_sizes: 1,
          count: 1000
        },
        callback: callback ? (error, data) => {
          if (error) {
            callback(error, null);
            return;
          }

          // Обрабатываем ответ VK API
          if (data.error) {
            const vkError = new Error(`VK API Error: ${data.error.error_msg} (code: ${data.error.error_code})`);
            callback(vkError, null);
            return;
          }

          try {
            const photos = this.processPhotos(data.response);
            callback(null, photos);
          } catch (processError) {
            callback(processError, null);
          }
        } : undefined
      }).then(data => {
        // Promise-версия обработки
        if (data.error) {
          throw new Error(`VK API Error: ${data.error.error_msg} (code: ${data.error.error_code})`);
        }

        const photos = this.processPhotos(data.response);
        return photos;
      });

    } catch (error) {
      if (callback) {
        callback(error, null);
      }
      return Promise.reject(error);
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
  static getUserInfo(userId, callback) {
    return createRequest({
      url: `${this.BASE_URL}/users.get`,
      method: 'GET',
      params: {
        user_ids: this.parseUserId(userId),
        access_token: this.ACCESS_TOKEN,
        v: this.API_VERSION,
        fields: 'photo_max,photo_max_orig,domain,first_name,last_name'
      },
      callback: callback ? (error, data) => {
        if (error) {
          callback(error, null);
          return;
        }

        if (data.error) {
          callback(new Error(`VK API Error: ${data.error.error_msg}`), null);
          return;
        }

        if (data.response && data.response.length > 0) {
          callback(null, data.response[0]);
        } else {
          callback(new Error('User not found'), null);
        }
      } : undefined
    }).then(data => {
      if (data.error) {
        throw new Error(`VK API Error: ${data.error.error_msg}`);
      }

      if (data.response && data.response.length > 0) {
        return data.response[0];
      }

      throw new Error('User not found');
    });
  }

  /**
   * Получает фотографии из определенного альбома
   */
  static getAlbumPhotos(userId, albumId = 'profile', callback) {
    this.lastCallback = callback;

    return createRequest({
      url: `${this.BASE_URL}/photos.get`,
      method: 'GET',
      params: {
        owner_id: this.parseUserId(userId),
        album_id: albumId,
        access_token: this.ACCESS_TOKEN,
        v: this.API_VERSION,
        extended: 1,
        photo_sizes: 1,
        count: 1000
      },
      callback: callback ? (error, data) => {
        if (error) {
          callback(error, null);
          return;
        }

        if (data.error) {
          callback(new Error(`VK API Error: ${data.error.error_msg}`), null);
          return;
        }

        try {
          const photos = this.processPhotos(data.response);
          callback(null, photos);
        } catch (processError) {
          callback(processError, null);
        }
      } : undefined
    }).then(data => {
      if (data.error) {
        throw new Error(`VK API Error: ${data.error.error_msg}`);
      }

      return this.processPhotos(data.response);
    });
  }
}
/**
 * Класс Yandex
 * Используется для управления облаком.
 * Имеет свойство HOST
 */
class Yandex {
  static HOST = 'https://cloud-api.yandex.net/v1/disk';
  static token = null;

  /**
   * Метод формирования и сохранения токена для Yandex API
   */
  static getToken() {
    if (!this.token) {
      this.token = localStorage.getItem('yandexToken');
    }

    if (!this.token) {
      this.token = prompt('Пожалуйста, введите ваш OAuth-токен Яндекс.Диска:');
      if (this.token) {
        localStorage.setItem('yandexToken', this.token);
      }
    }

    return this.token;
  }

  /**
   * Метод установки токена
   */
  static setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('yandexToken', token);
    } else {
      localStorage.removeItem('yandexToken');
    }
  }

  /**
   * Метод загрузки файла в облако
   */
  static uploadFile(path, url, callback) {
    const token = this.getToken();

    if (!token) {
      const error = new Error('Yandex token is not set');
      if (callback) callback(error, null);
      return Promise.reject(error);
    }

    return createRequest({
      url: `${this.HOST}/resources/upload`,
      method: 'POST',
      headers: {
        'Authorization': `OAuth ${token}`
      },
      params: {
        path: path,
        url: url
      },
      callback: callback
    });
  }

  /**
   * Метод удаления файла из облака
   */
  static removeFile(path, callback) {
    const token = this.getToken();

    if (!token) {
      const error = new Error('Yandex token is not set');
      if (callback) callback(error, null);
      return Promise.reject(error);
    }

    return createRequest({
      url: `${this.HOST}/resources`,
      method: 'DELETE',
      headers: {
        'Authorization': `OAuth ${token}`
      },
      params: {
        path: path,
        permanently: true
      },
      callback: callback
    });
  }

  /**
   * Метод получения всех загруженных файлов в облаке
   */
  static getUploadedFiles(callback) {
    const token = this.getToken();

    if (!token) {
      const error = new Error('Yandex token is not set');
      if (callback) callback(error, null);
      return Promise.reject(error);
    }

    return createRequest({
      url: `${this.HOST}/resources/files`,
      method: 'GET',
      headers: {
        'Authorization': `OAuth ${token}`
      },
      params: {
        limit: 1000,
        media_type: 'image',
        fields: '_embedded.items.name,_embedded.items.path,_embedded.items.preview,_embedded.items.size,_embedded.items.created'
      },
      callback: callback
    });
  }

  /**
   * Метод скачивания файлов
   */
  static downloadFileByUrl(url) {
    // Этот метод работает на клиенте, не требует API запросов
    const link = document.createElement('a');
    link.href = url;
    link.download = '';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Дополнительные методы для совместимости
   */

  /**
   * Метод получения файлов из папки
   */
  static getFilesFromFolder(path = '/', callback) {
    const token = this.getToken();

    if (!token) {
      const error = new Error('Yandex token is not set');
      if (callback) callback(error, null);
      return Promise.reject(error);
    }

    return createRequest({
      url: `${this.HOST}/resources`,
      method: 'GET',
      headers: {
        'Authorization': `OAuth ${token}`
      },
      params: {
        path: path,
        limit: 1000,
        fields: '_embedded.items.name,_embedded.items.path,_embedded.items.type,_embedded.items.preview,_embedded.items.size,_embedded.items.created'
      },
      callback: callback
    });
  }

  /**
   * Метод создания папки
   */
  static createFolder(path, callback) {
    const token = this.getToken();

    if (!token) {
      const error = new Error('Yandex token is not set');
      if (callback) callback(error, null);
      return Promise.reject(error);
    }

    return createRequest({
      url: `${this.HOST}/resources`,
      method: 'PUT',
      headers: {
        'Authorization': `OAuth ${token}`
      },
      params: {
        path: path
      },
      callback: callback
    });
  }

  /**
   * Метод получения информации о диске
   */
  static getDiskInfo(callback) {
    const token = this.getToken();

    if (!token) {
      const error = new Error('Yandex token is not set');
      if (callback) callback(error, null);
      return Promise.reject(error);
    }

    return createRequest({
      url: `${this.HOST}/`,
      method: 'GET',
      headers: {
        'Authorization': `OAuth ${token}`
      },
      callback: callback
    });
  }
}

export default Yandex;
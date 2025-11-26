/**
 * Класс FileUploaderModal
 * Используется как всплывающее окно для загрузки изображений
 */
class FileUploaderModal {
  constructor(element) {
    if (!element) {
      throw new Error('Modal element is required');
    }

    this.element = element;
    this.images = [];
    this.uploadedCount = 0;
    this.totalCount = 0;

    // Инициализация Semantic UI modal
    this.modal = $(element).modal({
      closable: false,
      onHide: () => this.onClose(),
      onShow: () => this.onOpen()
    });

    this.registerEvents();
  }

  /**
   * Добавляет следующие обработчики событий:
   * 1. Клик по крестику на всплывающем окне, закрывает его
   * 2. Клик по кнопке "Закрыть" на всплывающем окне, закрывает его
   * 3. Клик по кнопке "Отправить все файлы" на всплывающем окне, вызывает метод sendAllImages
   * 4. Клик по кнопке загрузке по контроллерам изображения:
   * убирает ошибку, если клик был по полю вода
   * отправляет одно изображение, если клик был по кнопке отправки
   */
  registerEvents() {
    // Закрытие по крестику
    const closeIcon = this.element.querySelector('.close.icon');
    if (closeIcon) {
      closeIcon.addEventListener('click', () => this.close());
    }

    // Закрытие по кнопке "Закрыть"
    const closeButton = this.element.querySelector('.close-button, .deny-button, [data-close]');
    if (closeButton) {
      closeButton.addEventListener('click', () => this.close());
    }

    // Отправка всех файлов
    const sendAllButton = this.element.querySelector('.send-all-button, .approve-button, [data-send-all]');
    if (sendAllButton) {
      sendAllButton.addEventListener('click', () => this.sendAllImages());
    }

    // Делегирование событий для полей ввода и кнопок загрузки
    this.element.addEventListener('click', (event) => {
      const target = event.target;

      // Клик по полю ввода - убираем ошибку
      if (target.type === 'text' && target.classList.contains('file-name-input')) {
        this.clearInputError(target);
      }

      // Клик по кнопке отправки одного изображения
      if (target.classList.contains('upload-single-button') || target.closest('.upload-single-button')) {
        const button = target.classList.contains('upload-single-button') ? target : target.closest('.upload-single-button');
        const imageContainer = button.closest('.image-container');
        if (imageContainer) {
          this.sendImage(imageContainer);
        }
      }
    });

    // Обработка нажатия Enter в поле ввода
    this.element.addEventListener('keypress', (event) => {
      if (event.key === 'Enter' && event.target.type === 'text' && event.target.classList.contains('file-name-input')) {
        const imageContainer = event.target.closest('.image-container');
        if (imageContainer) {
          this.sendImage(imageContainer);
        }
      }
    });
  }

  /**
   * Открывает модальное окно
   */
  open(images = []) {
    this.images = images;
    this.uploadedCount = 0;
    this.totalCount = images.length;

    this.modal.modal('show');
    return this;
  }

  /**
   * Закрывает модальное окно
   */
  close() {
    this.modal.modal('hide');
    return this;
  }

  /**
   * Обработчик открытия модального окна
   */
  onOpen() {
    this.showImages(this.images);
    this.updateProgress();
  }

  /**
   * Обработчик закрытия модального окна
   */
  onClose() {
    this.clearImages();
  }

  /**
   * Отображает все полученные изображения в теле всплывающего окна
   */
  showImages(images) {
    const imagesContainer = this.element.querySelector('.images-container, .content, [data-images]');

    if (!imagesContainer) {
      console.error('Images container not found');
      return;
    }

    imagesContainer.innerHTML = '';

    if (!images || images.length === 0) {
      imagesContainer.innerHTML = `
        <div class="ui warning message">
          <div class="header">Нет изображений для загрузки</div>
          <p>Выберите изображения для загрузки на Яндекс.Диск</p>
        </div>
      `;
      return;
    }

    images.forEach((image, index) => {
      const imageHTML = this.getImageHTML(image, index);
      imagesContainer.appendChild(imageHTML);
    });

    this.updateSendAllButton();
  }

  /**
   * Формирует HTML разметку с изображением, полем ввода для имени файла и кнопкой загрузки
   */
  getImageHTML(item, index) {
    const div = document.createElement('div');
    div.className = 'image-container ui segment';
    div.dataset.imageId = item.id || index;
    div.dataset.imageUrl = item.url;

    const fileName = `photo_${item.id || Date.now() + index}.jpg`;

    div.innerHTML = `
      <div class="ui grid">
        <div class="four wide column">
          <img src="${item.thumb || item.url}" class="ui small image preview-image" alt="Preview">
        </div>
        <div class="eight wide column">
          <div class="ui form">
            <div class="field">
              <label>Имя файла:</label>
              <input type="text" class="file-name-input" value="${fileName}" placeholder="Введите имя файла">
              <div class="error-message" style="display: none; color: red; font-size: 12px; margin-top: 5px;"></div>
            </div>
          </div>
        </div>
        <div class="four wide column">
          <div class="ui vertical buttons">
            <button class="ui primary button upload-single-button">
              <i class="cloud upload icon"></i>
              Загрузить
            </button>
            <div class="upload-status" style="margin-top: 5px; font-size: 12px;"></div>
          </div>
        </div>
      </div>
    `;

    return div;
  }

  /**
   * Отправляет все изображения в облако
   */
  async sendAllImages() {
    const imageContainers = this.element.querySelectorAll('.image-container');
    this.uploadedCount = 0;
    this.totalCount = imageContainers.length;

    // Блокируем кнопку отправки всех файлов
    const sendAllButton = this.element.querySelector('.send-all-button, .approve-button, [data-send-all]');
    if (sendAllButton) {
      sendAllButton.classList.add('loading');
      sendAllButton.disabled = true;
    }

    // Показываем общий прогресс
    this.showOverallProgress();

    for (let i = 0; i < imageContainers.length; i++) {
      const container = imageContainers[i];

      try {
        await this.sendImage(container);
        this.uploadedCount++;
        this.updateProgress();
      } catch (error) {
        console.error(`Error uploading image ${i + 1}:`, error);
        this.showContainerError(container, `Ошибка загрузки: ${error.message}`);
      }
    }

    // Разблокируем кнопку
    if (sendAllButton) {
      sendAllButton.classList.remove('loading');
      sendAllButton.disabled = false;
    }

    // Показываем итоговый результат
    this.showUploadResult();
  }

  /**
   * Валидирует изображение и отправляет его на сервер
   */
  async sendImage(imageContainer) {
    // Получаем данные из контейнера
    const input = imageContainer.querySelector('.file-name-input');
    const uploadButton = imageContainer.querySelector('.upload-single-button');
    const statusElement = imageContainer.querySelector('.upload-status');
    const imageUrl = imageContainer.dataset.imageUrl;

    if (!input || !uploadButton) {
      throw new Error('Invalid image container structure');
    }

    const fileName = input.value.trim();

    // Валидация имени файла
    if (!fileName) {
      this.showInputError(input, 'Введите имя файла');
      throw new Error('File name is required');
    }

    if (!/^[a-zA-Z0-9_\-\.]+$/.test(fileName)) {
      this.showInputError(input, 'Имя файла содержит недопустимые символы');
      throw new Error('Invalid file name');
    }

    // Очищаем ошибки
    this.clearInputError(input);
    this.clearContainerError(imageContainer);

    // Блокируем элементы
    input.disabled = true;
    uploadButton.classList.add('loading');
    uploadButton.disabled = true;
    statusElement.textContent = 'Загрузка...';
    statusElement.style.color = 'blue';

    try {
      // Загружаем на Яндекс.Диск
      const path = `/VK_Backup/${fileName}`;
      await Yandex.uploadFile(path, imageUrl);

      // Успешная загрузка
      statusElement.textContent = '✓ Успешно загружено';
      statusElement.style.color = 'green';
      imageContainer.classList.add('success');

      // Обновляем счетчик загруженных
      this.uploadedCount++;
      this.updateProgress();

    } catch (error) {
      // Ошибка загрузки
      statusElement.textContent = '✗ Ошибка загрузки';
      statusElement.style.color = 'red';
      this.showContainerError(imageContainer, error.message);
      throw error;
    } finally {
      // Разблокируем элементы
      input.disabled = false;
      uploadButton.classList.remove('loading');
      uploadButton.disabled = false;
    }
  }

  /**
   * Показывает ошибку для поля ввода
   */
  showInputError(input, message) {
    const errorElement = input.parentNode.querySelector('.error-message');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
    input.classList.add('error');
  }

  /**
   * Убирает ошибку с поля ввода
   */
  clearInputError(input) {
    const errorElement = input.parentNode.querySelector('.error-message');
    if (errorElement) {
      errorElement.style.display = 'none';
    }
    input.classList.remove('error');
  }

  /**
   * Показывает ошибку для контейнера изображения
   */
  showContainerError(container, message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'ui negative message';
    errorDiv.style.marginTop = '10px';
    errorDiv.innerHTML = `
      <div class="header">Ошибка загрузки</div>
      <p>${message}</p>
    `;
    container.appendChild(errorDiv);
  }

  /**
   * Убирает ошибку с контейнера изображения
   */
  clearContainerError(container) {
    const existingError = container.querySelector('.ui.negative.message');
    if (existingError) {
      existingError.remove();
    }
  }

  /**
   * Обновляет прогресс загрузки
   */
  updateProgress() {
    const progressElement = this.element.querySelector('.upload-progress, [data-progress]');
    if (progressElement) {
      const percentage = this.totalCount > 0 ? Math.round((this.uploadedCount / this.totalCount) * 100) : 0;
      progressElement.textContent = `Загружено: ${this.uploadedCount} из ${this.totalCount} (${percentage}%)`;
    }

    this.updateSendAllButton();
  }

  /**
   * Обновляет состояние кнопки "Отправить все файлы"
   */
  updateSendAllButton() {
    const sendAllButton = this.element.querySelector('.send-all-button, .approve-button, [data-send-all]');
    if (sendAllButton) {
      const hasImages = this.totalCount > 0;
      const allUploaded = this.uploadedCount === this.totalCount && this.totalCount > 0;

      if (allUploaded) {
        sendAllButton.textContent = 'Все файлы загружены';
        sendAllButton.classList.add('positive');
        sendAllButton.disabled = true;
      } else if (hasImages) {
        sendAllButton.textContent = `Отправить все файлы (${this.totalCount})`;
        sendAllButton.classList.remove('positive');
        sendAllButton.disabled = false;
      } else {
        sendAllButton.textContent = 'Отправить все файлы';
        sendAllButton.classList.remove('positive');
        sendAllButton.disabled = true;
      }
    }
  }

  /**
   * Показывает общий прогресс загрузки
   */
  showOverallProgress() {
    let progressContainer = this.element.querySelector('.overall-progress');

    if (!progressContainer) {
      progressContainer = document.createElement('div');
      progressContainer.className = 'overall-progress ui indicating progress';
      progressContainer.dataset.value = this.uploadedCount;
      progressContainer.dataset.total = this.totalCount;

      progressContainer.innerHTML = `
        <div class="bar">
          <div class="progress"></div>
        </div>
        <div class="label">Загрузка файлов</div>
      `;

      const content = this.element.querySelector('.content, [data-content]');
      if (content) {
        content.insertBefore(progressContainer, content.firstChild);
      }
    }

    // Инициализируем Semantic UI progress если доступен
    if (typeof $ !== 'undefined') {
      $(progressContainer).progress({
        percent: 0
      });
    }
  }

  /**
   * Показывает итоговый результат загрузки
   */
  showUploadResult() {
    const successCount = this.uploadedCount;
    const errorCount = this.totalCount - this.uploadedCount;

    let resultMessage = '';

    if (errorCount === 0) {
      resultMessage = `
        <div class="ui success message">
          <div class="header">Загрузка завершена!</div>
          <p>Все ${successCount} файлов успешно загружены на Яндекс.Диск.</p>
        </div>
      `;
    } else if (successCount === 0) {
      resultMessage = `
        <div class="ui error message">
          <div class="header">Загрузка не удалась</div>
          <p>Не удалось загрузить ни одного файла. Проверьте подключение и токен Яндекс.Диска.</p>
        </div>
      `;
    } else {
      resultMessage = `
        <div class="ui warning message">
          <div class="header">Загрузка завершена частично</div>
          <p>Успешно загружено: ${successCount} файлов<br>
          Не удалось загрузить: ${errorCount} файлов</p>
        </div>
      `;
    }

    // Добавляем сообщение в модальное окно
    const content = this.element.querySelector('.content, [data-content]');
    if (content) {
      const existingMessage = content.querySelector('.upload-result-message');
      if (existingMessage) {
        existingMessage.remove();
      }

      const messageDiv = document.createElement('div');
      messageDiv.className = 'upload-result-message';
      messageDiv.innerHTML = resultMessage;
      content.appendChild(messageDiv);
    }
  }

  /**
   * Очищает изображения из модального окна
   */
  clearImages() {
    const imagesContainer = this.element.querySelector('.images-container, .content, [data-images]');
    if (imagesContainer) {
      imagesContainer.innerHTML = '';
    }

    this.images = [];
    this.uploadedCount = 0;
    this.totalCount = 0;
  }

  /**
   * Устанавливает изображения для загрузки
   */
  setImages(images) {
    this.images = images;
    this.uploadedCount = 0;
    this.totalCount = images.length;
    this.showImages(images);
    return this;
  }
}

export default FileUploaderModal;
/**
 * Класс PreviewModal
 * Используется как обозреватель загруженный файлов в облако
 */
class PreviewModal {
  constructor(element) {
    if (!element) {
      throw new Error('Modal element is required');
    }

    this.element = element;
    this.files = [];

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
   * 2. Клик по контроллерам изображения:
   * Отправляет запрос на удаление изображения, если клик был на кнопке delete
   * Скачивает изображение, если клик был на кнопке download
   */
  registerEvents() {
    // Закрытие по крестику
    const closeIcon = this.element.querySelector('.close.icon');
    if (closeIcon) {
      closeIcon.addEventListener('click', () => this.close());
    }

    // Делегирование событий для кнопок управления изображениями
    this.element.addEventListener('click', (event) => {
      const target = event.target;

      // Клик по кнопке удаления
      if (target.classList.contains('delete-button') || target.closest('.delete-button')) {
        const button = target.classList.contains('delete-button') ? target : target.closest('.delete-button');
        const imageItem = button.closest('.image-item');
        if (imageItem) {
          this.deleteImage(imageItem);
        }
      }

      // Клик по кнопке скачивания
      if (target.classList.contains('download-button') || target.closest('.download-button')) {
        const button = target.classList.contains('download-button') ? target : target.closest('.download-button');
        const imageItem = button.closest('.image-item');
        if (imageItem) {
          this.downloadImage(imageItem);
        }
      }

      // Клик по изображению для просмотра
      if (target.classList.contains('preview-image') || target.closest('.preview-image')) {
        const img = target.classList.contains('preview-image') ? target : target.closest('.preview-image');
        this.showFullSizeImage(img.src, img.alt);
      }
    });

    // Закрытие полноразмерного просмотра
    this.element.addEventListener('click', (event) => {
      if (event.target.classList.contains('fullscreen-overlay')) {
        this.hideFullSizeImage();
      }
    });

    // Закрытие по Escape
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        const fullscreenOverlay = this.element.querySelector('.fullscreen-overlay');
        if (fullscreenOverlay && fullscreenOverlay.style.display === 'block') {
          this.hideFullSizeImage();
        } else {
          this.close();
        }
      }
    });
  }

  /**
   * Открывает модальное окно
   */
  open(files = []) {
    this.files = files;
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
    this.showImages(this.files);
  }

  /**
   * Обработчик закрытия модального окна
   */
  onClose() {
    this.clearImages();
    this.hideFullSizeImage();
  }

  /**
   * Отрисовывает изображения в блоке всплывающего окна
   */
  showImages(data) {
    const imagesContainer = this.element.querySelector('.images-container, .content, [data-images]');

    if (!imagesContainer) {
      console.error('Images container not found');
      return;
    }

    imagesContainer.innerHTML = '';

    if (!data || data.length === 0) {
      imagesContainer.innerHTML = `
        <div class="ui info message">
          <div class="header">Нет загруженных изображений</div>
          <p>Загрузите изображения из VK на Яндекс.Диск для просмотра</p>
        </div>
      `;
      return;
    }

    // Сортируем файлы по дате создания (новые сверху)
    const sortedFiles = data.sort((a, b) => {
      return new Date(b.created) - new Date(a.created);
    });

    sortedFiles.forEach((item, index) => {
      const imageHTML = this.getImageInfo(item, index);
      imagesContainer.appendChild(imageHTML);
    });

    this.updateFileCount();
  }

  /**
   * Форматирует дату в формате 2021-12-30T20:40:02+00:00(строка)
   * в формат «30 декабря 2021 г. в 23:40» (учитывая временной пояс)
   */
  formatDate(dateString) {
    if (!dateString) return 'Неизвестно';

    try {
      const date = new Date(dateString);

      // Проверяем валидность даты
      if (isNaN(date.getTime())) {
        return 'Неверная дата';
      }

      const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      const formattedDate = date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const formattedTime = date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      });

      return `${formattedDate} в ${formattedTime}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Ошибка формата даты';
    }
  }

  /**
   * Возвращает разметку из изображения, таблицы с описанием данных изображения и кнопок контроллеров (удаления и скачивания)
   */
  getImageInfo(item, index) {
    const div = document.createElement('div');
    div.className = 'image-item ui segment';
    div.dataset.filePath = item.path;
    div.dataset.fileName = item.name;
    div.dataset.fileSize = item.size;

    const previewUrl = item.preview || item.file || '';
    const fileSize = this.formatFileSize(item.size);
    const createdDate = this.formatDate(item.created);
    const modifiedDate = item.modified ? this.formatDate(item.modified) : 'Неизвестно';

    div.innerHTML = `
      <div class="ui grid">
        <div class="four wide column">
          <div class="image-preview-container">
            <img src="${previewUrl}"
                 class="ui medium image preview-image"
                 alt="${item.name}"
                 style="cursor: pointer; max-height: 150px; object-fit: cover;"
                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCA2MEgxMjBNNjAgODBIMTQwTTgwIDEwMEgxMjAiIHN0cm9rZT0iIzlBOUY5RiIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjUwIiByPSIxMCIgZmlsbD0iIzlBOUY5RiIvPgo8L3N2Zz4K'">
            <div class="ui dimmer">
              <div class="content">
                <div class="center">
                  <div class="ui inverted header">Нажмите для просмотра</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="eight wide column">
          <table class="ui very basic compact table file-info-table">
            <tbody>
              <tr>
                <td class="collapsing"><strong>Имя файла:</strong></td>
                <td>${item.name}</td>
              </tr>
              <tr>
                <td><strong>Размер:</strong></td>
                <td>${fileSize}</td>
              </tr>
              <tr>
                <td><strong>Загружено:</strong></td>
                <td>${createdDate}</td>
              </tr>
              <tr>
                <td><strong>Изменено:</strong></td>
                <td>${modifiedDate}</td>
              </tr>
              <tr>
                <td><strong>Путь:</strong></td>
                <td><code style="font-size: 12px;">${item.path}</code></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="four wide column">
          <div class="ui vertical buttons action-buttons">
            <button class="ui primary button download-button" title="Скачать файл">
              <i class="download icon"></i>
              Скачать
            </button>
            <button class="ui red button delete-button" title="Удалить файл">
              <i class="trash icon"></i>
              Удалить
            </button>
          </div>
          <div class="action-status" style="margin-top: 10px; font-size: 12px; min-height: 20px;"></div>
        </div>
      </div>
    `;

    // Инициализируем ховер эффект для изображения
    const imageContainer = div.querySelector('.image-preview-container');
    const image = div.querySelector('.preview-image');
    const dimmer = div.querySelector('.dimmer');

    if (imageContainer && dimmer) {
      imageContainer.addEventListener('mouseenter', () => {
        dimmer.classList.add('active');
      });

      imageContainer.addEventListener('mouseleave', () => {
        dimmer.classList.remove('active');
      });
    }

    return div;
  }

  /**
   * Форматирует размер файла в читаемый вид
   */
  formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 Б';

    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    if (i === 0) return `${bytes} ${sizes[i]}`;

    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }

  /**
   * Удаляет изображение из облака
   */
  async deleteImage(imageItem) {
    const filePath = imageItem.dataset.filePath;
    const fileName = imageItem.dataset.fileName;
    const deleteButton = imageItem.querySelector('.delete-button');
    const statusElement = imageItem.querySelector('.action-status');

    if (!filePath) {
      this.showStatus(statusElement, 'Ошибка: путь к файлу не найден', 'error');
      return;
    }

    // Подтверждение удаления
    const confirmed = confirm(`Вы уверены, что хотите удалить файл "${fileName}"?`);
    if (!confirmed) return;

    // Блокируем кнопки
    this.disableButtons(imageItem, true);
    statusElement.textContent = 'Удаление...';
    statusElement.style.color = 'blue';

    try {
      await Yandex.removeFile(filePath);

      // Успешное удаление
      statusElement.textContent = '✓ Файл удален';
      statusElement.style.color = 'green';

      // Плавно скрываем элемент
      setTimeout(() => {
        imageItem.style.opacity = '0';
        imageItem.style.transform = 'translateX(-100%)';
        setTimeout(() => {
          imageItem.remove();
          this.updateFileCount();
          this.checkEmptyState();
        }, 300);
      }, 1000);

    } catch (error) {
      console.error('Error deleting file:', error);
      this.showStatus(statusElement, `✗ Ошибка удаления: ${error.message}`, 'error');
      this.disableButtons(imageItem, false);
    }
  }

  /**
   * Скачивает изображение
   */
  async downloadImage(imageItem) {
    const filePath = imageItem.dataset.filePath;
    const fileName = imageItem.dataset.fileName;
    const downloadButton = imageItem.querySelector('.download-button');
    const statusElement = imageItem.querySelector('.action-status');

    if (!filePath) {
      this.showStatus(statusElement, 'Ошибка: путь к файлу не найден', 'error');
      return;
    }

    // Блокируем кнопки
    this.disableButtons(imageItem, true);
    statusElement.textContent = 'Подготовка скачивания...';
    statusElement.style.color = 'blue';

    try {
      // Получаем публичную ссылку для скачивания
      const fileInfo = await Yandex.publishFile(filePath);
      const downloadUrl = fileInfo.public_url || fileInfo.file;

      if (downloadUrl) {
        // Создаем временную ссылку для скачивания
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        statusElement.textContent = '✓ Скачивание начато';
        statusElement.style.color = 'green';
      } else {
        throw new Error('Не удалось получить ссылку для скачивания');
      }

    } catch (error) {
      console.error('Error downloading file:', error);
      this.showStatus(statusElement, `✗ Ошибка скачивания: ${error.message}`, 'error');
    } finally {
      setTimeout(() => {
        this.disableButtons(imageItem, false);
        statusElement.textContent = '';
      }, 2000);
    }
  }

  /**
   * Показывает полноразмерное изображение
   */
  showFullSizeImage(imageUrl, altText) {
    // Создаем оверлей для полноразмерного просмотра
    let overlay = this.element.querySelector('.fullscreen-overlay');

    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'fullscreen-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        cursor: zoom-out;
      `;

      overlay.innerHTML = `
        <div class="fullscreen-image-container" style="max-width: 90%; max-height: 90%;">
          <img src="${imageUrl}" alt="${altText}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
          <div class="ui top right attached label" style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white;">
            <i class="close icon" style="cursor: pointer;"></i>
          </div>
        </div>
      `;

      this.element.appendChild(overlay);

      // Обработчик закрытия по крестику
      overlay.querySelector('.close.icon').addEventListener('click', () => {
        this.hideFullSizeImage();
      });
    }

    overlay.style.display = 'flex';
  }

  /**
   * Скрывает полноразмерное изображение
   */
  hideFullSizeImage() {
    const overlay = this.element.querySelector('.fullscreen-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  }

  /**
   * Блокирует/разблокирует кнопки управления
   */
  disableButtons(imageItem, disabled) {
    const buttons = imageItem.querySelectorAll('.action-buttons .button');
    buttons.forEach(button => {
      button.disabled = disabled;
      if (disabled) {
        button.classList.add('loading');
      } else {
        button.classList.remove('loading');
      }
    });
  }

  /**
   * Показывает статус операции
   */
  showStatus(statusElement, message, type = 'info') {
    statusElement.textContent = message;
    switch (type) {
      case 'error':
        statusElement.style.color = 'red';
        break;
      case 'success':
        statusElement.style.color = 'green';
        break;
      default:
        statusElement.style.color = 'blue';
    }
  }

  /**
   * Обновляет счетчик файлов
   */
  updateFileCount() {
    const fileCount = this.element.querySelectorAll('.image-item').length;
    const countElement = this.element.querySelector('.file-count, [data-count]');
    const header = this.element.querySelector('.header');

    if (countElement) {
      countElement.textContent = `Файлов: ${fileCount}`;
    }

    if (header) {
      const baseTitle = header.textContent.replace(/\(\d+\)$/, '').trim();
      header.textContent = `${baseTitle} (${fileCount})`;
    }
  }

  /**
   * Проверяет пустое состояние и показывает сообщение
   */
  checkEmptyState() {
    const imagesContainer = this.element.querySelector('.images-container, .content, [data-images]');
    const imageItems = imagesContainer.querySelectorAll('.image-item');

    if (imageItems.length === 0) {
      imagesContainer.innerHTML = `
        <div class="ui info message">
          <div class="header">Нет загруженных изображений</div>
          <p>Все файлы были удалены. Загрузите новые изображения из VK.</p>
        </div>
      `;
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
    this.files = [];
  }

  /**
   * Обновляет данные в модальном окне
   */
  updateFiles(files) {
    this.files = files;
    this.showImages(files);
    return this;
  }
}

export default PreviewModal;
/**
 * Класс ImageViewer
 * Используется для взаимодействием блоком изображений
 */
class ImageViewer {
  constructor(element) {
    if (!element) {
      throw new Error('ImageViewer element is required');
    }

    this.element = element;
    this.images = [];
    this.selectedImages = new Set();
    this.isAllSelected = false;

    this.registerEvents();
  }

  /**
   * Добавляет следующие обработчики событий:
   * 1. Клик по изображению меняет класс активности у изображения
   * 2. Двойной клик по изображению отображает изображаения в блоке предпросмотра
   * 3. Клик по кнопке выделения всех изображений проверяет у всех ли изображений есть класс активности?
   * Добавляет или удаляет класс активности у всех изображений
   * 4. Клик по кнопке "Посмотреть загруженные файлы" открывает всплывающее окно просмотра загруженных файлов
   * 5. Клик по кнопке "Отправить на диск" открывает всплывающее окно для загрузки файлов
   */
  registerEvents() {
    // Делегирование событий для изображений
    this.element.addEventListener('click', (event) => {
      const target = event.target;

      // Клик по изображению
      if (target.classList.contains('image-item') || target.closest('.image-item')) {
        const imageItem = target.classList.contains('image-item') ? target : target.closest('.image-item');
        this.toggleImageSelection(imageItem);
      }

      // Клик по чекбоксу изображения
      if (target.type === 'checkbox' && target.classList.contains('image-checkbox')) {
        const imageItem = target.closest('.image-item');
        if (imageItem) {
          this.toggleImageSelection(imageItem, target.checked);
        }
      }
    });

    // Двойной клик по изображению
    this.element.addEventListener('dblclick', (event) => {
      const target = event.target;

      if (target.classList.contains('image-item') || target.closest('.image-item')) {
        const imageItem = target.classList.contains('image-item') ? target : target.closest('.image-item');
        this.previewImage(imageItem);
      }
    });

    // Кнопка выделения всех изображений
    const selectAllButton = document.querySelector('.select-all-button, [data-select-all]');
    if (selectAllButton) {
      selectAllButton.addEventListener('click', () => this.toggleSelectAll());
    }

    // Кнопка просмотра загруженных файлов
    const viewUploadedButton = document.querySelector('.view-uploaded-button, [data-view-uploaded]');
    if (viewUploadedButton) {
      viewUploadedButton.addEventListener('click', () => this.viewUploadedFiles());
    }

    // Кнопка отправки на диск
    const uploadButton = document.querySelector('.upload-button, [data-upload]');
    if (uploadButton) {
      uploadButton.addEventListener('click', () => this.uploadToDisk());
    }

    // Обработка клавиш
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.clearSelection();
      }

      // Ctrl+A для выделения всех
      if (event.ctrlKey && event.key === 'a') {
        event.preventDefault();
        this.selectAll();
      }
    });
  }

  /**
   * Переключает выделение изображения
   */
  toggleImageSelection(imageItem, forceState = null) {
    const imageId = imageItem.dataset.imageId;
    const checkbox = imageItem.querySelector('.image-checkbox');

    if (!imageId) {
      console.error('Image ID not found');
      return;
    }

    const isCurrentlySelected = this.selectedImages.has(imageId);
    const newState = forceState !== null ? forceState : !isCurrentlySelected;

    if (newState) {
      // Выделяем изображение
      imageItem.classList.add('active');
      this.selectedImages.add(imageId);
      if (checkbox) checkbox.checked = true;
    } else {
      // Снимаем выделение
      imageItem.classList.remove('active');
      this.selectedImages.delete(imageId);
      if (checkbox) checkbox.checked = false;
    }

    this.checkButtonText();
    this.updateSelectionCounter();
  }

  /**
   * Показывает изображение в превью
   */
  previewImage(imageItem) {
    const imageId = imageItem.dataset.imageId;
    const image = this.images.find(img => img.id == imageId);

    if (!image) {
      console.error('Image not found');
      return;
    }

    // Создаем модальное окно для превью
    this.showPreviewModal(image);
  }

  /**
   * Показывает модальное окно превью
   */
  showPreviewModal(image) {
    // Используем Semantic UI modal для превью
    const previewHTML = `
      <div class="ui modal image-preview-modal">
        <i class="close icon"></i>
        <div class="header">
          Просмотр изображения
        </div>
        <div class="image content" style="text-align: center; padding: 20px;">
          <img src="${image.url}"
               style="max-width: 100%; max-height: 70vh; object-fit: contain;"
               alt="Preview"
               onerror="this.style.display='none'; this.nextElementSibling.style.display='block'">
          <div class="ui warning message" style="display: none;">
            <div class="header">Не удалось загрузить изображение</div>
            <p>Ссылка на изображение недоступна</p>
          </div>
        </div>
        <div class="actions">
          <div class="ui button" data-close>Закрыть</div>
          <div class="ui primary button" data-download onclick="window.open('${image.url}', '_blank')">
            <i class="download icon"></i>
            Скачать
          </div>
        </div>
      </div>
    `;

    // Удаляем существующее модальное окно
    const existingModal = document.querySelector('.image-preview-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // Добавляем новое модальное окно
    document.body.insertAdjacentHTML('beforeend', previewHTML);

    // Инициализируем Semantic UI modal
    $('.image-preview-modal').modal({
      closable: true,
      onHide: () => {
        $('.image-preview-modal').remove();
      }
    }).modal('show');
  }

  /**
   * Переключает выделение всех изображений
   */
  toggleSelectAll() {
    const imageItems = this.element.querySelectorAll('.image-item');

    if (this.selectedImages.size === this.images.length && this.images.length > 0) {
      // Снимаем выделение со всех
      this.clearSelection();
    } else {
      // Выделяем все
      this.selectAll();
    }
  }

  /**
   * Выделяет все изображения
   */
  selectAll() {
    const imageItems = this.element.querySelectorAll('.image-item');

    imageItems.forEach(item => {
      this.toggleImageSelection(item, true);
    });

    this.isAllSelected = true;
    this.checkButtonText();
  }

  /**
   * Снимает выделение со всех изображений
   */
  clearSelection() {
    const imageItems = this.element.querySelectorAll('.image-item');

    imageItems.forEach(item => {
      this.toggleImageSelection(item, false);
    });

    this.isAllSelected = false;
    this.checkButtonText();
  }

  /**
   * Показывает загруженные файлы
   */
  async viewUploadedFiles() {
    try {
      // Показываем лоадер
      this.showLoader('Загрузка списка файлов...');

      // Получаем файлы с Яндекс.Диска
      const files = await Yandex.getUploadedFiles();

      // Скрываем лоадер
      this.hideLoader();

      // Открываем модальное окно просмотра
      const previewModal = App.getModal('filePreviewer');
      if (previewModal) {
        previewModal.open(files);
      } else {
        console.error('Preview modal not found');
      }
    } catch (error) {
      this.hideLoader();
      console.error('Error loading uploaded files:', error);
      this.showError('Не удалось загрузить список файлов: ' + error.message);
    }
  }

  /**
   * Открывает окно для загрузки файлов на диск
   */
  uploadToDisk() {
    if (this.selectedImages.size === 0) {
      this.showError('Выберите хотя бы одно изображение для загрузки');
      return;
    }

    // Получаем выбранные изображения
    const selectedImagesData = this.images.filter(image =>
      this.selectedImages.has(image.id.toString())
    );

    // Открываем модальное окно загрузки
    const uploadModal = App.getModal('fileUploader');
    if (uploadModal) {
      uploadModal.open(selectedImagesData);
    } else {
      console.error('Upload modal not found');
    }
  }

  /**
   * Очищает отрисованные изображения
   */
  clear() {
    this.element.innerHTML = '';
    this.images = [];
    this.selectedImages.clear();
    this.isAllSelected = false;
    this.checkButtonText();
    this.updateSelectionCounter();
  }

  /**
   * Отрисовывает изображения.
   */
  drawImages(images) {
    this.clear();
    this.images = images || [];

    if (!this.images || this.images.length === 0) {
      this.showEmptyState();
      return;
    }

    const imagesGrid = document.createElement('div');
    imagesGrid.className = 'ui stackable four cards images-grid';

    this.images.forEach((image, index) => {
      const imageCard = this.createImageCard(image, index);
      imagesGrid.appendChild(imageCard);
    });

    this.element.appendChild(imagesGrid);
    this.checkButtonText();
    this.updateSelectionCounter();
  }

  /**
   * Создает карточку изображения
   */
  createImageCard(image, index) {
    const card = document.createElement('div');
    card.className = 'card image-item';
    card.dataset.imageId = image.id;

    const isSelected = this.selectedImages.has(image.id.toString());
    if (isSelected) {
      card.classList.add('active');
    }

    card.innerHTML = `
      <div class="image">
        <img src="${image.thumb || image.url}"
             alt="VK Photo ${image.id}"
             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCA4MEgxMjBNODAgMTAwSDE0ME02MCAxMjBIMTQwIiBzdHJva2U9IiM5QTlGOUYiIHN0cm9rZS13aWR0aD0iMiIvPgo8Y2lyY2xlIGN4PSIxMDAiIGN5PSI2MCIgcj0iMTUiIGZpbGw9IiM5QTlGOUYiLz4KPC9zdmc+'">
        <div class="ui dimmer">
          <div class="content">
            <div class="center">
              <div class="ui inverted button">Просмотреть</div>
            </div>
          </div>
        </div>
      </div>
      <div class="content">
        <div class="header" style="font-size: 14px; margin-bottom: 8px;">
          <div class="ui checkbox image-checkbox" style="float: left; margin-right: 8px;">
            <input type="checkbox" ${isSelected ? 'checked' : ''}>
            <label></label>
          </div>
          Фото #${image.id}
        </div>
        <div class="meta">
          <span class="date" style="font-size: 12px; color: #666;">
            <i class="heart icon" style="color: #e03997;"></i> ${image.likes || 0}
            <i class="comment icon" style="margin-left: 8px;"></i> ${image.comments || 0}
          </span>
        </div>
      </div>
      <div class="extra content">
        <button class="ui basic primary button mini preview-button" style="width: 100%;">
          <i class="eye icon"></i>
          Просмотреть
        </button>
      </div>
    `;

    // Инициализируем чекбокс Semantic UI
    const checkbox = card.querySelector('.ui.checkbox');
    if (checkbox && typeof $ !== 'undefined') {
      $(checkbox).checkbox({
        onChecked: () => this.toggleImageSelection(card, true),
        onUnchecked: () => this.toggleImageSelection(card, false)
      });
    }

    // Обработчик для кнопки просмотра
    const previewButton = card.querySelector('.preview-button');
    if (previewButton) {
      previewButton.addEventListener('click', (event) => {
        event.stopPropagation();
        this.previewImage(card);
      });
    }

    // Инициализируем ховер эффект
    const imageElement = card.querySelector('.image');
    if (imageElement && typeof $ !== 'undefined') {
      $(imageElement).dimmer({
        on: 'hover'
      });
    }

    return card;
  }

  /**
   * Контроллирует кнопки выделения всех изображений и отправки изображений на диск
   */
  checkButtonText() {
    const selectAllButton = document.querySelector('.select-all-button, [data-select-all]');
    const uploadButton = document.querySelector('.upload-button, [data-upload]');

    if (selectAllButton) {
      if (this.selectedImages.size === this.images.length && this.images.length > 0) {
        selectAllButton.innerHTML = '<i class="minus icon"></i>Снять выделение';
        selectAllButton.classList.add('negative');
      } else {
        selectAllButton.innerHTML = '<i class="check square icon"></i>Выделить все';
        selectAllButton.classList.remove('negative');
      }

      // Блокируем кнопку если нет изображений
      selectAllButton.disabled = this.images.length === 0;
    }

    if (uploadButton) {
      const selectedCount = this.selectedImages.size;
      if (selectedCount > 0) {
        uploadButton.innerHTML = `<i class="cloud upload icon"></i>Отправить на диск (${selectedCount})`;
        uploadButton.disabled = false;
      } else {
        uploadButton.innerHTML = '<i class="cloud upload icon"></i>Отправить на диск';
        uploadButton.disabled = true;
      }
    }
  }

  /**
   * Обновляет счетчик выделенных элементов
   */
  updateSelectionCounter() {
    const counterElement = document.querySelector('.selection-counter, [data-selection-counter]');
    if (counterElement) {
      const total = this.images.length;
      const selected = this.selectedImages.size;

      if (total > 0) {
        counterElement.textContent = `Выбрано: ${selected} из ${total}`;
        counterElement.style.display = 'block';
      } else {
        counterElement.style.display = 'none';
      }
    }
  }

  /**
   * Показывает состояние когда нет изображений
   */
  showEmptyState() {
    this.element.innerHTML = `
      <div class="ui placeholder segment" style="text-align: center; padding: 40px;">
        <div class="ui icon header">
          <i class="image outline icon"></i>
          Нет изображений для отображения
        </div>
        <p>Введите ID пользователя VK чтобы загрузить фотографии</p>
      </div>
    `;
  }

  /**
   * Показывает лоадер
   */
  showLoader(message = 'Загрузка...') {
    let loader = this.element.querySelector('.ui.loader');

    if (!loader) {
      loader = document.createElement('div');
      loader.className = 'ui active inverted dimmer';
      loader.innerHTML = `
        <div class="ui large text loader">${message}</div>
      `;
      this.element.appendChild(loader);
    }

    loader.style.display = 'flex';
  }

  /**
   * Скрывает лоадер
   */
  hideLoader() {
    const loader = this.element.querySelector('.ui.dimmer');
    if (loader) {
      loader.style.display = 'none';
    }
  }

  /**
   * Показывает сообщение об ошибке
   */
  showError(message) {
    // Используем Semantic UI toast или создаем свое сообщение
    if (typeof $ !== 'undefined') {
      $('body').toast({
        class: 'error',
        message: message,
        showIcon: 'exclamation circle'
      });
    } else {
      alert(message);
    }
  }

  /**
   * Получает выбранные изображения
   */
  getSelectedImages() {
    return this.images.filter(image =>
      this.selectedImages.has(image.id.toString())
    );
  }

  /**
   * Устанавливает изображения
   */
  setImages(images) {
    this.drawImages(images);
    return this;
  }
}

export default ImageViewer;
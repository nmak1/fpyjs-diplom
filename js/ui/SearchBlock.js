/**
 * Класс SearchBlock
 * Используется для взаимодействием со строкой ввода и поиска изображений
 */
class SearchBlock {
  constructor(element) {
    if (!element) {
      throw new Error('SearchBlock element is required');
    }

    this.element = element;
    this.currentUserId = '';

    this.registerEvents();
  }

  /**
   * Выполняет подписку на кнопки "Заменить" и "Добавить"
   * Клик по кнопкам выполняет запрос на получение изображений и отрисовывает их,
   * только клик по кнопке "Заменить" перед отрисовкой очищает все отрисованные ранее изображения
   */
  registerEvents() {
    // Кнопка "Заменить"
    const replaceButton = this.element.querySelector('.replace-button, [data-replace]');
    if (replaceButton) {
      replaceButton.addEventListener('click', () => this.handleReplace());
    }

    // Кнопка "Добавить"
    const addButton = this.element.querySelector('.add-button, [data-add]');
    if (addButton) {
      addButton.addEventListener('click', () => this.handleAdd());
    }

    // Обработка нажатия Enter в поле ввода
    const input = this.element.querySelector('input[type="text"], .search-input, [data-input]');
    if (input) {
      input.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
          this.handleReplace();
        }
      });

      // Очистка ошибки при вводе
      input.addEventListener('input', () => {
        this.clearError();
      });
    }

    // Кнопка очистки
    const clearButton = this.element.querySelector('.clear-button, [data-clear]');
    if (clearButton) {
      clearButton.addEventListener('click', () => this.clearInput());
    }
  }

  /**
   * Обработчик кнопки "Заменить"
   */
  handleReplace() {
    const userId = this.getInputValue();

    if (!this.validateInput(userId)) {
      return;
    }

    this.currentUserId = userId;

    // Показываем лоадер
    this.showLoader('Загрузка изображений...');

    // Очищаем предыдущие изображения
    const imageViewer = App.getImageViewer();
    if (imageViewer) {
      imageViewer.clear();
    }

    // Получаем изображения из VK через callback
    VK.get(userId, (error, images) => {
      // Скрываем лоадер
      this.hideLoader();

      if (error) {
        console.error('Error loading images:', error);
        this.showError(`Ошибка загрузки: ${error.message}`);
        return;
      }

      // Отрисовываем изображения
      if (imageViewer && images) {
        imageViewer.drawImages(images);
      }

      // Показываем успешный результат
      this.showSuccess(`Загружено ${images ? images.length : 0} изображений из профиля VK`);
    });
  }

  /**
   * Обработчик кнопки "Добавить"
   */
  handleAdd() {
    const userId = this.getInputValue();

    if (!this.validateInput(userId)) {
      return;
    }

    // Показываем лоадер
    this.showLoader('Добавление изображений...');

    // Получаем изображения из VK через callback
    VK.get(userId, (error, newImages) => {
      // Скрываем лоадер
      this.hideLoader();

      if (error) {
        console.error('Error adding images:', error);
        this.showError(`Ошибка добавления: ${error.message}`);
        return;
      }

      // Добавляем к существующим изображениям
      const imageViewer = App.getImageViewer();
      if (imageViewer && newImages) {
        const currentImages = imageViewer.images || [];
        const allImages = [...currentImages, ...newImages];

        // Убираем дубликаты по ID
        const uniqueImages = this.removeDuplicates(allImages);
        imageViewer.drawImages(uniqueImages);
      }

      // Показываем успешный результат
      this.showSuccess(`Добавлено ${newImages ? newImages.length : 0} изображений из профиля VK`);
    });
  }

  /**
   * Получает значение из поля ввода
   */
  getInputValue() {
    const input = this.element.querySelector('input[type="text"], .search-input, [data-input]');
    return input ? input.value.trim() : '';
  }

  /**
   * Валидирует ввод пользователя
   */
  validateInput(userId) {
    if (!userId) {
      this.showError('Введите ID пользователя VK или screen_name');
      return false;
    }

    // Проверяем формат ID (число или screen_name)
    if (!/^[a-zA-Z0-9_.]+$/.test(userId)) {
      this.showError('Некорректный формат ID. Используйте цифры или латинские буквы');
      return false;
    }

    this.clearError();
    return true;
  }

  /**
   * Убирает дубликаты изображений по ID
   */
  removeDuplicates(images) {
    const seen = new Set();
    return images.filter(image => {
      if (seen.has(image.id)) {
        return false;
      }
      seen.add(image.id);
      return true;
    });
  }

  /**
   * Показывает сообщение об ошибке
   */
  showError(message) {
    this.clearError();

    const errorDiv = document.createElement('div');
    errorDiv.className = 'ui negative message error-message';
    errorDiv.style.marginTop = '10px';
    errorDiv.innerHTML = `
      <i class="close icon" onclick="this.parentElement.remove()"></i>
      <div class="header">Ошибка</div>
      <p>${message}</p>
    `;

    this.element.appendChild(errorDiv);

    // Автоматическое закрытие через 5 секунд
    setTimeout(() => {
      if (errorDiv.parentElement) {
        errorDiv.remove();
      }
    }, 5000);
  }

  /**
   * Показывает сообщение об успехе
   */
  showSuccess(message) {
    this.clearError();

    const successDiv = document.createElement('div');
    successDiv.className = 'ui success message success-message';
    successDiv.style.marginTop = '10px';
    successDiv.innerHTML = `
      <i class="close icon" onclick="this.parentElement.remove()"></i>
      <div class="header">Успешно</div>
      <p>${message}</p>
    `;

    this.element.appendChild(successDiv);

    // Автоматическое закрытие через 3 секунды
    setTimeout(() => {
      if (successDiv.parentElement) {
        successDiv.remove();
      }
    }, 3000);
  }

  /**
   * Очищает сообщения об ошибках
   */
  clearError() {
    const errorMessage = this.element.querySelector('.error-message');
    if (errorMessage) {
      errorMessage.remove();
    }

    const successMessage = this.element.querySelector('.success-message');
    if (successMessage) {
      successMessage.remove();
    }
  }

  /**
   * Очищает поле ввода
   */
  clearInput() {
    const input = this.element.querySelector('input[type="text"], .search-input, [data-input]');
    if (input) {
      input.value = '';
      input.focus();
    }
    this.clearError();
  }

  /**
   * Показывает лоадер
   */
  showLoader(message = 'Загрузка...') {
    this.clearError();

    // Блокируем кнопки
    this.setButtonsState(true);

    // Создаем лоадер если его нет
    let loader = this.element.querySelector('.search-loader');
    if (!loader) {
      loader = document.createElement('div');
      loader.className = 'search-loader ui active inverted dimmer';
      loader.innerHTML = `
        <div class="ui text loader">${message}</div>
      `;
      this.element.appendChild(loader);
    } else {
      loader.querySelector('.loader').textContent = message;
    }

    loader.style.display = 'flex';
  }

  /**
   * Скрывает лоадер
   */
  hideLoader() {
    const loader = this.element.querySelector('.search-loader');
    if (loader) {
      loader.style.display = 'none';
    }

    // Разблокируем кнопки
    this.setButtonsState(false);
  }

  /**
   * Блокирует/разблокирует кнопки
   */
  setButtonsState(disabled) {
    const buttons = this.element.querySelectorAll('button, .button');
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
   * Устанавливает значение в поле ввода
   */
  setInputValue(value) {
    const input = this.element.querySelector('input[type="text"], .search-input, [data-input]');
    if (input) {
      input.value = value;
    }
    return this;
  }

  /**
   * Устанавливает плейсхолдер
   */
  setPlaceholder(placeholder) {
    const input = this.element.querySelector('input[type="text"], .search-input, [data-input]');
    if (input) {
      input.placeholder = placeholder;
    }
    return this;
  }

  /**
   * Получает текущий ID пользователя
   */
  getCurrentUserId() {
    return this.currentUserId;
  }

  /**
   * Уничтожает SearchBlock и очищает ресурсы
   */
  destroy() {
    const buttons = this.element.querySelectorAll('button, .button');
    buttons.forEach(button => {
      button.replaceWith(button.cloneNode(true));
    });

    this.clearError();
    this.hideLoader();
  }
}

export default SearchBlock;
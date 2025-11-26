/**
 * Класс BaseModal
 * Используется как базовый класс всплывающего окна
 */
class BaseModal {
  constructor(element) {
    if (!element) {
      throw new Error('Modal element is required');
    }

    this.element = element;
    this.modalInstance = null;
    this.isOpen = false;

    this.init();
  }

  /**
   * Инициализация модального окна
   */
  init() {
    // Инициализируем Semantic UI modal, если элемент имеет соответствующий класс
    if (typeof $ !== 'undefined' && this.element.classList.contains('ui') && this.element.classList.contains('modal')) {
      this.modalInstance = $(this.element).modal({
        closable: true,
        onHide: () => this.onClose(),
        onShow: () => this.onOpen(),
        onApprove: () => this.onApprove(),
        onDeny: () => this.onDeny()
      });
    }

    // Настраиваем обработчики событий для кастомной реализации
    this.setupEventListeners();
  }

  /**
   * Настройка обработчиков событий
   */
  setupEventListeners() {
    // Закрытие по клику на фон (оверлей)
    this.element.addEventListener('click', (event) => {
      if (event.target === this.element) {
        this.close();
      }
    });

    // Закрытие по клавише Escape
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Обработчики для кнопок закрытия
    const closeButtons = this.element.querySelectorAll('[data-close], .close-button, .close-icon');
    closeButtons.forEach(button => {
      button.addEventListener('click', () => this.close());
    });

    // Обработчики для кнопок подтверждения
    const approveButtons = this.element.querySelectorAll('[data-approve], .approve-button, .positive-button');
    approveButtons.forEach(button => {
      button.addEventListener('click', () => this.onApprove());
    });

    // Обработчики для кнопок отмены
    const denyButtons = this.element.querySelectorAll('[data-deny], .deny-button, .negative-button');
    denyButtons.forEach(button => {
      button.addEventListener('click', () => this.onDeny());
    });
  }

  /**
   * Открывает всплывающее окно
   */
  open(data = null) {
    this.isOpen = true;

    // Обновляем данные если переданы
    if (data) {
      this.setData(data);
    }

    // Используем Semantic UI если доступен
    if (this.modalInstance) {
      this.modalInstance.modal('show');
    } else {
      // Кастомная реализация
      this.element.style.display = 'block';
      this.element.classList.add('active');
      document.body.classList.add('modal-open');

      // Вызываем обработчик открытия
      this.onOpen();
    }

    return this;
  }

  /**
   * Закрывает всплывающее окно
   */
  close() {
    this.isOpen = false;

    // Используем Semantic UI если доступен
    if (this.modalInstance) {
      this.modalInstance.modal('hide');
    } else {
      // Кастомная реализация
      this.element.style.display = 'none';
      this.element.classList.remove('active');
      document.body.classList.remove('modal-open');

      // Вызываем обработчик закрытия
      this.onClose();
    }

    return this;
  }

  /**
   * Обработчик открытия модального окна
   */
  onOpen() {
    // Можно переопределить в дочерних классах
    console.log('Modal opened');
  }

  /**
   * Обработчик закрытия модального окна
   */
  onClose() {
    // Можно переопределить в дочерних классах
    console.log('Modal closed');
  }

  /**
   * Обработчик подтверждения (для модальных окон с действиями)
   */
  onApprove() {
    // Можно переопределить в дочерних классах
    console.log('Modal approved');
    this.close();
    return true;
  }

  /**
   * Обработчик отмены (для модальных окон с действиями)
   */
  onDeny() {
    // Можно переопределить в дочерних классах
    console.log('Modal denied');
    this.close();
    return true;
  }

  /**
   * Устанавливает данные в модальное окно
   */
  setData(data) {
    // Должен быть переопределен в дочерних классах
    console.log('Setting modal data:', data);
  }

  /**
   * Очищает данные модального окна
   */
  clear() {
    // Должен быть переопределен в дочерних классах
    console.log('Clearing modal data');
  }

  /**
   * Показывает лоадер в модальном окне
   */
  showLoader() {
    const loader = this.element.querySelector('.loader, .loading, [data-loader]');
    if (loader) {
      loader.style.display = 'block';
      loader.classList.add('active');
    }

    // Блокируем кнопки действий
    const actionButtons = this.element.querySelectorAll('.button, [type="submit"], [data-action]');
    actionButtons.forEach(button => {
      button.disabled = true;
      button.classList.add('loading');
    });

    return this;
  }

  /**
   * Скрывает лоадер в модальном окне
   */
  hideLoader() {
    const loader = this.element.querySelector('.loader, .loading, [data-loader]');
    if (loader) {
      loader.style.display = 'none';
      loader.classList.remove('active');
    }

    // Разблокируем кнопки действий
    const actionButtons = this.element.querySelectorAll('.button, [type="submit"], [data-action]');
    actionButtons.forEach(button => {
      button.disabled = false;
      button.classList.remove('loading');
    });

    return this;
  }

  /**
   * Показывает сообщение об ошибке
   */
  showError(message) {
    this.hideLoader();

    // Ищем контейнер для ошибок
    let errorContainer = this.element.querySelector('.error-message, .error-container, [data-error]');

    if (!errorContainer) {
      // Создаем контейнер если не найден
      errorContainer = document.createElement('div');
      errorContainer.className = 'error-message ui negative message';
      errorContainer.style.marginTop = '10px';

      const content = this.element.querySelector('.content, .modal-content');
      if (content) {
        content.appendChild(errorContainer);
      } else {
        this.element.appendChild(errorContainer);
      }
    }

    errorContainer.innerHTML = `
      <div class="header">Ошибка</div>
      <p>${message}</p>
    `;
    errorContainer.style.display = 'block';

    // Автоматически скрываем ошибку через 5 секунд
    setTimeout(() => {
      this.hideError();
    }, 5000);

    return this;
  }

  /**
   * Скрывает сообщение об ошибке
   */
  hideError() {
    const errorContainer = this.element.querySelector('.error-message, .error-container, [data-error]');
    if (errorContainer) {
      errorContainer.style.display = 'none';
      errorContainer.innerHTML = '';
    }

    return this;
  }

  /**
   * Устанавливает заголовок модального окна
   */
  setTitle(title) {
    const titleElement = this.element.querySelector('.header, .modal-header, [data-title]');
    if (titleElement) {
      titleElement.textContent = title;
    }

    return this;
  }

  /**
   * Устанавливает содержимое модального окна
   */
  setContent(content) {
    const contentElement = this.element.querySelector('.content, .modal-content, [data-content]');
    if (contentElement) {
      if (typeof content === 'string') {
        contentElement.innerHTML = content;
      } else {
        contentElement.innerHTML = '';
        contentElement.appendChild(content);
      }
    }

    return this;
  }

  /**
   * Получает элемент модального окна
   */
  getElement() {
    return this.element;
  }

  /**
   * Получает экземпляр Semantic UI modal
   */
  getModalInstance() {
    return this.modalInstance;
  }

  /**
   * Проверяет, открыто ли модальное окно
   */
  isActive() {
    return this.isOpen;
  }

  /**
   * Уничтожает модальное окно и очищает ресурсы
   */
  destroy() {
    document.removeEventListener('keydown', this.handleKeydown);

    if (this.modalInstance) {
      this.modalInstance.modal('destroy');
    }

    this.element = null;
    this.modalInstance = null;
    this.isOpen = false;
  }
}

export default BaseModal;
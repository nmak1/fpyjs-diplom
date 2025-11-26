/**
 * Класс App управляет всем приложением
 */
class App {
  /**
   * С вызова этого метода начинается работа всего приложения
   */
  static init() {
    try {
      // Инициализация компонентов
      this.searchBlock = new SearchBlock(document.querySelector('.search-block'));
      this.imageViewer = new ImageViewer(document.querySelector('.images-wrapper'));

      // Инициализация модальных окон
      this.initModals();

      // Инициализация API клиентов
      this.initAPI();

      // Настройка глобальных обработчиков ошибок
      this.setupErrorHandling();

      console.log('App initialized successfully');
    } catch (error) {
      console.error('App initialization failed:', error);
    }
  }

  /**
   * Инициализирует API клиенты
   */
  static initAPI() {
    this.vkAPI = new VK();
    this.yandexAPI = new Yandex();
  }

  /**
   * Инициализирует всплывающие окна
   */
  static initModals() {
    this.modals = {
      fileUploader: new FileUploaderModal(
        $('.ui.modal.file-uploader-modal').modal({
          closable: false,
          onHide: () => this.onFileUploaderClose()
        })
      ),
      filePreviewer: new PreviewModal(
        $('.ui.modal.uploaded-previewer-modal').modal({
          closable: false,
          onApprove: () => this.onPreviewApprove(),
          onDeny: () => this.onPreviewDeny()
        })
      ),
    };
  }

  /**
   * Возвращает всплывающее окно по имени
   */
  static getModal(name) {
    if (!this.modals || !this.modals[name]) {
      console.warn(`Modal '${name}' not found`);
      return null;
    }
    return this.modals[name];
  }

  /**
   * Показывает модальное окно
   */
  static showModal(name, data = {}) {
    const modal = this.getModal(name);
    if (modal && modal.show) {
      modal.show(data);
    }
  }

  /**
   * Скрывает модальное окно
   */
  static hideModal(name) {
    const modal = this.getModal(name);
    if (modal && modal.hide) {
      modal.hide();
    }
  }

  /**
   * Обработчики событий модальных окон
   */
  static onFileUploaderClose() {
    // Логика при закрытии окна загрузки файлов
    console.log('File uploader closed');
  }

  static onPreviewApprove() {
    // Логика при подтверждении в окне предпросмотра
    console.log('Preview approved');
  }

  static onPreviewDeny() {
    // Логика при отказе в окне предпросмотра
    console.log('Preview denied');
  }

  /**
   * Настройка глобальной обработки ошибок
   */
  static setupErrorHandling() {
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      // Можно показать уведомление пользователю
      this.showErrorNotification('Произошла ошибка при выполнении операции');
    });

    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
    });
  }

  /**
   * Показывает уведомление об ошибке
   */
  static showErrorNotification(message) {
    // Используем Semantic UI для показа уведомлений
    $('body').toast({
      class: 'error',
      message: message,
      showIcon: 'exclamation circle'
    });
  }

  /**
   * Получает текущий экземпляр ImageViewer
   */
  static getImageViewer() {
    return this.imageViewer;
  }

  /**
   * Получает текущий экземпляр SearchBlock
   */
  static getSearchBlock() {
    return this.searchBlock;
  }

  /**
   * Получает API клиент VK
   */
  static getVKAPI() {
    return this.vkAPI;
  }

  /**
   * Получает API клиент Yandex
   */
  static getYandexAPI() {
    return this.yandexAPI;
  }

  /**
   * Очистка ресурсов приложения
   */
  static destroy() {
    // Закрываем все модальные окна
    if (this.modals) {
      Object.values(this.modals).forEach(modal => {
        if (modal.hide) modal.hide();
      });
    }

    // Очищаем ссылки
    this.searchBlock = null;
    this.imageViewer = null;
    this.modals = null;
    this.vkAPI = null;
    this.yandexAPI = null;
  }
}

// Автоматическая инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
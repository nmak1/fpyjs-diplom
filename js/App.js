/**
 * Класс App управляет всем приложением
 */

// Импортируем необходимые классы
import SearchBlock from './ui/SearchBlock.js';
import ImageViewer from './ui/ImageViewer.js';
import FileUploaderModal from './ui/Modals/FileUploaderModal.js';
import PreviewModal from './ui/Modals/PreviewModal.js';
import VK from './api/VK.js';
import Yandex from './api/Yandex.js';

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
    // Получаем DOM элементы модальных окон
    const fileUploaderElement = document.querySelector('.file-uploader-modal');
    const filePreviewerElement = document.querySelector('.uploaded-previewer-modal');

    if (!fileUploaderElement || !filePreviewerElement) {
      console.error('Modal elements not found in DOM');
      return;
    }

    // Инициализируем Semantic UI модальные окна
    $(fileUploaderElement).modal({
      closable: false,
      onHide: () => this.onFileUploaderClose()
    });

    $(filePreviewerElement).modal({
      closable: false,
      onApprove: () => this.onPreviewApprove(),
      onDeny: () => this.onPreviewDeny()
    });

    // Создаем экземпляры наших классов модальных окон
    this.modals = {
      fileUploader: new FileUploaderModal(fileUploaderElement),
      filePreviewer: new PreviewModal(filePreviewerElement),
    };

    console.log('Modals initialized:', this.modals);
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
    if (modal) {
      modal.open(data);
    } else {
      console.error(`Modal '${name}' not found for showing`);
    }
  }

  /**
   * Скрывает модальное окно
   */
  static hideModal(name) {
    const modal = this.getModal(name);
    if (modal) {
      modal.close();
    } else {
      console.error(`Modal '${name}' not found for hiding`);
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
    // Простая реализация без Semantic UI toast
    console.error('Error notification:', message);

    // Можно создать простое уведомление
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #db2828;
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      z-index: 10000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Автоматическое удаление через 5 секунд
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
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
        if (modal.close) modal.close();
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

export default App;
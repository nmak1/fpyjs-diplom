// Импортируем все необходимые классы
import App from './App.js';
import VK from './api/VK.js';
import Yandex from './api/Yandex.js';
import createRequest from './api/createRequest.js';
import SearchBlock from './ui/SearchBlock.js';
import ImageViewer from './ui/ImageViewer.js';
import FileUploaderModal from './ui/Modals/FileUploaderModal.js';
import PreviewModal from './ui/Modals/PreviewModal.js';

// Явно делаем глобальными для отладки
window.App = App;
window.VK = VK;
window.Yandex = Yandex;
window.SearchBlock = SearchBlock;
window.ImageViewer = ImageViewer;
window.FileUploaderModal = FileUploaderModal;
window.PreviewModal = PreviewModal;

// Инициализация приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('🚀 Запуск инициализации приложения...');

        // Проверяем доступность DOM элементов
        console.log('Search block element:', document.querySelector('.search-block'));
        console.log('Images wrapper element:', document.querySelector('.images-wrapper'));
        console.log('File uploader modal element:', document.querySelector('.file-uploader-modal'));
        console.log('Preview modal element:', document.querySelector('.uploaded-previewer-modal'));

        // Проверяем доступность классов
        console.log('App class:', typeof App);
        console.log('FileUploaderModal class:', typeof FileUploaderModal);
        console.log('PreviewModal class:', typeof PreviewModal);

        // Инициализируем приложение
        App.init();

        console.log('✅ Приложение успешно инициализировано');

        // Тестируем базовые функции
        testAppFunctionality();

    } catch (error) {
        console.error('❌ Ошибка инициализации приложения:', error);
    }
});

// Функция для тестирования функциональности
function testAppFunctionality() {
    console.log('🧪 Тестирование функциональности...');

    // Проверяем доступ к компонентам через App
    const imageViewer = App.getImageViewer();
    const searchBlock = App.getSearchBlock();

    console.log('ImageViewer:', imageViewer);
    console.log('SearchBlock:', searchBlock);

    // Проверяем модальные окна
    const uploadModal = App.getModal('fileUploader');
    const previewModal = App.getModal('filePreviewer');

    console.log('Upload Modal:', uploadModal);
    console.log('Preview Modal:', previewModal);

    // Проверяем элементы DOM
    const searchInput = document.querySelector('.search-input');
    const imagesWrapper = document.querySelector('.images-wrapper');
    const fileUploaderModal = document.querySelector('.file-uploader-modal');
    const previewModalElement = document.querySelector('.uploaded-previewer-modal');

    console.log('Search input found:', !!searchInput);
    console.log('Images wrapper found:', !!imagesWrapper);
    console.log('File uploader modal found:', !!fileUploaderModal);
    console.log('Preview modal found:', !!previewModalElement);

    if (imageViewer && searchBlock && uploadModal && previewModal) {
        console.log('✅ Все компоненты успешно загружены');
    } else {
        console.log('⚠️ Некоторые компоненты не загружены');
        if (!uploadModal) console.log('❌ FileUploaderModal не загружен');
        if (!previewModal) console.log('❌ PreviewModal не загружен');
    }
}
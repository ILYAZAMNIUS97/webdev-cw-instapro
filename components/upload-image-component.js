import { uploadImage } from "../api.js";

/**
 * Компонент загрузки изображения.
 * Этот компонент позволяет пользователю загружать изображение и отображать его превью.
 * Если изображение уже загружено, пользователь может заменить его.
 *
 * @param {HTMLElement} params.element - HTML-элемент, в который будет рендериться компонент.
 * @param {Function} params.onImageUrlChange - Функция, вызываемая при изменении URL изображения.
 *                                            Принимает один аргумент - новый URL изображения или пустую строку.
 */
export function renderUploadImageComponent({ element, onImageUrlChange }) {
  /**
   * URL текущего изображения.
   * Изначально пуст, пока пользователь не загрузит изображение.
   * @type {string}
   */
  let imageUrl = "";

  /**
   * Функция рендеринга компонента.
   * Отображает интерфейс компонента в зависимости от состояния: 
   * либо форма выбора файла, либо превью загруженного изображения с кнопкой замены.
   */
  const render = () => {
    element.innerHTML = `
      <div class="upload-image">
        ${
          imageUrl
            ? `
            <div class="file-upload-image-container">
              <img class="file-upload-image" src="${imageUrl}" alt="Загруженное изображение">
              <button class="file-upload-remove-button button">Заменить фото</button>
            </div>
            `
            : `
            <label class="file-upload-label secondary-button">
              <input
                type="file"
                class="file-upload-input"
                style="display:none"
              />
              Выберите фото
            </label>
          `
        }
      </div>
    `;

    // Обработчик выбора файла
    const fileInputElement = element.querySelector(".file-upload-input");
    fileInputElement?.addEventListener("change", () => {
      const file = fileInputElement.files[0];
      if (file) {
        const labelEl = document.querySelector(".file-upload-label");
        labelEl.setAttribute("disabled", true);
        labelEl.textContent = "Загружаю файл...";
        
        // Добавляем анимацию загрузки
        labelEl.classList.add('loading');
        
        // Загружаем изображение с помощью API
        uploadImage({ file }).then(({ fileUrl }) => {
          imageUrl = fileUrl; // Сохраняем URL загруженного изображения
          onImageUrlChange(imageUrl); // Уведомляем о изменении URL изображения
          
          // Добавляем анимацию успеха
          labelEl.classList.remove('loading');
          labelEl.classList.add('success-animation');
          setTimeout(() => {
            labelEl.classList.remove('success-animation');
          }, 600);
          
          render(); // Перерисовываем компонент с новым состоянием
        }).catch((error) => {
          // Добавляем анимацию ошибки
          labelEl.classList.remove('loading');
          labelEl.classList.add('error-animation');
          setTimeout(() => {
            labelEl.classList.remove('error-animation');
            labelEl.removeAttribute("disabled");
            labelEl.textContent = "Выберите фото";
          }, 500);
          
          alert("Ошибка при загрузке изображения: " + error.message);
        });
      }
    });

    // Обработчик удаления изображения
    element
      .querySelector(".file-upload-remove-button")
      ?.addEventListener("click", () => {
        // Добавляем анимацию удаления
        const container = element.querySelector(".file-upload-image-container");
        container.style.animation = 'fadeOut 0.3s ease-out';
        
        setTimeout(() => {
          imageUrl = ""; // Сбрасываем URL изображения
          onImageUrlChange(imageUrl); // Уведомляем об изменении URL изображения
          render(); // Перерисовываем компонент
        }, 300);
      });
  };

  // Инициализация компонента
  render();
}

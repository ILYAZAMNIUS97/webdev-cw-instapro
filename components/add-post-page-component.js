import { renderHeaderComponent } from "./header-component.js";
import { renderUploadImageComponent } from "./upload-image-component.js";

export function renderAddPostPageComponent({ appEl, onAddPostClick }) {
  let imageUrl = ""; // Переменная для хранения URL загруженного изображения

  const render = () => {
    // @TODO: Реализовать страницу добавления поста
    const appHtml = `
    <div class="page-container">
      <div class="header-container"></div>
      <div class="form">
        <h3 class="form-title">Добавить пост</h3>
        
        <div class="form-row">
          <label class="form-label">Описание:</label>
          <textarea 
            class="input textarea" 
            id="description-input" 
            rows="4" 
            placeholder="Введите описание поста..."
          ></textarea>
        </div>

        <div class="form-row">
          <label class="form-label">Фотография:</label>
          <div class="upload-image-container"></div>
        </div>

        <button class="button" id="add-button">Добавить пост</button>
      </div>
    </div>
  `;

    appEl.innerHTML = appHtml;

    // Рендерим шапку
    renderHeaderComponent({
      element: document.querySelector(".header-container"),
    });

    // Рендерим компонент загрузки изображения
    renderUploadImageComponent({
      element: document.querySelector(".upload-image-container"),
      onImageUploaded: (newImageUrl) => {
        imageUrl = newImageUrl;
        console.log("Изображение загружено:", imageUrl);
      },
    });

    // Обработчик кнопки добавления поста
    document.getElementById("add-button").addEventListener("click", () => {
      const descriptionInput = document.getElementById("description-input");
      const description = descriptionInput.value.trim();

      // Валидация данных
      if (!description) {
        alert("Пожалуйста, введите описание поста");
        return;
      }

      if (!imageUrl) {
        alert("Пожалуйста, загрузите изображение");
        return;
      }

      // Вызываем callback с данными поста
      onAddPostClick({
        description: description,
        imageUrl: imageUrl,
      });
    });
  };

  render();
}

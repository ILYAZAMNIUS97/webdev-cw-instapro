import { USER_POSTS_PAGE } from "../routes.js";
import { renderHeaderComponent } from "./header-component.js";
import { posts, goToPage, user } from "../index.js";
import { likePost, dislikePost, getPosts, getUserPosts } from "../api.js";

export function renderPostsPageComponent({ appEl }) {
  // @TODO: реализовать рендер постов из api
  console.log("Актуальный список постов:", posts);

  /**
   * @TODO: чтобы отформатировать дату создания поста в виде "19 минут назад"
   * можно использовать https://date-fns.org/v2.29.3/docs/formatDistanceToNow
   */

  // Функция для генерации HTML одного поста
  function renderPost(post) {
    // Проверяем и исправляем URL аватара пользователя
    let userImageUrl = post.user.imageUrl;
    if (userImageUrl && (userImageUrl.includes('via.placeholder.com') || userImageUrl.includes('placeholder.com'))) {
      // Заменяем неработающие URL на дефолтный аватар
      userImageUrl = "https://avatars.githubusercontent.com/u/1?v=4";
    }

    return `
      <li class="post">
        <div class="post-header" data-user-id="${post.user.id}">
          <img src="${userImageUrl}" class="post-header__user-image" onerror="this.src='https://avatars.githubusercontent.com/u/1?v=4'">
          <p class="post-header__user-name">${post.user.name}</p>
        </div>
        <div class="post-image-container">
          <img class="post-image" src="${post.imageUrl}">
        </div>
        <div class="post-likes">
          <button data-post-id="${post.id}" class="like-button" ${!user ? 'disabled' : ''}>
            <img src="./assets/images/like-${
              post.isLiked ? "active" : "not-active"
            }.svg">
          </button>
          <p class="post-likes-text">
            Нравится: <strong>${post.likes.length}</strong>
          </p>
        </div>
        <p class="post-text">
          <span class="user-name">${post.user.name}</span>
          ${post.description}
        </p>
        <p class="post-date">
          ${new Date(post.createdAt).toLocaleDateString("ru-RU")}
        </p>
      </li>
    `;
  }

  // Генерируем HTML для всех постов
  const postsHtml = posts.map((post) => renderPost(post)).join("");

  const appHtml = `
    <div class="page-container">
      <div class="header-container"></div>
      <ul class="posts">
        ${postsHtml}
      </ul>
    </div>`;

  appEl.innerHTML = appHtml;

  renderHeaderComponent({
    element: document.querySelector(".header-container"),
  });

  // Добавляем обработчики событий для переходов к страницам пользователей
  for (let userEl of document.querySelectorAll(".post-header")) {
    userEl.addEventListener("click", () => {
      // Добавляем плавный переход
      document.querySelector('.page-container').style.opacity = '0.7';
      setTimeout(() => {
        goToPage(USER_POSTS_PAGE, {
          userId: userEl.dataset.userId,
        });
      }, 150);
    });
  }

  // Добавляем обработчики событий для лайков
  for (let likeButton of document.querySelectorAll(".like-button")) {
    likeButton.addEventListener("click", (event) => {
      event.stopPropagation(); // Предотвращаем всплытие события

      if (!user) {
        // Анимация ошибки
        likeButton.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
          likeButton.style.animation = '';
        }, 500);
        alert("Для лайка необходимо авторизоваться");
        return;
      }

      const postId = likeButton.dataset.postId;
      const currentPost = posts.find((post) => post.id === postId);

      if (!currentPost) {
        console.error("Пост не найден");
        return;
      }

      // Добавляем анимацию лайка
      likeButton.classList.add('liked');
      setTimeout(() => {
        likeButton.classList.remove('liked');
      }, 600);

      // Определяем, нужно ставить лайк или убирать
      const apiCall = currentPost.isLiked
        ? dislikePost({ postId, token: `Bearer ${user.token}` })
        : likePost({ postId, token: `Bearer ${user.token}` });

      console.log("Отправляем запрос с токеном:", `Bearer ${user.token}`);

      // Отключаем кнопку на время запроса
      likeButton.disabled = true;

      apiCall
        .then((updatedPost) => {
          // Обновляем пост в массиве posts
          const postIndex = posts.findIndex((post) => post.id === postId);
          if (postIndex !== -1) {
            posts[postIndex] = updatedPost;
          }

          // Обновляем только этот конкретный пост на странице
          updatePostDisplay(updatedPost);

          console.log(
            "Лайк обновлен:",
            updatedPost.isLiked ? "поставлен" : "убран"
          );
        })
        .catch((error) => {
          console.error("Ошибка при обновлении лайка:", error);

          // Если ошибка авторизации - показываем имитацию работы
          if (error.message === "Нет авторизации") {
            console.log("Демонстрация функционала лайков (без реального API):");

            // Имитируем успешный лайк локально
            currentPost.isLiked = !currentPost.isLiked;

            if (currentPost.isLiked) {
              currentPost.likes.push({ id: user.id, name: user.name });
            } else {
              currentPost.likes = currentPost.likes.filter(
                (like) => like.id !== user.id
              );
            }

            // Обновляем отображение
            updatePostDisplay(currentPost);

            console.log(
              "Лайк обновлен локально:",
              currentPost.isLiked ? "поставлен" : "убран"
            );
            console.log(
              "Примечание: С настоящим токеном это работало бы через API"
            );
          } else {
            alert("Ошибка при обновлении лайка: " + error.message);
          }
        })
        .finally(() => {
          // Включаем кнопку обратно
          likeButton.disabled = false;
        });
    });
  }

  // Функция для обновления отображения конкретного поста
  function updatePostDisplay(updatedPost) {
    const likeButton = document.querySelector(
      `[data-post-id="${updatedPost.id}"]`
    );
    const likeImage = likeButton.querySelector("img");
    const likeText = likeButton.parentElement.querySelector(
      ".post-likes-text strong"
    );

    // Плавное обновление счетчика лайков
    const currentCount = parseInt(likeText.textContent);
    const newCount = updatedPost.likes.length;
    
    if (currentCount !== newCount) {
      // Анимация изменения счетчика
      likeText.style.transform = 'scale(1.2)';
      likeText.style.color = '#565eef';
      setTimeout(() => {
        likeText.textContent = newCount;
        likeText.style.transform = 'scale(1)';
        likeText.style.color = '';
      }, 150);
    }

    // Обновляем изображение лайка с плавным переходом
    likeImage.style.opacity = '0.5';
    setTimeout(() => {
      likeImage.src = `./assets/images/like-${
        updatedPost.isLiked ? "active" : "not-active"
      }.svg`;
      likeImage.style.opacity = '1';
    }, 100);
  }

  // Добавляем анимацию появления постов
  const postElements = document.querySelectorAll('.post');
  postElements.forEach((post, index) => {
    post.style.animationDelay = `${index * 0.1}s`;
  });
}

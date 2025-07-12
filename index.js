import { getPosts, addPost, getUserPosts } from "./api.js";
import { renderAddPostPageComponent } from "./components/add-post-page-component.js";
import { renderAuthPageComponent } from "./components/auth-page-component.js";
import {
  ADD_POSTS_PAGE,
  AUTH_PAGE,
  LOADING_PAGE,
  POSTS_PAGE,
  USER_POSTS_PAGE,
} from "./routes.js";
import { renderPostsPageComponent } from "./components/posts-page-component.js";
import { renderLoadingPageComponent } from "./components/loading-page-component.js";
import {
  getUserFromLocalStorage,
  removeUserFromLocalStorage,
  saveUserToLocalStorage,
} from "./helpers.js";

// Используем реальные данные полученные через консоль
export let user = {
  id: "ilya_zamnius_browser_1752325978096", // Используем логин как ID
  name: "Илья",
  login: "ilya_zamnius_browser_1752325978096",
  token:
    "boc0dgasakdkasc4c8bod0csakawcoccd8csb8coak5g645w5k5o5k5w6c64685c6c606gc4dgcgascscsd8cccob45g5k5o6g38g3cc3e83ek",
  imageUrl:
    "https://storage.yandexcloud.net/skypro-webdev-homework-bucket/1752327846924-%25C3%2590%25C2%2594%25C3%2590%25C2%25BB%25C3%2591%25C2%258F%2520%25C3%2590%25C2%25BA%25C3%2590%25C2%25B2%25C3%2590%25C2%25BE%25C3%2591%25C2%2580%25C3%2590%25C2%25BA%25C3%2590%25C2%25B0.jpg",
};

export let page = null;
export let posts = [];

const getToken = () => {
  const token = user ? `Bearer ${user.token}` : undefined;
  return token;
};

export const logout = () => {
  user = null;
  removeUserFromLocalStorage();
  goToPage(POSTS_PAGE);
};

/**
 * Включает страницу приложения
 */
export const goToPage = (newPage, data) => {
  if (
    [
      POSTS_PAGE,
      AUTH_PAGE,
      ADD_POSTS_PAGE,
      USER_POSTS_PAGE,
      LOADING_PAGE,
    ].includes(newPage)
  ) {
    if (newPage === ADD_POSTS_PAGE) {
      /* Если пользователь не авторизован, то отправляем его на страницу авторизации перед добавлением поста */
      page = user ? ADD_POSTS_PAGE : AUTH_PAGE;
      return renderApp();
    }

    if (newPage === POSTS_PAGE) {
      page = LOADING_PAGE;
      renderApp();

      // Загружаем посты с токеном для показа лайков
      return getPosts({ token: getToken() })
        .then((newPosts) => {
          page = POSTS_PAGE;
          posts = newPosts;
          renderApp();
        })
        .catch((error) => {
          console.error(error);
          // Если не удалось загрузить, используем prod API
          const prodKey = "prod";
          const prodUrl = `https://wedev-api.sky.pro/api/v1/${prodKey}/instapro`;

          return fetch(prodUrl)
            .then((response) => response.json())
            .then((data) => {
              page = POSTS_PAGE;
              posts = data.posts || [];
              renderApp();
            })
            .catch(() => {
              page = POSTS_PAGE;
              posts = [];
              renderApp();
            });
        });
    }

    if (newPage === USER_POSTS_PAGE) {
      page = LOADING_PAGE;
      renderApp();

      return getUserPosts({ userId: data.userId, token: getToken() })
        .then((userPosts) => {
          page = USER_POSTS_PAGE;
          posts = userPosts;
          renderApp();
        })
        .catch((error) => {
          console.error(error);
          page = USER_POSTS_PAGE;
          posts = [];
          renderApp();
        });
    }

    page = newPage;
    renderApp();

    return;
  }

  throw new Error("страницы не существует");
};

const renderApp = () => {
  const appEl = document.getElementById("app");
  if (page === LOADING_PAGE) {
    return renderLoadingPageComponent({
      appEl,
      user,
      goToPage,
    });
  }

  if (page === AUTH_PAGE) {
    return renderAuthPageComponent({
      appEl,
      setUser: (newUser) => {
        user = newUser;
        saveUserToLocalStorage(user);
        goToPage(POSTS_PAGE);
      },
      user,
      goToPage,
    });
  }

  if (page === ADD_POSTS_PAGE) {
    return renderAddPostPageComponent({
      appEl,
      onAddPostClick({ description, imageUrl }) {
        // Реализация добавления поста в API
        page = LOADING_PAGE;
        renderApp();

        addPost({
          description,
          imageUrl,
          token: getToken(),
        })
          .then(() => {
            console.log("Пост успешно добавлен!");
            // После успешного добавления переходим на главную страницу
            // Посты автоматически обновятся при переходе
            return goToPage(POSTS_PAGE);
          })
          .catch((error) => {
            console.error("Ошибка при добавлении поста:", error);
            alert("Ошибка при добавлении поста: " + error.message);
            // Возвращаемся на страницу добавления поста
            page = ADD_POSTS_PAGE;
            renderApp();
          });
      },
    });
  }

  if (page === POSTS_PAGE) {
    return renderPostsPageComponent({
      appEl,
    });
  }

  if (page === USER_POSTS_PAGE) {
    return renderPostsPageComponent({
      appEl,
    });
  }
};

goToPage(POSTS_PAGE);

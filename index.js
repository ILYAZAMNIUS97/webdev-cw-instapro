import "./styles.css";
import "./ui-kit.css";
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

// Инициализируем пользователя из localStorage или null
export let user = getUserFromLocalStorage();

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

      // Загружаем посты с токеном для показа лайков (если пользователь авторизован)
      return getPosts({ token: getToken() })
        .then((newPosts) => {
          page = POSTS_PAGE;
          posts = newPosts;
          renderApp();
        })
        .catch((error) => {
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
            // После успешного добавления переходим на главную страницу
            // Посты автоматически обновятся при переходе
            return goToPage(POSTS_PAGE);
          })
          .catch((error) => {
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

// При инициализации приложения проверяем авторизацию и переходим на соответствующую страницу
if (user) {
  // Если пользователь авторизован, показываем ленту постов
  goToPage(POSTS_PAGE);
} else {
  // Если пользователь не авторизован, показываем ленту постов (но без возможности лайкать)
  goToPage(POSTS_PAGE);
}

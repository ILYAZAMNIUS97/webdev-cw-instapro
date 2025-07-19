// Замени на свой, чтобы получить независимый от других набор данных.
// "боевая" версия инстапро лежит в ключе prod
const personalKey = "ilya-zamnius"; // Ваш персональный ключ согласно ТЗ
const baseHost = "https://wedev-api.sky.pro"; // Обновленный URL согласно документации
const postsHost = `${baseHost}/api/v1/${personalKey}/instapro`;

export function getPosts({ token }) {
  return fetch(postsHost, {
    method: "GET",
    headers: {
      ...(token && { Authorization: token }),
    },
  })
    .then((response) => {
      if (response.status === 401) {
        throw new Error("Нет авторизации");
      }

      return response.json();
    })
    .then((data) => {
      return data.posts;
    });
}

// Новая функция для получения постов конкретного пользователя
export function getUserPosts({ userId, token }) {
  return fetch(`${postsHost}/user-posts/${userId}`, {
    method: "GET",
    headers: {
      ...(token && { Authorization: token }),
    },
  })
    .then((response) => {
      if (response.status === 401) {
        throw new Error("Нет авторизации");
      }
      return response.json();
    })
    .then((data) => {
      return data.posts;
    });
}

// Новая функция для добавления поста
export function addPost({ description, imageUrl, token }) {
  return fetch(postsHost, {
    method: "POST",
    headers: {
      Authorization: token, // Токен уже содержит "Bearer "
    },
    body: JSON.stringify({
      description,
      imageUrl,
    }),
  }).then((response) => {
    // Всегда читаем ответ как текст, чтобы увидеть ошибку
    return response.text().then((text) => {

      if (response.status === 401) {
        throw new Error("Нет авторизации");
      }
      if (response.status === 400) {
        throw new Error("Некорректные данные: " + text);
      }
      if (response.status === 201) {
        try {
          return JSON.parse(text);
        } catch (e) {
          return { result: "ok" };
        }
      }

      throw new Error("Неожиданный ответ: " + response.status + " " + text);
    });
  });
}

// Новая функция для лайка поста
export function likePost({ postId, token }) {
  return fetch(`${postsHost}/${postId}/like`, {
    method: "POST",
    headers: {
      Authorization: token,
    },
  })
    .then((response) => {
      if (response.status === 401) {
        throw new Error("Нет авторизации");
      }
      return response.json();
    })
    .then((data) => {
      return data.post;
    });
}

// Новая функция для снятия лайка
export function dislikePost({ postId, token }) {
  return fetch(`${postsHost}/${postId}/dislike`, {
    method: "POST",
    headers: {
      Authorization: token,
    },
  })
    .then((response) => {
      if (response.status === 401) {
        throw new Error("Нет авторизации");
      }
      return response.json();
    })
    .then((data) => {
      return data.post;
    });
}

export function registerUser({ login, password, name, imageUrl }) {
  return fetch(baseHost + "/api/user", {
    method: "POST",
    body: JSON.stringify({
      login,
      password,
      name,
      imageUrl,
    }),
  }).then((response) => {
    if (response.status === 400) {
      throw new Error("Такой пользователь уже существует");
    }
    return response.json();
  });
}

export function loginUser({ login, password }) {
  return fetch(baseHost + "/api/user/login", {
    method: "POST",
    body: JSON.stringify({
      login,
      password,
    }),
  }).then((response) => {
    if (response.status === 400) {
      throw new Error("Неверный логин или пароль");
    }
    return response.json();
  });
}

// Загружает картинку в облако, возвращает url загруженной картинки
export function uploadImage({ file }) {
  const data = new FormData();
  data.append("file", file);

  return fetch("https://wedev-api.sky.pro/api/upload/image", {
    method: "POST",
    body: data,
  }).then((response) => {
    return response.json();
  });
}

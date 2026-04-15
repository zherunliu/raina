import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: () => import("../views/LoginView.vue"),
    },
    {
      path: "/register",
      name: "register",
      component: () => import("../views/RegisterView.vue"),
    },
    {
      path: "/",
      name: "chat",
      component: () => import("../views/ChatView.vue"),
      meta: { requiresAuth: true },
    },
    { path: "/chat", redirect: "/" },
    {
      path: "/explore",
      name: "explore",
      component: () => import("../views/ExploreView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/:pathMatch(.*)*",
      name: "NotFound",
      component: () => import("../views/NotFoundView.vue"),
    },
  ],
});

router.beforeEach((to) => {
  const token = localStorage.getItem("token");
  const isAuthed = Boolean(token);

  if (to.meta.requiresAuth && !isAuthed) {
    return { path: "/login", query: { redirect: to.fullPath } };
  }

  if ((to.path === "/login" || to.path === "/register") && isAuthed) {
    return { path: "/" };
  }
});

export default router;

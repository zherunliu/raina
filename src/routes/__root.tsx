import {
  HeadContent,
  Scripts,
  Outlet,
  createRootRouteWithContext,
  Link,
} from "@tanstack/react-router";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { I18nProvider } from "@/i18n";
import styles from "@/styles.css?url";
export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    head: () => ({
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: "Raina · Tarot" },
      ],
      links: [{ rel: "stylesheet", href: styles }],
    }),
    component: Root,
    notFoundComponent: () => (
      <main className="mx-auto max-w-md space-y-4 p-12">
        <h1 className="text-3xl">404</h1>
        <p>页面不存在 / Page not found</p>
        <Link to="/" className="text-primary underline">
          返回首页 / Home
        </Link>
      </main>
    ),
    errorComponent: ({ error, reset }) => (
      <main className="p-12">
        <p role="alert">
          {error instanceof Error
            ? error.message
            : "发生错误 / Something went wrong"}
        </p>
        <button onClick={reset}>重试 / Retry</button>
      </main>
    ),
  },
);
function Root() {
  const { queryClient } = Route.useRouteContext();
  return (
    <html lang="zh" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <I18nProvider>
            <Outlet />
            <Toaster richColors />
          </I18nProvider>
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  );
}

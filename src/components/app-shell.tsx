import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type RefObject,
} from "react";
import { Link, Outlet, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Menu,
  Moon,
  Sun,
  Sparkles,
  Layers,
  BookOpen,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useI18n } from "@/i18n";
import { logout } from "@/lib/session";
import { TarotTools } from "./tarot-tools";
import type { DrawnCard } from "@/types";

type AppState = {
  sending: boolean;
  setSending: (value: boolean) => void;
  sendingRef: RefObject<boolean>;
  requestRef: RefObject<AbortController | null>;
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
  selectedCards: DrawnCard[];
  setSelectedCards: (cards: DrawnCard[]) => void;
  sidebar: boolean;
  setSidebar: (open: boolean) => void;
  openTool: (tool: "daily" | "spread") => void;
};
const AppContext = createContext<AppState | null>(null);
export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("Missing AppShell");
  return value;
}
export function AppShell() {
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const requestRef = useRef<AbortController | null>(null);
  useEffect(() => () => requestRef.current?.abort(), []);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedCards, setSelectedCards] = useState<DrawnCard[]>([]);
  const [sidebar, setSidebar] = useState(false);
  const [tool, setTool] = useState<"daily" | "spread" | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(localStorage.getItem("theme") === "dark");
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  async function signOut() {
    requestRef.current?.abort();
    await logout();
    queryClient.clear();
    await router.navigate({ to: "/login", search: { redirect: "/" } });
  }
  return (
    <AppContext
      value={{
        sending,
        setSending,
        sendingRef,
        requestRef,
        sessionId,
        setSessionId,
        selectedCards,
        setSelectedCards,
        sidebar,
        setSidebar,
        openTool: setTool,
      }}
    >
      <div className="flex h-svh min-w-80 flex-col">
        <a className="sr-only focus:not-sr-only focus:p-2" href="#main">
          {locale === "zh" ? "跳至内容" : "Skip to content"}
        </a>
        <header className="bg-card flex min-h-16 flex-wrap items-center justify-between gap-2 border-b px-3 py-2 sm:px-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("sidebar.history")}
              onClick={() => setSidebar(!sidebar)}
            >
              <Menu />
            </Button>
            <Link to="/" className="text-xl font-semibold tracking-tight">
              Raina<span className="text-primary"> ✧</span>
            </Link>
          </div>
          <nav className="flex items-center gap-1" aria-label="Main">
            <Button
              variant="ghost"
              onClick={() => setTool("daily")}
              aria-label={t("nav.daily")}
            >
              <Sparkles />
              <span className="hidden sm:inline">{t("nav.daily")}</span>
            </Button>
            <Button
              variant="ghost"
              onClick={() => setTool("spread")}
              aria-label={t("nav.spreads")}
            >
              <Layers />
              <span className="hidden sm:inline">{t("nav.spreads")}</span>
            </Button>
            <Button
              variant="ghost"
              render={<Link to="/explore" />}
              aria-label={t("nav.explore")}
            >
              <BookOpen />
              <span className="hidden sm:inline">{t("nav.explore")}</span>
            </Button>
          </nav>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
            >
              {locale === "zh" ? "EN" : "中文"}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label={locale === "zh" ? "切换主题" : "Toggle theme"}
              onClick={() => {
                setDark(!dark);
                localStorage.setItem("theme", !dark ? "dark" : "light");
              }}
            >
              {dark ? <Sun /> : <Moon />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label={t("auth.logout")}
              onClick={() => setConfirmLogout(true)}
            >
              <LogOut />
            </Button>
          </div>
        </header>
        <main id="main" className="min-h-0 flex-1">
          <Outlet />
        </main>
      </div>
      {tool && (
        <TarotTools
          mode={tool}
          close={() => setTool(null)}
          confirm={async (cards) => {
            setSelectedCards(cards);
            setTool(null);
            await router.navigate({ to: "/" });
          }}
        />
      )}
      <Dialog open={confirmLogout} onOpenChange={setConfirmLogout}>
        <DialogContent>
          <DialogTitle>{t("auth.logout_confirm_title")}</DialogTitle>
          <DialogDescription>{t("auth.logout_confirm_desc")}</DialogDescription>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmLogout(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => void signOut()}>
              {t("common.confirm")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppContext>
  );
}

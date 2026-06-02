import { useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, type Ref } from "vue";
import { getSessionsApi, getChatHistoryApi } from "../api";
import { queryKeys } from "../query-client";
import type { ChatMessage, Conversation } from "../types";

type ConversationEx = Conversation & {
  serverSessionId: string | null;
};

// 合并本地和服务器会话
export function useSessions(localConversations: Ref<ConversationEx[]>) {
  const queryClient = useQueryClient();

  // 获取服务器会话
  const { data: serverSessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: queryKeys.sessions,
    queryFn: async () => {
      const res = await getSessionsApi();
      if (res.code !== 1000) {
        throw new Error(res.message ?? "Failed to fetch sessions");
      }
      return (res.sessions ?? []).map((s) => ({
        id: s.id,
        title: s.title || s.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        serverSessionId: s.id,
        messages: [] as ChatMessage[],
      })) as ConversationEx[];
    },
    staleTime: 30_000, // 30 秒内不重新请求
    retry: 1,
  });

  const allConversations = computed(() => {
    const merged = [...(localConversations.value ?? [])];

    if (serverSessions.value) {
      for (const session of serverSessions.value) {
        if (!merged.some((c) => c.serverSessionId === session.id)) {
          merged.push(session);
        }
      }
    }

    return merged;
  });

  // 刷新会话列表
  function refetchSessions() {
    return queryClient.invalidateQueries({
      queryKey: queryKeys.sessions,
    });
  }

  return {
    allConversations,
    isLoadingSessions,
    refetchSessions,
  };
}

export function useChatHistory(
  serverSessionId: Ref<string | null | undefined>,
) {
  return useQuery({
    queryKey: computed(() =>
      serverSessionId.value ? queryKeys.history(serverSessionId.value) : [],
    ),
    queryFn: async () => {
      if (!serverSessionId.value) return [];
      const res = await getChatHistoryApi(serverSessionId.value);
      if (res.code !== 1000 || !Array.isArray(res.history)) {
        throw new Error("Failed to fetch chat history");
      }
      return res.history.map((h) => ({
        id: `${String(Date.now())}-${Math.random().toString(36).slice(2)}`,
        role: h.is_user ? ("user" as const) : ("assistant" as const),
        content: h.content,
        timestamp: Date.now(),
      })) as ChatMessage[];
    },
    // 将其作为懒请求：只有提供了合法的 server 级别的 ID 时才有必要请求
    enabled: computed(
      () =>
        !!serverSessionId.value && !serverSessionId.value.startsWith("temp-"),
    ),
    staleTime: Infinity, // 新消息在本地管理
    retry: 1,
  });
}

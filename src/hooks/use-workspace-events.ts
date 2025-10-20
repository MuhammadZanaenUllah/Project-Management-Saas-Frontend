import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

const baseURL = import.meta.env.VITE_API_BASE_URL as string;

export type TaskEventPayload = {
  task?: {
    _id: string;
    project?: string;
    workspace?: string;
  };
  taskId?: string;
};

/**
 * Subscribes to SSE workspace events to keep other users in sync in real time.
 * Automatically invalidates relevant React Query caches on task mutations.
 */
const useWorkspaceEvents = (workspaceId?: string) => {
  const queryClient = useQueryClient();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!workspaceId || !baseURL) return;

    // Close any existing stream when workspace changes
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    const url = `${baseURL}/events/workspace/${workspaceId}`;
    const es = new EventSource(url, { withCredentials: true });
    esRef.current = es;

    const invalidateForPayload = (payload: TaskEventPayload) => {
      // Always refresh task lists in this workspace
      queryClient.invalidateQueries({ queryKey: ["all-tasks", workspaceId] });

      // Refresh analytics for workspace
      queryClient.invalidateQueries({
        queryKey: ["workspace-analytics", workspaceId],
      });

      const projectId = payload.task?.project;
      if (projectId) {
        // Refresh analytics for the project
        queryClient.invalidateQueries({
          queryKey: ["project-analytics", projectId],
        });
      }
    };

    const onCreated = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as { type: string; payload: TaskEventPayload };
        invalidateForPayload(data.payload);
      } catch (err) {
        // swallow parse errors
      }
    };

    const onUpdated = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as { type: string; payload: TaskEventPayload };
        invalidateForPayload(data.payload);
      } catch (err) {}
    };

    const onDeleted = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as { type: string; payload: TaskEventPayload };
        invalidateForPayload(data.payload);
      } catch (err) {}
    };

    es.addEventListener("task.created", onCreated);
    es.addEventListener("task.updated", onUpdated);
    es.addEventListener("task.deleted", onDeleted);

    es.onerror = () => {
      // Let the browser automatically reconnect; we can also nudge caches
      // if needed, but prefer invalidation only on concrete events.
    };

    return () => {
      es.removeEventListener("task.created", onCreated);
      es.removeEventListener("task.updated", onUpdated);
      es.removeEventListener("task.deleted", onDeleted);
      es.close();
      esRef.current = null;
    };
  }, [workspaceId, queryClient]);
};

export default useWorkspaceEvents;
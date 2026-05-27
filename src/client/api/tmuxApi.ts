import type { TmuxTree } from "../../shared/tmuxTypes.js";

export async function fetchTmuxTree(): Promise<TmuxTree> {
  const response = await fetch("/api/tmux/tree");
  if (!response.ok) {
    const payload = (await response.json().catch(() => undefined)) as
      | { error?: { message?: string } }
      | undefined;
    throw new Error(payload?.error?.message ?? "Unable to load tmux sessions");
  }
  return (await response.json()) as TmuxTree;
}

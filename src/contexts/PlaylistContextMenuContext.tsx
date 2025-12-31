// File: src/contexts/PlaylistContextMenuContext.tsx

"use client";

import type { PlaylistWithTracks } from "@/types";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface MenuPosition {
  x: number;
  y: number;
}

interface PlaylistContextMenuContextType {
  playlist: PlaylistWithTracks | null;
  position: MenuPosition | null;
  openMenu: (playlist: PlaylistWithTracks, x: number, y: number) => void;
  closeMenu: () => void;
}

const PlaylistContextMenuContext = createContext<PlaylistContextMenuContextType | undefined>(
  undefined,
);

export function PlaylistContextMenuProvider({ children }: { children: ReactNode }) {
  const [playlist, setPlaylist] = useState<PlaylistWithTracks | null>(null);
  const [position, setPosition] = useState<MenuPosition | null>(null);

  const openMenu = useCallback((playlist: PlaylistWithTracks, x: number, y: number) => {
    setPlaylist(playlist);
    setPosition({ x, y });
  }, []);

  const closeMenu = useCallback(() => {
    setPlaylist(null);
    setPosition(null);
  }, []);

  return (
    <PlaylistContextMenuContext.Provider
      value={{ playlist, position, openMenu, closeMenu }}
    >
      {children}
    </PlaylistContextMenuContext.Provider>
  );
}

export function usePlaylistContextMenu() {
  const context = useContext(PlaylistContextMenuContext);
  if (!context) {
    throw new Error("usePlaylistContextMenu must be used within PlaylistContextMenuProvider");
  }
  return context;
}

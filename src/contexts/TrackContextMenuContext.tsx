// File: src/contexts/TrackContextMenuContext.tsx

"use client";

import type { Track } from "@/types";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface MenuPosition {
  x: number;
  y: number;
}

interface TrackContextMenuContextType {
  track: Track | null;
  position: MenuPosition | null;
  excludePlaylistId?: number;
  openMenu: (track: Track, x: number, y: number, excludePlaylistId?: number) => void;
  closeMenu: () => void;
}

const TrackContextMenuContext = createContext<TrackContextMenuContextType | undefined>(
  undefined,
);

export function TrackContextMenuProvider({ children }: { children: ReactNode }) {
  const [track, setTrack] = useState<Track | null>(null);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const [excludePlaylistId, setExcludePlaylistId] = useState<number | undefined>(undefined);

  const openMenu = useCallback((track: Track, x: number, y: number, excludePlaylistId?: number) => {
    setTrack(track);
    setPosition({ x, y });
    setExcludePlaylistId(excludePlaylistId);
  }, []);

  const closeMenu = useCallback(() => {
    setTrack(null);
    setPosition(null);
    setExcludePlaylistId(undefined);
  }, []);

  return (
    <TrackContextMenuContext.Provider
      value={{ track, position, excludePlaylistId, openMenu, closeMenu }}
    >
      {children}
    </TrackContextMenuContext.Provider>
  );
}

export function useTrackContextMenu() {
  const context = useContext(TrackContextMenuContext);
  if (!context) {
    throw new Error("useTrackContextMenu must be used within TrackContextMenuProvider");
  }
  return context;
}

"use client";

import { AnimatePresence, m, type PanInfo } from "framer-motion";
import {
  createContext,
  use,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { useEscapeKey } from "@/hooks/use-escape-key";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { useLockBodyScroll } from "@/hooks/use-lock-body-scroll";
import { cn } from "@/lib/utils/cn";

type DrawerContextValue = {
  open: boolean;
  titleId: string;
  setOpen: (open: boolean) => void;
  openDrawer: () => void;
  close: () => void;
};

const DrawerContext = createContext<DrawerContextValue | null>(null);

/** Access the nearest drawer, e.g. to close it after navigating. */
export function useDrawer() {
  const context = use(DrawerContext);
  if (!context) throw new Error("useDrawer must be used inside <Drawer>.");
  return context;
}

/**
 * Compound off-canvas panel:
 *
 *   <Drawer>
 *     <Drawer.Trigger aria-label="Open menu">☰</Drawer.Trigger>
 *     <Drawer.Content title="Navigation">…<Drawer.Close>Done</Drawer.Close></Drawer.Content>
 *   </Drawer>
 *
 * Works controlled (`open` + `onOpenChange`) or uncontrolled.
 */
function Drawer({ children, open: controlledOpen, onOpenChange }: { children: ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const titleId = useId();

  const setOpen = useCallback((next: boolean) => {
    if (controlledOpen === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  }, [controlledOpen, onOpenChange]);
  const openDrawer = useCallback(() => setOpen(true), [setOpen]);
  const close = useCallback(() => setOpen(false), [setOpen]);

  const value = useMemo(() => ({ open, titleId, setOpen, openDrawer, close }), [open, titleId, setOpen, openDrawer, close]);
  return <DrawerContext value={value}>{children}</DrawerContext>;
}

function DrawerTrigger({ onClick, ...props }: Omit<ComponentProps<"button">, "type">) {
  const { open, openDrawer } = useDrawer();
  return <button type="button" aria-expanded={open} aria-haspopup="dialog" onClick={(event) => { onClick?.(event); openDrawer(); }} {...props} />;
}

function DrawerClose({ onClick, ...props }: Omit<ComponentProps<"button">, "type">) {
  const { close } = useDrawer();
  return <button type="button" onClick={(event) => { onClick?.(event); close(); }} {...props} />;
}

const subscribeNoop = () => () => {};
/** True only after hydration, so portals never render during SSR. */
function useIsClient() {
  return useSyncExternalStore(subscribeNoop, () => true, () => false);
}

const DISMISS_OFFSET = 80;
const DISMISS_VELOCITY = 500;

function DrawerContent({ children, title, side = "left", className }: { children: ReactNode; title: string; side?: "left" | "right"; className?: string }) {
  const { open, close, titleId } = useDrawer();
  const panelRef = useRef<HTMLDivElement>(null);
  const isClient = useIsClient();
  const direction = side === "left" ? -1 : 1;

  useLockBodyScroll(open);
  useEscapeKey(close, open);
  useFocusTrap(panelRef, open);

  const onDragEnd = useCallback((_event: unknown, info: PanInfo) => {
    const offset = info.offset.x * direction;
    const velocity = info.velocity.x * direction;
    if (offset > DISMISS_OFFSET || velocity > DISMISS_VELOCITY) close();
  }, [close, direction]);

  if (!isClient) return null;
  // Portalled to <body>: a backdrop-filter ancestor would otherwise trap `position: fixed`.
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" role="presentation">
          <m.div
            className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            aria-hidden="true"
          />
          <m.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={cn(
              "absolute inset-y-0 flex w-[min(20rem,86vw)] touch-pan-y flex-col bg-surface shadow-pop",
              side === "left" ? "left-0 border-r border-line pl-[env(safe-area-inset-left)]" : "right-0 border-l border-line pr-[env(safe-area-inset-right)]",
              className,
            )}
            initial={{ x: `${direction * 100}%` }}
            animate={{ x: 0 }}
            exit={{ x: `${direction * 100}%`, transition: { type: "tween", duration: 0.2, ease: "easeIn" } }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            drag="x"
            dragConstraints={side === "left" ? { left: -400, right: 0 } : { left: 0, right: 400 }}
            dragElastic={{ left: side === "left" ? 0.6 : 0, right: side === "left" ? 0 : 0.6 }}
            dragMomentum={false}
            onDragEnd={onDragEnd}
          >
            <h2 id={titleId} className="sr-only">{title}</h2>
            {children}
          </m.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

Drawer.Trigger = DrawerTrigger;
Drawer.Content = DrawerContent;
Drawer.Close = DrawerClose;

export { Drawer };

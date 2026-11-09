"use client";

import { AnimatePresence, m } from "framer-motion";
import Link from "next/link";
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";

import { useClickOutside } from "@/hooks/use-click-outside";
import { useEscapeKey } from "@/hooks/use-escape-key";
import { cn } from "@/lib/utils/cn";

type MenuContextValue = {
  open: boolean;
  menuId: string;
  toggle: () => void;
  close: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
  contentRef: RefObject<HTMLDivElement | null>;
};

const MenuContext = createContext<MenuContextValue | null>(null);

function useMenu() {
  const context = use(MenuContext);
  if (!context) throw new Error("Menu.* components must be rendered inside <Menu>.");
  return context;
}

/**
 * Compound dropdown menu:
 *
 *   <Menu>
 *     <Menu.Trigger>…</Menu.Trigger>
 *     <Menu.Content align="end">
 *       <Menu.Label>Account</Menu.Label>
 *       <Menu.Item href="/settings">Settings</Menu.Item>
 *       <Menu.Separator />
 *       <Menu.Item onSelect={signOut}>Sign out</Menu.Item>
 *     </Menu.Content>
 *   </Menu>
 *
 * Closes on outside click, Escape, and selection; arrow keys move focus.
 */
function Menu({ children, className }: { children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((value) => !value), []);
  const closeAndRefocus = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useClickOutside([triggerRef, contentRef], close, open);
  useEscapeKey(closeAndRefocus, open);

  const value = useMemo(() => ({ open, menuId, toggle, close, triggerRef, contentRef }), [open, menuId, toggle, close]);
  return (
    <MenuContext value={value}>
      <div className={cn("relative", className)}>{children}</div>
    </MenuContext>
  );
}

function MenuTrigger({ children, className, ...props }: Omit<ComponentProps<"button">, "onClick" | "type">) {
  const { open, menuId, toggle, triggerRef } = useMenu();
  return (
    <button
      ref={triggerRef}
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={open ? menuId : undefined}
      onClick={toggle}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
}

const placements = {
  "bottom-start": "left-0 top-full mt-1.5 origin-top-left",
  "bottom-end": "right-0 top-full mt-1.5 origin-top-right",
  "bottom-stretch": "inset-x-0 top-full mt-1.5 origin-top",
  "top-start": "left-0 bottom-full mb-2 origin-bottom-left",
  "top-stretch": "inset-x-0 bottom-full mb-2 origin-bottom",
} as const;

function focusSibling(container: HTMLElement, direction: 1 | -1 | "first" | "last") {
  const items = Array.from(container.querySelectorAll<HTMLElement>('[role="menuitem"]'));
  if (items.length === 0) return;
  const index = items.indexOf(document.activeElement as HTMLElement);
  const next =
    direction === "first" ? 0 : direction === "last" ? items.length - 1 : (index + direction + items.length) % items.length;
  items[next]?.focus();
}

function MenuContent({ children, placement = "bottom-end", className }: { children: ReactNode; placement?: keyof typeof placements; className?: string }) {
  const { open, menuId, contentRef } = useMenu();

  // Move focus into the menu when it opens (only on open, never during the exit animation).
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      if (contentRef.current) focusSibling(contentRef.current, "first");
    });
    return () => cancelAnimationFrame(frame);
  }, [open, contentRef]);

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, 1 | -1 | "first" | "last"> = { ArrowDown: 1, ArrowUp: -1, Home: "first", End: "last" };
    const direction = keys[event.key];
    if (direction === undefined) return;
    event.preventDefault();
    focusSibling(event.currentTarget, direction);
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <m.div
          ref={contentRef}
          id={menuId}
          role="menu"
          tabIndex={-1}
          onKeyDown={onKeyDown}
          initial={{ opacity: 0, scale: 0.96, y: placement.startsWith("top") ? 4 : -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.1 } }}
          transition={{ type: "spring", stiffness: 520, damping: 34 }}
          className={cn("absolute z-40 min-w-56 rounded-xl border border-line bg-surface p-1.5 shadow-pop focus:outline-none", placements[placement], className)}
        >
          {children}
        </m.div>
      )}
    </AnimatePresence>
  );
}

const itemClasses =
  "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] text-muted outline-none transition hover:bg-surface-muted hover:text-ink focus-visible:bg-surface-muted focus-visible:text-ink";

type MenuItemProps =
  | ({ href: string; onSelect?: never } & Omit<ComponentProps<typeof Link>, "href" | "role">)
  | ({ href?: never; onSelect?: () => void } & Omit<ComponentProps<"button">, "role" | "onSelect">);

function MenuItem({ className, children, ...props }: MenuItemProps) {
  const { close } = useMenu();
  if (props.href !== undefined) {
    const { href, onClick, ...linkProps } = props as Extract<MenuItemProps, { href: string }>;
    return (
      <Link role="menuitem" href={href} className={cn(itemClasses, className)} onClick={(event) => { onClick?.(event); close(); }} {...linkProps}>
        {children}
      </Link>
    );
  }
  const { onSelect, type = "button", onClick, ...buttonProps } = props as Extract<MenuItemProps, { href?: never }>;
  return (
    <button role="menuitem" type={type} className={cn(itemClasses, className)} onClick={(event) => { onClick?.(event); onSelect?.(); if (type !== "submit") close(); }} {...buttonProps}>
      {children}
    </button>
  );
}

function MenuLabel({ children }: { children: ReactNode }) {
  return <div className="px-2.5 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wider text-subtle">{children}</div>;
}

function MenuSeparator() {
  return <div role="separator" className="my-1 h-px bg-line" />;
}

Menu.Trigger = MenuTrigger;
Menu.Content = MenuContent;
Menu.Item = MenuItem;
Menu.Label = MenuLabel;
Menu.Separator = MenuSeparator;

export { Menu };

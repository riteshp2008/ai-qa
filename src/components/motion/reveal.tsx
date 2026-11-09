import type { ComponentProps } from "react";

import { RevealItem, RevealRoot } from "./reveal-primitives";

/**
 * Compound entrance animation: <Reveal> staggers its <Reveal.Item> children.
 *
 * This module is intentionally not a client module: server components cannot
 * "dot into" a client module, so the compound is assembled here from client
 * primitives and works from both server and client components.
 */
function Reveal(props: ComponentProps<typeof RevealRoot>) {
  return <RevealRoot {...props} />;
}

Reveal.Item = function Item(props: ComponentProps<typeof RevealItem>) {
  return <RevealItem {...props} />;
};

export { Reveal };

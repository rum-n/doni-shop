/**
 * Single source of truth for the site navigation.
 *
 * `label` is a key under the `Navigation` namespace in messages/{en,bg}.json.
 */
export interface NavItem {
  href: string;
  label: string;
}

/** Shown in the header bar on desktop. */
export const HEADER_ITEMS: NavItem[] = [{ href: "/shop", label: "shop" }];

/** Shown in the floating sidebar on desktop. */
export const SIDEBAR_ITEMS: NavItem[] = [
  { href: "/prints", label: "prints" },
  { href: "/linocut-stamps", label: "linocutStamps" },
  { href: "/accessories", label: "accessories" },
  { href: "/about", label: "about" },
];

/**
 * The mobile drawer is the only navigation on small screens, where the header
 * links are hidden, so it carries everything.
 */
export const MOBILE_ITEMS: NavItem[] = [...HEADER_ITEMS, ...SIDEBAR_ITEMS];

/**
 * Pages that suppress the floating desktop sidebar.
 *
 * It is `position: fixed`, so on a wide, centred layout it sits on top of the
 * content rather than beside it. These pages reach their navigation through
 * the header instead, where Shop already lives.
 *
 * Only the desktop sidebar goes: the mobile drawer stays, because the header
 * links are hidden below `lg` and it is the only navigation there.
 */
export const HIDE_DESKTOP_SIDEBAR_PATHS = ["/shop"];

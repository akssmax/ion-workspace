/**
 * Custom tag appearance: the icon + accent color a user picks for a
 * role-less mailbox. Icons come from the shared lucide design system and
 * colors from the shared `accents` palette, so tags stay visually
 * consistent with labels, calendar events, and docs.
 *
 * Appearance is stored per mailbox id in user preferences (see
 * `UserPreferences.tagAppearance`) so it works for any JMAP backend,
 * including servers that do not expose a mailbox color property.
 */

import type { LucideIcon } from "lucide-react"
import {
  Activity,
  Anchor,
  Award,
  Baby,
  BadgeCheck,
  Banknote,
  Bell,
  BellRing,
  Bike,
  Book,
  BookOpen,
  Bookmark,
  Box,
  Briefcase,
  Brush,
  Building,
  Bus,
  Cake,
  Camera,
  Car,
  Church,
  CircleDollarSign,
  Clapperboard,
  Cloud,
  Code,
  Coffee,
  Coins,
  Compass,
  Crown,
  Dumbbell,
  Factory,
  Feather,
  FileText,
  Film,
  Flag,
  Flame,
  Folder,
  Gamepad,
  Gem,
  Gift,
  Globe,
  GraduationCap,
  HandHeart,
  Headphones,
  Heart,
  HeartPulse,
  Home,
  Hospital,
  Hotel,
  Joystick,
  Landmark,
  Layers,
  Leaf,
  Lightbulb,
  Mail,
  MapPin,
  Megaphone,
  Mic,
  Moon,
  Music,
  Newspaper,
  Notebook,
  Palette,
  PawPrint,
  PenTool,
  PiggyBank,
  Plane,
  Receipt,
  Rocket,
  School,
  Scissors,
  Shield,
  Ship,
  Shirt,
  ShoppingCart,
  Snowflake,
  Sparkles,
  Star,
  Stethoscope,
  Store,
  Sun,
  Tag,
  Tags,
  Target,
  Tent,
  TrendingUp,
  Trophy,
  Umbrella,
  Users,
  Utensils,
  Wallet,
  Warehouse,
  Wrench,
  Zap,
} from "lucide-react"
import type { AccentName } from "./accents"
import { resolveAccent } from "./accents"

/** Curated icon set offered for custom tags / folders. */
export const TAG_ICONS = {
  tag: Tag,
  tags: Tags,
  folder: Folder,
  star: Star,
  bookmark: Bookmark,
  flag: Flag,
  briefcase: Briefcase,
  building: Building,
  users: Users,
  heart: Heart,
  "heart-pulse": HeartPulse,
  "hand-heart": HandHeart,
  bell: Bell,
  "bell-ring": BellRing,
  zap: Zap,
  flame: Flame,
  lightbulb: Lightbulb,
  rocket: Rocket,
  target: Target,
  trophy: Trophy,
  award: Award,
  "badge-check": BadgeCheck,
  gift: Gift,
  cake: Cake,
  coffee: Coffee,
  dumbbell: Dumbbell,
  "graduation-cap": GraduationCap,
  stethoscope: Stethoscope,
  hospital: Hospital,
  landmark: Landmark,
  school: School,
  church: Church,
  factory: Factory,
  warehouse: Warehouse,
  store: Store,
  "piggy-bank": PiggyBank,
  receipt: Receipt,
  wallet: Wallet,
  banknote: Banknote,
  coins: Coins,
  "circle-dollar-sign": CircleDollarSign,
  "shopping-cart": ShoppingCart,
  box: Box,
  plane: Plane,
  "map-pin": MapPin,
  car: Car,
  bike: Bike,
  bus: Bus,
  ship: Ship,
  tent: Tent,
  hotel: Hotel,
  home: Home,
  utensils: Utensils,
  music: Music,
  camera: Camera,
  film: Film,
  clapperboard: Clapperboard,
  gamepad: Gamepad,
  joystick: Joystick,
  headphones: Headphones,
  mic: Mic,
  palette: Palette,
  brush: Brush,
  scissors: Scissors,
  shirt: Shirt,
  globe: Globe,
  compass: Compass,
  leaf: Leaf,
  sun: Sun,
  moon: Moon,
  cloud: Cloud,
  snowflake: Snowflake,
  umbrella: Umbrella,
  shield: Shield,
  code: Code,
  wrench: Wrench,
  layers: Layers,
  "book-open": BookOpen,
  book: Book,
  notebook: Notebook,
  newspaper: Newspaper,
  "file-text": FileText,
  mail: Mail,
  megaphone: Megaphone,
  sparkles: Sparkles,
  feather: Feather,
  crown: Crown,
  gem: Gem,
  anchor: Anchor,
  "paw-print": PawPrint,
  "pen-tool": PenTool,
  baby: Baby,
  activity: Activity,
  "trending-up": TrendingUp,
} satisfies Record<string, LucideIcon>

export type TagIconName = keyof typeof TAG_ICONS

export const TAG_ICON_NAMES = Object.keys(TAG_ICONS) as TagIconName[]

export const DEFAULT_TAG_ICON: TagIconName = "tag"

export function isTagIconName(value: string | null | undefined): value is TagIconName {
  return !!value && value in TAG_ICONS
}

export function tagIcon(name: string | null | undefined): LucideIcon {
  return isTagIconName(name) ? TAG_ICONS[name] : TAG_ICONS[DEFAULT_TAG_ICON]
}

/** Stored shape, mirrored in `UserPreferences.tagAppearance`. */
export type TagAppearance = {
  color?: string
  icon?: string
}

export type ResolvedTagAppearance = {
  color: AccentName
  icon: TagIconName
  Icon: LucideIcon
}

/** Resolve stored appearance, falling back to a stable per-key accent. */
export function resolveTagAppearance(
  appearance: TagAppearance | undefined,
  fallbackKey: string
): ResolvedTagAppearance {
  const icon = isTagIconName(appearance?.icon) ? appearance.icon : DEFAULT_TAG_ICON
  return {
    color: resolveAccent(appearance?.color, fallbackKey),
    icon,
    Icon: TAG_ICONS[icon],
  }
}

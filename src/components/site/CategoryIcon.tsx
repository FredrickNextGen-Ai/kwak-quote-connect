import {
  Car,
  Cog,
  Disc,
  Filter,
  Navigation,
  Settings,
  Sparkles,
  Thermometer,
  Waves,
  Wrench,
  Zap,
  type LucideProps,
} from "lucide-react";

const ICONS: Record<string, React.ComponentType<LucideProps>> = {
  Car,
  Cog,
  Disc,
  Filter,
  Navigation,
  Settings,
  Sparkles,
  Thermometer,
  Waves,
  Zap,
};

export function CategoryIcon({ name, ...props }: { name: string | null } & LucideProps) {
  const Icon = (name && ICONS[name]) || Wrench;
  return <Icon {...props} />;
}

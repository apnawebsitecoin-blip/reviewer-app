import {
  Smartphone, Shirt, Home, Sparkles, Dumbbell, BookOpen,
  Gamepad2, UtensilsCrossed, Baby, ShoppingBag, Star, Heart,
  Music, Camera, Car, Plane, Coffee, Pizza, Pill, GraduationCap,
  Watch, Headphones, Tv, Laptop, Bike, Gift, Tag, Zap,
  Search, ShoppingCart, PenLine, Wallet, Users, Settings,
  Package, TrendingUp, Award, Globe, MapPin, Phone,
  Scissors, Flower2, Gem, Sofa, Wrench, Hammer,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const ICON_MAP: Record<string, LucideIcon> = {
  Smartphone, Shirt, Home, Sparkles, Dumbbell, BookOpen,
  Gamepad2, UtensilsCrossed, Baby, ShoppingBag, Star, Heart,
  Music, Camera, Car, Plane, Coffee, Pizza, Pill, GraduationCap,
  Watch, Headphones, Tv, Laptop, Bike, Gift, Tag, Zap,
  Search, ShoppingCart, PenLine, Wallet, Users, Settings,
  Package, TrendingUp, Award, Globe, MapPin, Phone,
  Scissors, Flower2, Gem, Sofa, Wrench, Hammer,
}

export const ICON_NAMES = Object.keys(ICON_MAP).sort()

export function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Package
}

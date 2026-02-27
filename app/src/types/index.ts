export interface TarotCard {
  id: number;
  name: string;
  nameEn: string;
  type: "major" | "minor";
  suit?: "wands" | "cups" | "swords" | "pentacles";
  number?: number;
  keywords: string[];
  upright: string;
  reversed: string;
  description: string;
  image: string;
}

export interface AllTarotCards {
  majorArcana: TarotCard[];
  wands: TarotCard[];
  cups: TarotCard[];
  swords: TarotCard[];
  pentacles: TarotCard[];
}

export interface DrawnCard {
  card: TarotCard;
  isReversed: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  cardInfo?: DrawnCard[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface DailyFortune {
  card: DrawnCard;
  interpretation: string;
  date: string;
}

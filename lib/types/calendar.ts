export interface Calendar {
  id: number;
  date: string;
  status: 'claimed' | 'unclaimed' | null;
}

export interface CreateCalendarData {
  date: string;
  status: 'claimed' | 'unclaimed';
}

export interface UpdateCalendarData {
  id: number;
  status: 'claimed' | 'unclaimed';
}
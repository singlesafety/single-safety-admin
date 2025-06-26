import { createClient } from "./client";
import { Calendar, CreateCalendarData, UpdateCalendarData } from "@/lib/types/calendar";

export async function getCalendarByDateRange(startDate: string, endDate: string): Promise<Calendar[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('calender')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch calendar data: ${error.message}`);
  }

  return data || [];
}

export async function getCalendarByDate(date: string): Promise<Calendar | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('calender')
    .select('*')
    .eq('date', date)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch calendar entry: ${error.message}`);
  }

  return data;
}

export async function createCalendarEntry(calendarData: CreateCalendarData): Promise<Calendar> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('calender')
    .insert([calendarData])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create calendar entry: ${error.message}`);
  }

  return data;
}

export async function updateCalendarEntry(calendarData: UpdateCalendarData): Promise<Calendar> {
  const supabase = createClient();
  const { id, ...updateData } = calendarData;
  
  const { data, error } = await supabase
    .from('calender')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update calendar entry: ${error.message}`);
  }

  return data;
}

export async function upsertCalendarEntry(date: string, status: 'claimed' | 'unclaimed'): Promise<Calendar> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('calender')
    .upsert({ date: date, status: status }, { onConflict: 'date' })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upsert calendar entry: ${error.message}`);
  }

  return data;
}

export async function deleteCalendarEntry(id: number): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('calender')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete calendar entry: ${error.message}`);
  }
}
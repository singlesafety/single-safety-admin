import { AdminAreaResult } from '@/lib/types/sgis';

export async function getAdminAreaClient(address: string): Promise<AdminAreaResult | null> {
  try {
    const url = new URL('/api/sgis/geocode', window.location.origin);
    url.searchParams.set('address', address);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Client geocoding error:', error);
    return null;
  }
}
import { describe, expect, it } from 'vitest';
import { isShowMoreCommand } from '@property-assistant/types';
import { formatPropertyMessage } from './property-message.js';

describe('WhatsApp property delivery contracts', () => {
  it('recognizes SHOW MORE variants', () => {
    expect(isShowMoreCommand('SHOW MORE')).toBe(true);
    expect(isShowMoreCommand('more properties')).toBe(true);
    expect(isShowMoreCommand('next')).toBe(true);
    expect(isShowMoreCommand('hello')).toBe(false);
  });

  it('formats an individual property with the required details', () => {
    const message = formatPropertyMessage(
      {
        id: '00000000-0000-4000-8000-000000000001',
        title: '2 BHK Apartment',
        locality: 'HSR Layout',
        city: 'Bengaluru',
        rent: 32000,
        deposit: 100000,
        area: 1150,
        furnishing: 'semi_furnished',
        available_from: '2030-09-01',
        amenities: ['parking', 'gym'],
        image_path: 'placeholders/property.webp',
        broker_name: 'Demo Realty',
        broker_phone: '+919900000001',
      },
      '+919900000002',
    );
    expect(message.text).toContain('₹32000/month');
    expect(message.text).toContain('HSR Layout, Bengaluru');
    expect(message.text).toContain('SHOW MORE');
    expect(message.imagePath).toBe('placeholders/property.webp');
  });
});

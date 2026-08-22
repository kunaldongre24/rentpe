import { format } from 'node:util';
import type { WhatsAppPropertyMessage } from '@property-assistant/types';

interface PropertyForMessage {
  id: string;
  title: string;
  locality: string;
  city: string;
  rent: string | number;
  deposit: string | number | null;
  area: string | number;
  furnishing: string;
  available_from: string;
  amenities: unknown;
  image_path?: string;
  broker_name?: string;
  broker_phone?: string;
}

export function formatPropertyMessage(
  property: PropertyForMessage,
  to: string,
): WhatsAppPropertyMessage {
  const amenities = Array.isArray(property.amenities)
    ? property.amenities.map(String).join(', ')
    : '—';
  const text = format(
    '🏠 %s\n\n📍 %s, %s\n\n💰 ₹%s/month\n🔐 Deposit: ₹%s\n📐 %s sq.ft\n\n🛋 %s\n\nAvailable from %s\n\nAmenities: %s\n\nBroker: %s\n📞 %s\n\nReply SHOW MORE for more properties.',
    property.title,
    property.locality,
    property.city,
    property.rent,
    property.deposit ?? 'Not specified',
    property.area,
    property.furnishing,
    property.available_from,
    amenities,
    property.broker_name ?? 'Demo broker',
    property.broker_phone ?? 'Not available',
  );
  return {
    to,
    propertyId: property.id,
    imagePath: property.image_path,
    text,
  };
}

import { describe, expect, it } from 'vitest';
import {
  brokerCreateSchema,
  locationCreateSchema,
  paginationSchema,
  propertyCreateSchema,
  userCreateSchema,
} from '@property-assistant/types';
import { BadRequestException } from '@nestjs/common';
import { parseRequest } from './request.js';

describe('CRUD request contracts', () => {
  it('normalizes pagination defaults and bounds', () => {
    expect(parseRequest(paginationSchema, {})).toEqual({
      limit: 20,
      offset: 0,
    });
    expect(() => parseRequest(paginationSchema, { limit: 101 })).toThrow(
      BadRequestException,
    );
  });

  it('requires E.164 phone numbers at the API boundary', () => {
    expect(() =>
      parseRequest(userCreateSchema, { phone: '9988776655' }),
    ).toThrow(BadRequestException);
    expect(
      parseRequest(userCreateSchema, { phone: '+919988776655' }),
    ).toMatchObject({ phone: '+919988776655' });
  });

  it('applies defaults to location and broker creates', () => {
    expect(
      parseRequest(locationCreateSchema, {
        name: 'HSR Layout',
        state: 'Karnataka',
        city: 'Bengaluru',
        latitude: 12.91,
        longitude: 77.63,
      }),
    ).toMatchObject({ country: 'India', aliases: [] });
    expect(
      parseRequest(brokerCreateSchema, {
        name: 'Demo Broker',
        phone: '+919988776655',
      }),
    ).toMatchObject({
      verificationStatus: 'unverified',
      active: true,
      responseScore: 0,
    });
  });

  it('rejects properties where floor exceeds total floors', () => {
    expect(() =>
      parseRequest(propertyCreateSchema, {
        brokerId: '00000000-0000-4000-8000-000000000001',
        locationId: '00000000-0000-4000-8000-000000000002',
        title: '2 BHK',
        description: 'A test property',
        propertyType: 'apartment',
        bhk: 2,
        rent: 30000,
        area: 1000,
        furnishing: 'semi_furnished',
        floor: 5,
        totalFloors: 3,
        address: 'Demo address',
        locality: 'HSR Layout',
        city: 'Bengaluru',
        latitude: 12.91,
        longitude: 77.63,
        availableFrom: '2030-01-01',
      }),
    ).toThrow(BadRequestException);
  });
});

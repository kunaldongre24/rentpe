'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';

type Entity = Record<string, unknown>;

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function api<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${apiUrl}/api${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(payload?.message ?? `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

function scalar(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  return '';
}

function text(row: Entity, key: string) {
  return scalar(row[key]) || '\u2014';
}

export function ListingForm({
  brokers,
  locations,
  onCreated,
  token,
}: {
  brokers: Entity[];
  locations: Entity[];
  onCreated: () => Promise<void>;
  token: string;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(undefined);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const location = locations.find((item) => item.id === values.locationId);
    const payload = {
      ...values,
      bhk: Number(values.bhk),
      rent: Number(values.rent),
      deposit: values.deposit ? Number(values.deposit) : null,
      area: Number(values.area),
      floor: values.floor ? Number(values.floor) : null,
      totalFloors: values.totalFloors ? Number(values.totalFloors) : null,
      latitude: Number(location?.latitude ?? 0),
      longitude: Number(location?.longitude ?? 0),
      parking: values.parking === 'on',
      balcony: Number(values.balcony ?? 0),
      amenities: scalar(values.amenities)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      status: 'DRAFT',
      qualityScore: 0,
      freshnessScore: 100,
    };
    try {
      await api('/partner/properties', token, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      await onCreated();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Unable to create listing',
      );
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <h2>List a rental property</h2>
          <p>
            Create a verified draft for admin review. Images are added after
            secure object storage is configured.
          </p>
        </div>
      </div>
      <form
        className="listing-form panel"
        onSubmit={(event) => void submit(event)}
      >
        {error && <div className="alert">{error}</div>}
        <fieldset>
          <legend>Partner and location</legend>
          <label>
            Broker or owner
            <select name="brokerId" required defaultValue="">
              <option value="" disabled>
                Select partner
              </option>
              {brokers.map((item) => (
                <option value={text(item, 'id')} key={text(item, 'id')}>
                  {text(item, 'name')} \u00B7 {text(item, 'company')}
                </option>
              ))}
            </select>
          </label>
          <label>
            Location
            <select name="locationId" required defaultValue="">
              <option value="" disabled>
                Select locality
              </option>
              {locations.map((item) => (
                <option value={text(item, 'id')} key={text(item, 'id')}>
                  {text(item, 'name')}, {text(item, 'city')}
                </option>
              ))}
            </select>
          </label>
        </fieldset>
        <fieldset>
          <legend>Property details</legend>
          <label className="wide">
            Listing title
            <input
              name="title"
              required
              maxLength={300}
              placeholder="Spacious 2 BHK near 27th Main"
            />
          </label>
          <label>
            Type
            <select name="propertyType" defaultValue="apartment">
              <option value="apartment">Apartment</option>
              <option value="independent_house">Independent house</option>
              <option value="villa">Villa</option>
              <option value="studio">Studio</option>
            </select>
          </label>
          <label>
            BHK
            <input name="bhk" type="number" min="1" max="20" required />
          </label>
          <label>
            Furnishing
            <select name="furnishing" defaultValue="semi_furnished">
              <option value="unfurnished">Unfurnished</option>
              <option value="semi_furnished">Semi-furnished</option>
              <option value="fully_furnished">Fully furnished</option>
            </select>
          </label>
          <label>
            Area (sq ft)
            <input name="area" type="number" min="1" required />
          </label>
          <label>
            Monthly rent
            <input name="rent" type="number" min="0" required />
          </label>
          <label>
            Deposit
            <input name="deposit" type="number" min="0" />
          </label>
          <label>
            Available from
            <input name="availableFrom" type="date" required />
          </label>
          <label>
            Floor
            <input name="floor" type="number" min="0" />
          </label>
          <label>
            Total floors
            <input name="totalFloors" type="number" min="0" />
          </label>
          <label>
            Balconies
            <input name="balcony" type="number" min="0" defaultValue="0" />
          </label>
          <label className="check">
            <input name="parking" type="checkbox" /> Parking available
          </label>
        </fieldset>
        <fieldset>
          <legend>Address and highlights</legend>
          <label>
            Locality
            <input name="locality" required />
          </label>
          <label>
            City
            <input name="city" required />
          </label>
          <label className="wide">
            Full address
            <textarea name="address" required rows={3} />
          </label>
          <label className="wide">
            Description
            <textarea
              name="description"
              required
              rows={5}
              maxLength={10_000}
              placeholder="Describe layout, surroundings, availability, and key terms without exaggeration."
            />
          </label>
          <label className="wide">
            Amenities
            <input
              name="amenities"
              placeholder="Lift, power backup, gym, security"
            />
          </label>
        </fieldset>
        <div className="form-actions">
          <span>Listings start as drafts and require admin activation.</span>
          <button className="primary-button" disabled={submitting}>
            {submitting ? 'Saving\u2026' : 'Save draft'}
          </button>
        </div>
      </form>
    </>
  );
}

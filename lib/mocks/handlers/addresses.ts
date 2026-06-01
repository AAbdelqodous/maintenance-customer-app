// MSW handlers for spec 008 — saved service addresses. In-memory; used by jest + the dev runtime.
import { http, HttpResponse } from 'msw';
import { API_BASE_URL } from '../../constants/config';
import type { ServiceAddress } from '../../../types/fulfillment';

const BASE = API_BASE_URL.replace(/\/$/, '');

let nextId = 100;
let addresses: ServiceAddress[] = [
  { id: 3, label: 'HOME', governorate: 'Hawalli', area: 'Block 3', lat: 29.33, lng: 48.02, note: 'Villa 5, gate at the back' },
];

export function __resetAddressesMock() {
  nextId = 100;
  addresses = [
    { id: 3, label: 'HOME', governorate: 'Hawalli', area: 'Block 3', lat: 29.33, lng: 48.02, note: 'Villa 5, gate at the back' },
  ];
}

export const addressesHandlers = [
  http.get(`${BASE}/me/addresses`, () => HttpResponse.json(addresses, { status: 200 })),

  http.post(`${BASE}/me/addresses`, async ({ request }) => {
    const body = (await request.json()) as ServiceAddress;
    if (!body.governorate) return new HttpResponse(null, { status: 400 });
    const created = { ...body, id: nextId++ };
    addresses.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.put(`${BASE}/me/addresses/:id`, async ({ params, request }) => {
    const id = Number(params.id);
    const body = (await request.json()) as ServiceAddress;
    const idx = addresses.findIndex((a) => a.id === id);
    if (idx < 0) return new HttpResponse(null, { status: 404 });
    addresses[idx] = { ...body, id };
    return HttpResponse.json(addresses[idx], { status: 200 });
  }),

  http.delete(`${BASE}/me/addresses/:id`, ({ params }) => {
    addresses = addresses.filter((a) => a.id !== Number(params.id));
    return new HttpResponse(null, { status: 204 });
  }),
];

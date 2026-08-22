import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/v1/auth/csrf-token', () =>
    HttpResponse.json({ csrfToken: 'test-csrf-token' })
  ),
  http.post('/api/v1/auth/login', async ({ request }) => {
    const body = await request.json();

    if (body.email === 'test@example.com' && body.password === 'Password1') {
      return HttpResponse.json({
        user: { _id: 'user-1', email: 'test@example.com' },
      });
    }

    return HttpResponse.json({ msg: 'Invalid credentials' }, { status: 401 });
  }),
];

/**
 * Contrato HTTP de la API de punta a punta: códigos de estado, dueño de los datos,
 * pagos sin duplicar, pesadas idempotentes y sincronización.
 *
 * Corre contra E2E_DATABASE_URL (una rama de Neon, nunca producción). Crea usuarios
 * con cédulas aleatorias y los borra al final (el borrado es en cascada).
 */
import { config as loadEnv } from 'dotenv';
import { ChildProcess, spawn } from 'child_process';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { Client } from 'pg';

loadEnv({ path: '.env.test', quiet: true });
const E2E_DATABASE_URL = process.env.E2E_DATABASE_URL;
const ADMIN_KEY = 'e2e-admin-key';
const PORT = 3100 + Math.floor(Math.random() * 800);

const describeIfDb = E2E_DATABASE_URL ? describe : describe.skip;

/** Arranca el servidor compilado (dist/main.js), el mismo artefacto que corre en producción. */
function startServer(): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    const server = spawn(process.execPath, ['dist/main.js'], {
      env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL, ADMIN_API_KEY: ADMIN_KEY, PORT: String(PORT) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const timer = setTimeout(() => reject(new Error('Server did not start in 30s')), 30000);
    server.stdout?.on('data', (chunk: Buffer) => {
      if (chunk.toString().includes('Backend running')) {
        clearTimeout(timer);
        resolve(server);
      }
    });
    server.stderr?.on('data', (chunk: Buffer) => process.stderr.write(chunk));
    server.on('exit', (code) => reject(new Error(`Server exited with code ${code}`)));
  });
}

describeIfDb('API contract (e2e)', () => {
  let server: ChildProcess;
  const http = request(`http://localhost:${PORT}`);
  const created: string[] = [];

  const nationalId = () => `9${Math.floor(Math.random() * 1e9).toString().padStart(9, '0')}`;

  async function registerUser() {
    const id = nationalId();
    const res = await http.post('/auth/register').send({ nationalId: id, password: 'Prueba123' }).expect(201);
    created.push(id);
    return { nationalId: id, token: `Bearer ${res.body.accessToken}` };
  }

  beforeAll(async () => {
    server = await startServer();
  });

  afterAll(async () => {
    server?.kill();
    if (created.length) {
      // Borrado en cascada: granja, cosechas, trabajadores, pesadas, pagos, venta y costos.
      const db = new Client({ connectionString: E2E_DATABASE_URL });
      await db.connect();
      await db.query('DELETE FROM coffee_growers WHERE national_id = ANY($1)', [created]);
      await db.end();
    }
  });

  it('GET /health → 200', async () => {
    await http.get('/health').expect(200, { status: 'ok', database: 'up' });
  });

  describe('auth', () => {
    it('register 201, duplicate 409, invalid 400, login 200, wrong password 401, me 200/401', async () => {
      const user = await registerUser();
      await http.post('/auth/register').send({ nationalId: user.nationalId, password: 'Prueba123' }).expect(409);
      await http.post('/auth/register').send({ nationalId: '12', password: 'x' }).expect(400);
      await http.post('/auth/login').send({ nationalId: user.nationalId, password: 'Prueba123' }).expect(200);
      const wrong = await http.post('/auth/login').send({ nationalId: user.nationalId, password: 'Otra12345' }).expect(401);
      expect(wrong.body.error).toBe('InvalidCredentialsError');
      await http.get('/auth/me').set('Authorization', user.token).expect(200);
      await http.get('/auth/me').expect(401);
    });

    it('change-password 204, wrong current password 422 (not 401, which would log out)', async () => {
      const user = await registerUser();
      await http
        .post('/auth/change-password')
        .set('Authorization', user.token)
        .send({ currentPassword: 'Nope12345', newPassword: 'Nueva123' })
        .expect(422);
      await http
        .post('/auth/change-password')
        .set('Authorization', user.token)
        .send({ currentPassword: 'Prueba123', newPassword: 'Nueva123' })
        .expect(204);
      await http.post('/auth/login').send({ nationalId: user.nationalId, password: 'Nueva123' }).expect(200);
    });
  });

  it('coffee price: POST needs the admin key (403), GET 200 or 204', async () => {
    await http.post('/price-and-news/coffee-price').send({ value: 2500000 }).expect(403);
    await http.post('/price-and-news/coffee-price').set('x-admin-key', 'wrong').send({ value: 2500000 }).expect(403);
    await http.post('/price-and-news/coffee-price').set('x-admin-key', ADMIN_KEY).send({ value: 2500000 }).expect(201);
    const user = await registerUser();
    const res = await http.get('/price-and-news/coffee-price').set('Authorization', user.token).expect(200);
    expect(res.body.value).toBeGreaterThan(0);
    await http.get('/price-and-news/news').set('Authorization', user.token).expect(200, []);
  });

  describe('harvest flow', () => {
    let owner: { token: string };
    let intruder: { token: string };
    let harvestId: string;
    let crewId: string;
    let workerId: string;
    let pickerId: string;

    beforeAll(async () => {
      owner = await registerUser();
      intruder = await registerUser();
    });

    it('no active harvest → 204; open 201; second open 409', async () => {
      await http.get('/harvests/active').set('Authorization', owner.token).expect(204);
      const res = await http
        .post('/harvests')
        .set('Authorization', owner.token)
        .send({ name: 'Primer pasón', pricePerKilogram: 1200 })
        .expect(201);
      expect(res.body.status).toBe('active');
      harvestId = res.body.id;
      await http
        .post('/harvests')
        .set('Authorization', owner.token)
        .send({ name: 'Otra', pricePerKilogram: 1000 })
        .expect(409);
      await http.get('/harvests/active').set('Authorization', owner.token).expect(200);
    });

    it('crew 201, worker 201, picker 201 into the crew, same worker again → 200 (moved)', async () => {
      crewId = (
        await http.post(`/harvests/${harvestId}/crews`).set('Authorization', owner.token).send({ name: 'Cuadrilla 1' }).expect(201)
      ).body.id;
      const crew2 = (
        await http.post(`/harvests/${harvestId}/crews`).set('Authorization', owner.token).send({ name: 'Cuadrilla 2' }).expect(201)
      ).body.id;
      workerId = (
        await http
          .post('/workers')
          .set('Authorization', owner.token)
          .send({ firstName: 'Juan', lastName: 'Pérez', alias: 'Juancho' })
          .expect(201)
      ).body.id;

      const picker = await http
        .post(`/harvests/${harvestId}/pickers`)
        .set('Authorization', owner.token)
        .send({ workerId, crewId: crew2 })
        .expect(201);
      pickerId = picker.body.id;
      const moved = await http
        .post(`/harvests/${harvestId}/pickers`)
        .set('Authorization', owner.token)
        .send({ workerId, crewId })
        .expect(200);
      expect(moved.body).toMatchObject({ id: pickerId, crewId, status: 'active' });

      await http.delete(`/harvests/${harvestId}/crews/${crew2}`).set('Authorization', owner.token).expect(204);
    });

    it('weighing: 201 with client id, same id again 200, same id other data 409, invalid 400', async () => {
      const id = randomUUID();
      await http.post('/weighings').set('Authorization', owner.token).send({ id, harvestPickerId: pickerId, kilograms: 25.5 }).expect(201);
      await http.post('/weighings').set('Authorization', owner.token).send({ id, harvestPickerId: pickerId, kilograms: 25.5 }).expect(200);
      await http.post('/weighings').set('Authorization', owner.token).send({ id, harvestPickerId: pickerId, kilograms: 30 }).expect(409);
      await http.post('/weighings').set('Authorization', owner.token).send({ harvestPickerId: pickerId, kilograms: -1 }).expect(400);
    });

    it('sync: all saved → 200; one failing → 207 with per-item status', async () => {
      const ok = randomUUID();
      const all = await http
        .post('/sync/weighings')
        .set('Authorization', owner.token)
        .send({ weighings: [{ id: ok, harvestPickerId: pickerId, kilograms: 4.5 }] })
        .expect(200);
      expect(all.body.results).toEqual([{ id: ok, status: 201 }]);

      const partial = await http
        .post('/sync/weighings')
        .set('Authorization', owner.token)
        .send({
          weighings: [
            { id: ok, harvestPickerId: pickerId, kilograms: 4.5 },
            { id: randomUUID(), harvestPickerId: 'not-a-picker', kilograms: 3 },
          ],
        })
        .expect(207);
      expect(partial.body.results.map((r: { status: number }) => r.status)).toEqual([200, 404]);
    });

    it('pickers come with name and totals', async () => {
      const res = await http.get(`/harvests/${harvestId}/pickers`).set('Authorization', owner.token).expect(200);
      expect(res.body[0]).toMatchObject({
        id: pickerId,
        displayName: 'Juancho',
        firstName: 'Juan',
        todayKilograms: 30,
        totalKilograms: 30,
        totalPaid: 0,
        balanceDue: 36000,
      });
    });

    it('payment: preview shows the net, pay 201 only the balance, paying again 422', async () => {
      const preview = await http
        .get(`/payments/picker/${pickerId}/preview`)
        .query({ harvestId, includesMeals: true, mealDeduction: 5000 })
        .set('Authorization', owner.token)
        .expect(200);
      expect(preview.body).toEqual({
        totalKilograms: 30,
        gross: 36000,
        alreadyPaid: 0,
        previousMealDeductions: 0,
        mealDeduction: 5000,
        net: 31000,
      });

      const paid = await http
        .post('/payments/pay-now')
        .set('Authorization', owner.token)
        .send({ harvestPickerId: pickerId, harvestId, includesMeals: true, mealDeduction: 5000 })
        .expect(201);
      expect(paid.body.payment.amount).toBe(31000);

      // 31.000 en efectivo + 5.000 en alimentación = 36.000: saldado
      const pickers = await http.get(`/harvests/${harvestId}/pickers`).set('Authorization', owner.token).expect(200);
      expect(pickers.body[0]).toMatchObject({ totalPaid: 31000, totalMealDeductions: 5000, balanceDue: 0 });

      await http
        .post('/payments/pay-now')
        .set('Authorization', owner.token)
        .send({ harvestPickerId: pickerId, harvestId, includesMeals: false })
        .expect(422);
    });

    it("another user gets 404 on everything of this harvest", async () => {
      await http.get(`/harvests/${harvestId}`).set('Authorization', intruder.token).expect(404);
      await http.get(`/harvests/${harvestId}/pickers`).set('Authorization', intruder.token).expect(404);
      await http.patch(`/harvests/${harvestId}/close`).set('Authorization', intruder.token).expect(404);
      await http
        .post('/weighings')
        .set('Authorization', intruder.token)
        .send({ harvestPickerId: pickerId, kilograms: 10 })
        .expect(404);
      await http.get(`/payments/picker/${pickerId}`).set('Authorization', intruder.token).expect(404);
      await http
        .post(`/harvests/${harvestId}/pickers`)
        .set('Authorization', intruder.token)
        .send({ workerId })
        .expect(404);
    });

    it('a worker with harvest history cannot be deleted (409)', async () => {
      await http.delete(`/workers/${workerId}`).set('Authorization', owner.token).expect(409);
    });

    it('close 200, sale 201 (then 409), cost 201 in positive, detail adds up', async () => {
      const closed = await http.patch(`/harvests/${harvestId}/close`).set('Authorization', owner.token).expect(200);
      expect(closed.body.status).toBe('closed');
      await http.get(`/sale-and-costs/sale/${harvestId}`).set('Authorization', owner.token).expect(204);

      const sale = { harvestId, actualDryKilograms: 6, salePrice: 12000, date: '2026-09-30' };
      await http.post('/sale-and-costs/sale').set('Authorization', owner.token).send(sale).expect(201);
      await http.post('/sale-and-costs/sale').set('Authorization', owner.token).send(sale).expect(409);

      const cost = await http
        .post('/sale-and-costs/production-cost')
        .set('Authorization', owner.token)
        .send({ harvestId, description: 'Abono', amount: 10000, date: '2026-09-30' })
        .expect(201);
      expect(cost.body.cost.amount).toBe(10000);
      // 72.000 venta − 31.000 pagado − 10.000 costos
      expect(cost.body.actualProfit).toBe(31000);

      const detail = await http.get(`/harvests/${harvestId}/detail`).set('Authorization', owner.token).expect(200);
      expect(detail.body).toMatchObject({
        totalCherryKilograms: 30,
        totalPayments: 31000,
        grossProfit: 41000,
        actualProfit: 31000,
        costs: [{ description: 'Abono', amount: 10000 }],
      });
    });
  });
});

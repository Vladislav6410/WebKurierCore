/**
 * Romantic Agent — Basic Tests
 * ----------------------------
 * Тесты базовых функций romantic-agent.js
 * Запуск:  npx jest engine/agents/romantic/tests/romantic.spec.js
 */

import { RomanticAgent } from '../romantic-agent.js';

describe('RomanticAgent', () => {
  const agent = new RomanticAgent();

  test('должен отвечать на простое приветствие', async () => {
    const reply = await agent.respond('Hello');
    expect(typeof reply).toBe('string');
    expect(reply.length).toBeGreaterThan(0);
  });

  test('должен использовать память пользователя', async () => {
    await agent.remember('u123', { tone: 'gentle', likes: ['poetry'] });
    const reply = await agent.respond('Tell me something sweet', { userId: 'u123' });
    expect(reply).toMatch(/poetry|sweet/i);
  });

  test('должен генерировать комплимент', async () => {
    const compliment = await agent.getCompliment();
    expect(typeof compliment).toBe('string');
    expect(compliment.length).toBeGreaterThan(0);
  });
});
const { evaluateIrrigation } = require('../services/decisionEngine');

describe('Irrigation Decision Engine (Pure Service Logic)', () => {
  test('Should recommend IRRIGATE_NOW when soil moisture < 35% and rain probability < 40%', () => {
    const result = evaluateIrrigation({ soilMoisture: 30, rainProbability: 25 });
    expect(result.decision).toBe('IRRIGATE_NOW');
    expect(result.reason).toContain('below the critical 35% threshold');
    expect(result.thresholdAlert).toBe(true);
  });

  test('Should recommend NO_IRRIGATION_NEEDED when soil moisture is adequate (>= 35%) even if rain probability is 0%', () => {
    const result = evaluateIrrigation({ soilMoisture: 45, rainProbability: 0 });
    expect(result.decision).toBe('NO_IRRIGATION_NEEDED');
    expect(result.reason).toContain('optimal zone');
    expect(result.thresholdAlert).toBe(false);
  });

  test('Should recommend NO_IRRIGATION_NEEDED when soil moisture is low (< 35%) BUT rain probability is high (>= 40%) to save water', () => {
    const result = evaluateIrrigation({ soilMoisture: 28, rainProbability: 65 });
    expect(result.decision).toBe('NO_IRRIGATION_NEEDED');
    expect(result.reason).toContain('upcoming rain probability');
    expect(result.thresholdAlert).toBe(true); // alert is still flagged because moisture is low
  });

  test('Should recommend NO_IRRIGATION_NEEDED when both soil moisture >= 35% and rain probability >= 40%', () => {
    const result = evaluateIrrigation({ soilMoisture: 55, rainProbability: 80 });
    expect(result.decision).toBe('NO_IRRIGATION_NEEDED');
    expect(result.thresholdAlert).toBe(false);
  });

  test('Boundary condition: moisture exactly 35% should not trigger irrigation', () => {
    const result = evaluateIrrigation({ soilMoisture: 35, rainProbability: 20 });
    expect(result.decision).toBe('NO_IRRIGATION_NEEDED');
  });

  test('Boundary condition: moisture 34.9% with rain probability 39.9% should trigger irrigation', () => {
    const result = evaluateIrrigation({ soilMoisture: 34.9, rainProbability: 39.9 });
    expect(result.decision).toBe('IRRIGATE_NOW');
  });

  test('Boundary condition: rain probability exactly 40% should prevent irrigation', () => {
    const result = evaluateIrrigation({ soilMoisture: 25, rainProbability: 40 });
    expect(result.decision).toBe('NO_IRRIGATION_NEEDED');
  });

  test('Should throw error for non-numeric inputs', () => {
    expect(() => evaluateIrrigation({ soilMoisture: 'bad', rainProbability: 20 })).toThrow();
    expect(() => evaluateIrrigation({ soilMoisture: 20, rainProbability: null })).toThrow();
  });
});

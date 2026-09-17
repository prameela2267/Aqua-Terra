/**
 * Irrigation Decision Engine
 * Pure, deterministic, testable logic for evaluating irrigation requirements.
 *
 * Rule:
 * IF soilMoisture < 35% AND rainProbability < 40%
 *    -> "IRRIGATE_NOW"
 * ELSE
 *    -> "NO_IRRIGATION_NEEDED"
 *
 * @param {Object} params
 * @param {number} params.soilMoisture - Soil moisture percentage (0-100)
 * @param {number} params.rainProbability - Rain probability percentage (0-100)
 * @returns {Object} { decision: 'IRRIGATE_NOW' | 'NO_IRRIGATION_NEEDED', reason: string, thresholdAlert: boolean }
 */
function evaluateIrrigation({ soilMoisture, rainProbability }) {
  if (typeof soilMoisture !== 'number' || isNaN(soilMoisture)) {
    throw new Error('Invalid soilMoisture: must be a valid number');
  }
  if (typeof rainProbability !== 'number' || isNaN(rainProbability)) {
    throw new Error('Invalid rainProbability: must be a valid number');
  }

  // Constrain inputs to 0-100 for safety
  const moisture = Math.max(0, Math.min(100, Math.round(soilMoisture * 10) / 10));
  const rain = Math.max(0, Math.min(100, Math.round(rainProbability * 10) / 10));

  if (moisture < 35 && rain < 40) {
    return {
      decision: 'IRRIGATE_NOW',
      reason: `Soil moisture (${moisture}%) is below the critical 35% threshold and rain probability (${rain}%) is below 40%. Immediate irrigation required to prevent crop stress.`,
      thresholdAlert: true,
      metrics: { soilMoisture: moisture, rainProbability: rain }
    };
  }

  let reason = '';
  if (moisture >= 35 && rain >= 40) {
    reason = `Soil moisture (${moisture}%) is healthy (>= 35%) and rain is anticipated (${rain}% probability). Irrigation not needed.`;
  } else if (moisture >= 35) {
    reason = `Soil moisture (${moisture}%) is within the optimal zone (>= 35%). Soil retains sufficient hydration.`;
  } else {
    reason = `Soil moisture (${moisture}%) is low, but upcoming rain probability (${rain}%) is >= 40%. Irrigation postponed to conserve water.`;
  }

  return {
    decision: 'NO_IRRIGATION_NEEDED',
    reason,
    thresholdAlert: moisture < 35, // alert farmer even if waiting for rain
    metrics: { soilMoisture: moisture, rainProbability: rain }
  };
}

module.exports = {
  evaluateIrrigation
};

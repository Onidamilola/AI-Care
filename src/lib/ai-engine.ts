import { VitalsData, PredictionResult, PatientProfile } from '../types';

export function analyzeVitals(data: VitalsData[], profile: PatientProfile): PredictionResult {
  if (data.length === 0) {
    return {
      riskScore: 0,
      riskLevel: 'Low',
      insights: ['No data available for analysis.'],
      recommendations: ['Ensure wearable device is connected.'],
      flareUpProbability: 0,
    };
  }

  const latest = data[data.length - 1];
  let riskScore = 0;
  const insights: string[] = [];
  const recommendations: string[] = [];

  // COPD Specific Analysis
  if (profile.condition === 'COPD') {
    // SpO2 Analysis
    if (latest.spo2 < 88) {
      riskScore += 50;
      insights.push('Critical: SpO2 levels dropped below 88%.');
      recommendations.push('Seek immediate medical attention.');
    } else if (latest.spo2 < 92) {
      riskScore += 25;
      insights.push('Warning: SpO2 levels are lower than baseline.');
      recommendations.push('Use prescribed inhaler and rest.');
    }

    // Heart Rate Analysis
    if (latest.heartRate > profile.baseline.heartRate + 20) {
      riskScore += 20;
      insights.push('High resting heart rate detected.');
      recommendations.push('Monitor breathing patterns.');
    }

    // Respiratory Rate Analysis
    if (latest.respiratoryRate > 25) {
      riskScore += 20;
      insights.push('Increased respiratory rate (tachypnea) detected.');
    }
  }

  // General Risk Level Mapping
  let riskLevel: PredictionResult['riskLevel'] = 'Low';
  if (riskScore >= 70) riskLevel = 'Critical';
  else if (riskScore >= 40) riskLevel = 'High';
  else if (riskScore >= 20) riskLevel = 'Moderate';

  if (riskLevel === 'Low') {
    insights.push('Vitals are within normal range.');
    recommendations.push('Continue regular monitoring.');
  }

  return {
    riskScore: Math.min(riskScore, 100),
    riskLevel,
    insights,
    recommendations,
    flareUpProbability: Math.min(riskScore, 100),
  };
}

export function generateMockVitals(count: number, simulateFlareUp: boolean = false): VitalsData[] {
  const data: VitalsData[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const time = new Date(now.getTime() - (count - i) * 15 * 60000); // 15 min intervals
    
    // Gradually degrade vitals if simulateFlareUp is true and we're near the end of the data
    const progress = i / count;
    const isDegrading = simulateFlareUp && progress > 0.6;

    data.push({
      timestamp: time.toISOString(),
      heartRate: (70 + Math.random() * 15) + (isDegrading ? (progress - 0.6) * 50 : 0),
      spo2: (94 + Math.random() * 5) - (isDegrading ? (progress - 0.6) * 20 : 0),
      steps: Math.floor(Math.random() * 500),
      respiratoryRate: (14 + Math.random() * 6) + (isDegrading ? (progress - 0.6) * 20 : 0),
      temperature: 36.5 + Math.random() * 0.5 + (isDegrading ? (progress - 0.6) * 2 : 0),
    });
  }
  return data;
}

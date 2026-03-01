export interface VitalsData {
  timestamp: string;
  heartRate: number;
  spo2: number;
  steps: number;
  respiratoryRate: number;
  temperature: number;
}

export interface PredictionResult {
  riskScore: number; // 0 to 100
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  insights: string[];
  recommendations: string[];
  flareUpProbability: number;
}

export interface PatientProfile {
  id: string;
  name: string;
  condition: 'COPD' | 'Diabetes';
  baseline: {
    heartRate: number;
    spo2: number;
  };
}

import { NextResponse } from 'next/server';
import { analyzeVitals } from '@/lib/ai-engine';
import { VitalsData, PatientProfile } from '@/types';

const MOCK_PROFILE: PatientProfile = {
  id: 'p1',
  name: 'John Doe',
  condition: 'COPD',
  baseline: {
    heartRate: 72,
    spo2: 96,
  },
};

export async function POST(request: Request) {
  try {
    const data: VitalsData[] = await request.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    const prediction = analyzeVitals(data, MOCK_PROFILE);

    return NextResponse.json({
      status: 'success',
      prediction,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process data' }, { status: 500 });
  }
}

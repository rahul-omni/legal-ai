export interface RiskFinding {
  severity: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  clause: string;
  location: {
    start: number;
    end: number;
  };
  recommendation: string;
}

export class RiskAnalyzer {
  static async analyzeContract(content: string): Promise<RiskFinding[]> {
    try {
      const response = await fetch('/api/analyze-risks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content })
      });

      if (!response.ok) throw new Error('Risk analysis failed');
      return response.json();
    } catch (error) {
      console.error('Risk analysis error:', error);
      throw error;
    }
  }
} 
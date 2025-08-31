import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestApiPage() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (endpoint: string) => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      console.log(`Testing ${endpoint}...`);
      const response = await fetch(endpoint, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      const responseTime = Date.now() - startTime;
      const contentType = response.headers.get('content-type');
      let data = null;
      
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      setResults(prev => ({
        ...prev,
        [endpoint]: {
          status: response.status,
          statusText: response.statusText,
          data: data,
          responseTime: responseTime,
          contentType: contentType,
          success: response.ok
        }
      }));
    } catch (error) {
      console.error(`Error testing ${endpoint}:`, error);
      setResults(prev => ({
        ...prev,
        [endpoint]: {
          error: error instanceof Error ? error.message : String(error),
          responseTime: Date.now() - startTime,
          success: false
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  const testAllEndpoints = async () => {
    const endpoints = [
      '/api/health',
      '/api/jobs',
      '/api/videos',
      '/api/dashboard/stats',
      '/api/videos/upload-url'
    ];
    
    for (const endpoint of endpoints) {
      await testEndpoint(endpoint);
    }
  };

  const testUploadUrl = async () => {
    setLoading(true);
    try {
      console.log('Testing POST /api/videos/upload-url...');
      const response = await fetch('/api/videos/upload-url', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({})
      });
      
      const data = await response.json();
      
      setResults(prev => ({
        ...prev,
        'POST /api/videos/upload-url': {
          status: response.status,
          data: data,
          success: response.ok
        }
      }));
    } catch (error) {
      console.error('Error testing upload URL:', error);
      setResults(prev => ({
        ...prev,
        'POST /api/videos/upload-url': {
          error: error instanceof Error ? error.message : String(error),
          success: false
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">API Test Page</h1>
      
      <div className="flex gap-4">
        <Button onClick={testAllEndpoints} disabled={loading}>
          Test All GET Endpoints
        </Button>
        <Button onClick={testUploadUrl} disabled={loading}>
          Test Upload URL (POST)
        </Button>
        <Button onClick={() => setResults({})} variant="outline">
          Clear Results
        </Button>
      </div>
      
      <div className="space-y-4">
        {Object.entries(results).map(([endpoint, result]) => (
          <Card key={endpoint}>
            <CardHeader>
              <CardTitle className={result.success ? 'text-green-600' : 'text-red-600'}>
                {endpoint} - {result.success ? 'SUCCESS' : 'FAILED'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {Object.keys(results).length === 0 && !loading && (
        <p className="text-muted-foreground">
          Click a button above to test API endpoints
        </p>
      )}
      
      {loading && (
        <p className="text-muted-foreground animate-pulse">
          Testing endpoints...
        </p>
      )}
    </div>
  );
}
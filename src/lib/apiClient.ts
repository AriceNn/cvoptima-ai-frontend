const isProduction = process.env.NODE_ENV === 'production';
const productionApiUrl = process.env.NEXT_PUBLIC_API_URL;
const developmentApiUrl = 'http://localhost:8000';

export const getApiUrl = (): string => {
  if (isProduction) {
    return productionApiUrl || 'https://api.cvoptima.com'; // fallback URL
  }
  return developmentApiUrl;
};

// Fetch wrapper'ları da ekleyebilirsiniz
export const apiClient = {
  get: (endpoint: string) => fetch(`${getApiUrl()}${endpoint}`),
  post: (endpoint: string, data: any) => 
    fetch(`${getApiUrl()}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
};
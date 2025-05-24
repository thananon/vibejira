import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const useJiraConfig = () => {
  const [jiraConfigUrl, setJiraConfigUrl] = useState('');

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/config`);
        if (!response.ok) {
          throw new Error('Failed to fetch config');
        }
        const configData = await response.json();
        if (configData.jiraBaseUrl) {
          setJiraConfigUrl(configData.jiraBaseUrl);
          console.log('Fetched JIRA Base URL:', configData.jiraBaseUrl);
        } else {
          console.warn('JIRA Base URL not found in backend config.');
          setJiraConfigUrl('#'); // Set to fallback if not provided
        }
      } catch (err) {
        console.error('Error fetching config:', err);
        setJiraConfigUrl('#'); // Set to fallback on error
      }
    };
    fetchConfig();
  }, []); // Run once on mount

  return { jiraConfigUrl };
}; 
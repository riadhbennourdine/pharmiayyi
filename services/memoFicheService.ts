import { MemoFiche } from '../types';

const API_BASE_URL = 'https://pharmiayyi-v2.up.railway.app/api/memofiches';

export const deleteMemoFiche = async (id: string): Promise<void> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found.');
  }

  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to delete memo fiche.');
  }
};

export const getMemoFicheById = async (id: string): Promise<MemoFiche> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found.');
  }

  const response = await fetch(`${API_BASE_URL}/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch memo fiche.');
  }
  return response.json();
};

export const updateMemoFiche = async (id: string, memoFiche: Partial<MemoFiche>): Promise<MemoFiche> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found.');
  }

  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(memoFiche),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update memo fiche.');
  }
  return response.json();
};

export const createMemoFiche = async (memoFiche: Omit<MemoFiche, '_id' | 'createdAt' | 'updatedAt'>): Promise<MemoFiche> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found.');
  }

  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(memoFiche),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create memo fiche.');
  }
  return response.json();
};
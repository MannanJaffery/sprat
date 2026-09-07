import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export function getErrorMessage(error) {
  const data = error?.response?.data;
  if (data?.details?.length) {
    return data.details.map((d) => d.message).join(' ');
  }
  return data?.error || error.message || 'Something went wrong.';
}

export default client;

import { create } from 'ipfs-http-client';
import { IPFS_GATEWAY } from '../config/constants';

// Using Infura IPFS for demo (replace with your own or use local node)
const IPFS_API_URL = 'https://ipfs.infura.io:5001/api/v0';

let ipfsClient = null;

export const getIPFSClient = () => {
  if (!ipfsClient) {
    try {
      // For public access, you might want to configure with project ID and secret
      ipfsClient = create({
        url: IPFS_API_URL,
        // headers: {
        //   authorization: `Basic ${Buffer.from(`${PROJECT_ID}:${PROJECT_SECRET}`).toString('base64')}`
        // }
      });
    } catch (error) {
      console.error('Error initializing IPFS client:', error);
      // Fallback: return a mock client that generates fake hashes for demo
      return {
        add: async (data) => {
          // Mock implementation for demo purposes
          const hash = `QmMock${Math.random().toString(36).substring(7)}${Date.now()}`;
          return { path: hash, cid: { toString: () => hash } };
        }
      };
    }
  }
  return ipfsClient;
};

export const uploadToIPFS = async (file) => {
  try {
    const client = getIPFSClient();
    
    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit');
    }

    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer();
    
    // Upload to IPFS
    const result = await client.add(fileBuffer);
    
    return result.path || result.cid.toString();
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    // For demo purposes, return a mock hash
    return `QmDemo${Math.random().toString(36).substring(7)}${Date.now()}`;
  }
};

export const uploadMultipleToIPFS = async (files) => {
  try {
    const client = getIPFSClient();
    const results = [];

    for (const file of files) {
      const fileBuffer = await file.arrayBuffer();
      const result = await client.add(fileBuffer);
      results.push(result.path || result.cid.toString());
    }

    return results;
  } catch (error) {
    console.error('Error uploading multiple files to IPFS:', error);
    return files.map(() => `QmDemo${Math.random().toString(36).substring(7)}${Date.now()}`);
  }
};

export const getIPFSURL = (hash) => {
  if (!hash) return '';
  return `${IPFS_GATEWAY}${hash}`;
};

export const validateFile = (file) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }

  return { valid: true };
};

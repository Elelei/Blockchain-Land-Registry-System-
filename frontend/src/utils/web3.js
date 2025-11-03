import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, NETWORK_CHAIN_ID, RPC_URL } from '../config/constants';

// Contract ABI - this will be generated after compilation
// For now, using minimal ABI with main functions
export const LAND_REGISTRY_ABI = [
  "function registerProperty(string,string,string,string,address,uint256,string) returns (uint256)",
  "function registerUser(address,bytes32,string)",
  "function approveProperty(uint256,bool)",
  "function listPropertyForSale(uint256,uint256)",
  "function requestToPurchase(uint256,uint256,string) payable",
  "function processPurchaseRequest(uint256,bool)",
  "function completePurchase(uint256)",
  "function updatePropertyDocuments(uint256,string)",
  "function removeFromSale(uint256)",
  "function getProperty(uint256) view returns (tuple(uint256,string,string,string,string,address,uint256,string,string,uint8,uint256,uint256,bool))",
  "function getOwnerProperties(address) view returns (uint256[])",
  "function getTransaction(uint256) view returns (tuple(uint256,uint256,address,address,uint256,uint8,uint256,uint256,string))",
  "function getPropertyTransactions(uint256) view returns (uint256[])",
  "function getTotalProperties() view returns (uint256)",
  "function registeredUsers(address) view returns (bool)",
  "function userRoles(address) view returns (string)",
  "function properties(uint256) view returns (uint256,string,string,string,string,address,uint256,string,string,uint8,uint256,uint256,bool)",
  "function transactions(uint256) view returns (uint256,uint256,address,address,uint256,uint8,uint256,uint256,string)",
  "function paused() view returns (bool)",
  "function SUPERADMIN_ROLE() view returns (bytes32)",
  "function GOVERNMENT_ROLE() view returns (bytes32)",
  "function PROPERTY_OWNER_ROLE() view returns (bytes32)",
  "function LEGAL_PROFESSIONAL_ROLE() view returns (bytes32)",
  "event PropertyRegistered(uint256 indexed,address indexed,string,uint256)",
  "event PropertyStatusChanged(uint256 indexed,uint8,uint8)",
  "event PropertyListedForSale(uint256 indexed,address indexed,uint256)",
  "event PurchaseRequested(uint256 indexed,uint256 indexed,address indexed,address,uint256)",
  "event PurchaseApproved(uint256 indexed,uint256 indexed,address indexed)",
  "event PurchaseRejected(uint256 indexed,uint256 indexed,address indexed)",
  "event OwnershipTransferred(uint256 indexed,address indexed,address indexed,uint256)",
  "event UserRegistered(address indexed,string)",
  "event DocumentsUpdated(uint256 indexed,string)"
];

let provider = null;
let signer = null;
let contract = null;

export const connectWallet = async () => {
  try {
    if (typeof window.ethereum !== 'undefined') {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      // Check network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const chainIdDecimal = parseInt(chainId, 16);

      if (chainIdDecimal !== NETWORK_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${NETWORK_CHAIN_ID.toString(16)}` }],
          });
        } catch (switchError) {
          // If network doesn't exist, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${NETWORK_CHAIN_ID.toString(16)}`,
                chainName: 'Local Hardhat Network',
                nativeCurrency: {
                  name: 'Ether',
                  symbol: 'ETH',
                  decimals: 18
                },
                rpcUrls: [RPC_URL]
              }]
            });
          } else {
            throw switchError;
          }
        }
      }

      provider = new ethers.BrowserProvider(window.ethereum);
      signer = await provider.getSigner();
      contract = new ethers.Contract(CONTRACT_ADDRESS, LAND_REGISTRY_ABI, signer);

      return {
        address: accounts[0],
        provider,
        signer,
        contract
      };
    } else {
      // Fallback to local provider if MetaMask not available
      provider = new ethers.JsonRpcProvider(RPC_URL);
      const accounts = await provider.listAccounts();
      if (accounts.length > 0) {
        signer = await provider.getSigner(accounts[0]);
        contract = new ethers.Contract(CONTRACT_ADDRESS, LAND_REGISTRY_ABI, signer);
        return {
          address: accounts[0],
          provider,
          signer,
          contract
        };
      }
      throw new Error('MetaMask not installed or no accounts available');
    }
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
};

export const getProvider = () => {
  if (!provider) {
    provider = typeof window.ethereum !== 'undefined'
      ? new ethers.BrowserProvider(window.ethereum)
      : new ethers.JsonRpcProvider(RPC_URL);
  }
  return provider;
};

export const getContract = async () => {
  if (!contract) {
    const provider = getProvider();
    if (typeof window.ethereum !== 'undefined') {
      signer = await provider.getSigner();
    } else {
      const accounts = await provider.listAccounts();
      if (accounts.length > 0) {
        signer = await provider.getSigner(accounts[0]);
      } else {
        throw new Error('No accounts available');
      }
    }
    contract = new ethers.Contract(CONTRACT_ADDRESS, LAND_REGISTRY_ABI, signer);
  }
  return contract;
};

export const formatEther = (value) => {
  return ethers.formatEther(value);
};

export const parseEther = (value) => {
  return ethers.parseEther(value.toString());
};

export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

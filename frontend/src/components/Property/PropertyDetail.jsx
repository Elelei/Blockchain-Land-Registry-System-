import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWeb3 } from '../../contexts/Web3Context';
import { MapPin, DollarSign, User, Calendar, FileText, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { PROPERTY_STATUS } from '../../config/constants';
import { formatEther, parseEther } from '../../utils/web3';
import { toast } from 'react-toastify';
import { getIPFSURL } from '../../services/ipfs';
import { format } from 'date-fns';

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { contract, account, isConnected } = useWeb3();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [listingPrice, setListingPrice] = useState('');
  const [listing, setListing] = useState(false);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (contract && isConnected && id) {
      loadProperty();
      loadTransactions();
    }
  }, [contract, isConnected, id]);

  const loadProperty = async () => {
    try {
      setLoading(true);
      const prop = await contract.getProperty(id);
      setProperty({
        id: prop[0],
        state: prop[1],
        district: prop[2],
        village: prop[3],
        surveyNumber: prop[4],
        owner: prop[5],
        marketValue: prop[6],
        propertyId: prop[7],
        ipfsHash: prop[8],
        status: Number(prop[9]),
        registeredAt: prop[10],
        lastUpdated: prop[11],
        isActive: prop[12]
      });
    } catch (error) {
      console.error('Error loading property:', error);
      toast.error('Failed to load property details');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const txIds = await contract.getPropertyTransactions(id);
      const txPromises = txIds.map(txId => contract.getTransaction(txId));
      const txData = await Promise.all(txPromises);
      
      const formatted = txData.map(tx => ({
        id: tx[0],
        propertyId: tx[1],
        seller: tx[2],
        buyer: tx[3],
        price: tx[4],
        status: Number(tx[5]),
        requestedAt: tx[6],
        completedAt: tx[7],
        ipfsHash: tx[8]
      }));
      
      setTransactions(formatted);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const handleListForSale = async () => {
    if (!listingPrice || parseFloat(listingPrice) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      setListing(true);
      const tx = await contract.listPropertyForSale(id, parseEther(listingPrice));
      await tx.wait();
      toast.success('Property listed for sale successfully!');
      await loadProperty();
      setListingPrice('');
    } catch (error) {
      console.error('Error listing property:', error);
      toast.error(error.reason || 'Failed to list property for sale');
    } finally {
      setListing(false);
    }
  };

  const handleRequestPurchase = async () => {
    if (!purchasePrice || parseFloat(purchasePrice) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    if (parseFloat(purchasePrice) < parseFloat(formatEther(property.marketValue))) {
      toast.error('Price must be at least equal to market value');
      return;
    }

    try {
      setRequesting(true);
      const tx = await contract.requestToPurchase(
        id,
        parseEther(purchasePrice),
        '',
        { value: parseEther(purchasePrice) }
      );
      await tx.wait();
      toast.success('Purchase request submitted successfully!');
      await loadProperty();
      await loadTransactions();
      setPurchasePrice('');
    } catch (error) {
      console.error('Error requesting purchase:', error);
      toast.error(error.reason || 'Failed to submit purchase request');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Property not found</p>
      </div>
    );
  }

  const isOwner = property.owner.toLowerCase() === account?.toLowerCase();
  const statusColors = {
    0: 'bg-yellow-100 text-yellow-800',
    1: 'bg-green-100 text-green-800',
    2: 'bg-red-100 text-red-800',
    3: 'bg-blue-100 text-blue-800',
    4: 'bg-purple-100 text-purple-800',
    5: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </button>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {property.propertyId}
              </h1>
              <p className="text-gray-500">{property.surveyNumber}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusColors[property.status]}`}>
              {PROPERTY_STATUS[property.status]}
            </span>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start">
              <MapPin className="h-5 w-5 text-primary-500 mr-3 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">{property.village}, {property.district}</p>
                <p className="text-sm text-gray-600">{property.state}</p>
              </div>
            </div>

            <div className="flex items-start">
              <DollarSign className="h-5 w-5 text-primary-500 mr-3 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Market Value</p>
                <p className="font-semibold text-lg">{formatEther(property.marketValue)} ETH</p>
              </div>
            </div>

            <div className="flex items-start">
              <User className="h-5 w-5 text-primary-500 mr-3 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Owner</p>
                <p className="font-medium font-mono text-sm">{property.owner}</p>
              </div>
            </div>

            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-primary-500 mr-3 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Registered</p>
                <p className="font-medium">
                  {format(new Date(Number(property.registeredAt) * 1000), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>

            {property.ipfsHash && (
              <div className="flex items-start">
                <FileText className="h-5 w-5 text-primary-500 mr-3 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Documents</p>
                  <a
                    href={getIPFSURL(property.ipfsHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline text-sm"
                  >
                    View on IPFS
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {isOwner && property.status === 1 && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold mb-3">List for Sale</h3>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Price in ETH"
                    value={listingPrice}
                    onChange={(e) => setListingPrice(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    step="0.01"
                  />
                  <button
                    onClick={handleListForSale}
                    disabled={listing}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {listing ? 'Listing...' : 'List'}
                  </button>
                </div>
              </div>
            )}

            {!isOwner && property.status === 3 && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Request Purchase</h3>
                <div className="space-y-2">
                  <input
                    type="number"
                    placeholder="Offer price (min: market value)"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    step="0.01"
                    min={formatEther(property.marketValue)}
                  />
                  <button
                    onClick={handleRequestPurchase}
                    disabled={requesting}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {requesting ? 'Processing...' : 'Request Purchase'}
                  </button>
                </div>
              </div>
            )}

            {isOwner && (property.status === 3 || property.status === 4) && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Manage Sale</h3>
                <button
                  onClick={async () => {
                    try {
                      const tx = await contract.removeFromSale(id);
                      await tx.wait();
                      toast.success('Property removed from sale');
                      await loadProperty();
                    } catch (error) {
                      toast.error('Failed to remove from sale');
                    }
                  }}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Remove from Sale
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {transactions.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Transaction History</h2>
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id.toString()} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Transaction #{tx.id.toString()}</p>
                    <p className="text-sm text-gray-600">
                      Buyer: <span className="font-mono">{tx.buyer}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Price: {formatEther(tx.price)} ETH
                    </p>
                  </div>
                  <div className="text-right">
                    {tx.status === 1 && <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-1" />}
                    {tx.status === 2 && <XCircle className="h-6 w-6 text-red-500 mx-auto mb-1" />}
                    <span className="text-xs text-gray-500">
                      {PROPERTY_STATUS[tx.status]}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetail;

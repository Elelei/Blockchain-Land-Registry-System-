import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../../contexts/Web3Context';
import { Search, ShoppingCart, CheckCircle, XCircle, Plus, Loader2 } from 'lucide-react';
import PropertyCard from '../Property/PropertyCard';
import { formatEther } from '../../utils/web3';
import { PROPERTY_STATUS } from '../../config/constants';

const BuyerDashboard = () => {
  const { contract, account } = useWeb3();
  const [availableProperties, setAvailableProperties] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (contract && account) {
      loadData();
    }
  }, [contract, account]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load available properties
      const totalProperties = await contract.getTotalProperties();
      const propertyPromises = [];

      for (let i = 1; i <= Number(totalProperties); i++) {
        propertyPromises.push(contract.getProperty(i));
      }

      const propertyData = await Promise.all(propertyPromises);
      
      const available = propertyData
        .map((prop, index) => ({
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
        }))
        .filter(prop => prop.isActive && prop.status === 3 && prop.owner.toLowerCase() !== account.toLowerCase());

      setAvailableProperties(available);

      // Load pending requests (simplified - would need to track user's transactions)
      // This would require additional contract functions or event filtering
      setPendingRequests([]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Buyer Dashboard</h1>
        <div className="flex space-x-3">
          <Link
            to="/register-property"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Register New Property
          </Link>
          <Link
            to="/properties"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Search className="h-5 w-5 mr-2" />
            Browse All Properties
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Available Properties</h2>
            <ShoppingCart className="h-6 w-6 text-primary-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{availableProperties.length}</p>
          <p className="text-sm text-gray-500 mt-1">Properties for sale</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Pending Requests</h2>
            <CheckCircle className="h-6 w-6 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{pendingRequests.length}</p>
          <p className="text-sm text-gray-500 mt-1">Awaiting approval</p>
        </div>
      </div>

      {availableProperties.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Properties Available for Purchase</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableProperties.slice(0, 6).map((property) => (
              <PropertyCard key={property.id.toString()} property={property} />
            ))}
          </div>
          {availableProperties.length > 6 && (
            <div className="text-center mt-6">
              <Link
                to="/properties"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                View All Properties →
              </Link>
            </div>
          )}
        </div>
      )}

      {pendingRequests.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Pending Purchase Requests</h2>
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Property #{request.propertyId}</p>
                    <p className="text-sm text-gray-600">
                      Offer: {formatEther(request.price)} ETH
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {request.status === 1 && (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm text-green-600">Approved</span>
                      </>
                    )}
                    {request.status === 2 && (
                      <>
                        <XCircle className="h-5 w-5 text-red-500" />
                        <span className="text-sm text-red-600">Rejected</span>
                      </>
                    )}
                    {request.status === 0 && (
                      <span className="text-sm text-yellow-600">Pending</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {availableProperties.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-4">No properties available for purchase</p>
          <Link
            to="/register-property"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Register Your First Property
          </Link>
        </div>
      )}
    </div>
  );
};

export default BuyerDashboard;

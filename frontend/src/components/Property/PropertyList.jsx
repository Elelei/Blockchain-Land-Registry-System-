import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../../contexts/Web3Context';
import PropertyCard from './PropertyCard';
import { Search, Filter, Loader2 } from 'lucide-react';
import { PROPERTY_STATUS } from '../../config/constants';

const PropertyList = () => {
  const { contract, isConnected } = useWeb3();
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (contract && isConnected) {
      loadProperties();
    }
  }, [contract, isConnected]);

  useEffect(() => {
    filterProperties();
  }, [searchTerm, statusFilter, properties]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const totalProperties = await contract.getTotalProperties();
      const propertyPromises = [];

      for (let i = 1; i <= Number(totalProperties); i++) {
        propertyPromises.push(contract.getProperty(i));
      }

      const propertyData = await Promise.all(propertyPromises);
      
      const formattedProperties = propertyData.map((prop, index) => ({
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
      })).filter(prop => prop.isActive && prop.id.toString() !== '0');

      setProperties(formattedProperties);
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProperties = () => {
    let filtered = [...properties];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(prop => prop.status === Number(statusFilter));
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(prop =>
        prop.propertyId.toLowerCase().includes(term) ||
        prop.surveyNumber.toLowerCase().includes(term) ||
        prop.state.toLowerCase().includes(term) ||
        prop.district.toLowerCase().includes(term) ||
        prop.village.toLowerCase().includes(term)
      );
    }

    setFilteredProperties(filtered);
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
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Property Registry</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by property ID, survey number, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
            >
              <option value="all">All Statuses</option>
              {Object.entries(PROPERTY_STATUS).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          Showing {filteredProperties.length} of {properties.length} properties
        </div>
      </div>

      {filteredProperties.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">No properties found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <PropertyCard key={property.id.toString()} property={property} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PropertyList;

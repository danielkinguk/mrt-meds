import { useState, useEffect } from 'react';
import { Briefcase, ChevronRight, ChevronDown, MapPin, Package, Plus } from 'lucide-react';
import { Location, Item, Medicine, Batch } from '../types';
import { db } from '../services/db/database';

interface LocationWithItems extends Location {
  items?: Item[];
  children?: LocationWithItems[];
  isExpanded?: boolean;
}

interface ItemDetails {
  item: Item;
  medicine?: Medicine;
  batch?: Batch;
}

export function KitsPage() {
  const [locations, setLocations] = useState<LocationWithItems[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationWithItems | null>(null);
  const [itemDetails, setItemDetails] = useState<ItemDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLocations();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedLocation?.items) {
      loadItemDetails(selectedLocation.items);
    }
  }, [selectedLocation]);

  const loadItemDetails = async (items: Item[]) => {
    const details = await Promise.all(items.map(async (item) => {
      const medicine = await db.medicines.get(item.medicineId);
      const batch = await db.batches.get(item.batchId);
      return { item, medicine, batch };
    }));
    setItemDetails(details);
  };

  const loadLocations = async () => {
    try {
      setLoading(true);
      const locs = await db.locations.toArray();
      
      const locsWithItems = await Promise.all(locs.map(async (loc) => {
        const items = await db.items.where('locationId').equals(loc.id!).toArray();
        return { ...loc, items };
      }));

      const tree = buildLocationTree(locsWithItems);
      setLocations(tree);
      
      if (tree.length > 0) {
        setSelectedLocation(tree[0]);
      }
    } catch (error) {
      console.error('Failed to load locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildLocationTree = (locs: LocationWithItems[]): LocationWithItems[] => {
    const locationMap = new Map<string, LocationWithItems>();
    const roots: LocationWithItems[] = [];

    locs.forEach(loc => {
      locationMap.set(loc.id!, { ...loc, children: [] });
    });

    locs.forEach(loc => {
      if (loc.parentId) {
        const parent = locationMap.get(loc.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(locationMap.get(loc.id!)!);
        }
      } else {
        roots.push(locationMap.get(loc.id!)!);
      }
    });

    return roots;
  };

  const toggleExpanded = (location: LocationWithItems) => {
    const updateExpanded = (locs: LocationWithItems[]): LocationWithItems[] => {
      return locs.map(loc => {
        if (loc.id === location.id) {
          return { ...loc, isExpanded: !loc.isExpanded };
        }
        if (loc.children) {
          return { ...loc, children: updateExpanded(loc.children) };
        }
        return loc;
      });
    };

    setLocations(updateExpanded(locations));
  };

  const renderLocationTree = (locs: LocationWithItems[], level = 0) => {
    return locs.map(location => (
      <div key={location.id}>
        <button
          onClick={() => {
            setSelectedLocation(location);
            if ((location.children && location.children.length > 0) || (location.items && location.items.length > 0)) {
              toggleExpanded(location);
            }
          }}
          className={`w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center ${
            selectedLocation?.id === location.id ? 'bg-primary-50 border-l-4 border-primary-500' : ''
          }`}
          style={{ paddingLeft: `${level * 24 + 12}px` }}
        >
          {((location.children && location.children.length > 0) || (location.items && location.items.length > 0)) && (
            <span className="mr-1">
              {location.isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </span>
          )}
          <MapPin className="w-4 h-4 text-gray-400 mr-2" />
          <span className="flex-1 text-sm font-medium text-gray-900">{location.name}</span>
          {location.items && location.items.length > 0 && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {location.items.length}
            </span>
          )}
        </button>
        {location.isExpanded && location.children && renderLocationTree(location.children, level + 1)}
        {location.isExpanded && location.items && location.items.length > 0 && (
          <ExpandedItemsList items={location.items} level={level + 1} />
        )}
      </div>
    ));
  };

  const ExpandedItemsList = ({ items, level }: { items: Item[], level: number }) => {
    const [medicines, setMedicines] = useState<Map<string, Medicine>>(new Map());

    useEffect(() => {
      const loadMedicines = async () => {
        const medicineMap = new Map<string, Medicine>();
        for (const item of items) {
          const medicine = await db.medicines.get(item.medicineId);
          if (medicine) {
            medicineMap.set(item.medicineId, medicine);
          }
        }
        setMedicines(medicineMap);
      };
      loadMedicines();
    }, [items]);

    return (
      <div style={{ paddingLeft: `${level * 24 + 12}px` }} className="bg-gray-50">
        {items.map(item => {
          const medicine = medicines.get(item.medicineId);
          const medicineName = medicine?.name || 'Loading...';
          
          return (
            <div key={item.id} className="px-3 py-2 text-sm text-gray-600 border-l-2 border-gray-200">
              <Package className="w-3 h-3 inline mr-2 text-gray-400" />
              {medicineName}
              <span className="ml-2 text-xs text-gray-400">({item.status})</span>
            </div>
          );
        })}
      </div>
    );
  };

  const getLocationPath = (location: LocationWithItems): string => {
    const path: string[] = [];
    let current = location;
    
    // For base level, just show the description instead of name
    if (location.type === 'base') {
      return location.description || location.name;
    }
    
    path.unshift(location.name);
    
    while (current.parentId) {
      const parent = findLocationById(locations, current.parentId);
      if (parent) {
        // Skip adding parent name if it's the base and current is its direct child
        if (!(parent.type === 'base' && path.length === 1)) {
          path.unshift(parent.name);
        }
        current = parent;
      } else {
        break;
      }
    }
    
    return path.join(' › ');
  };

  const findLocationById = (locs: LocationWithItems[], id: string): LocationWithItems | null => {
    for (const loc of locs) {
      if (loc.id === id) return loc;
      if (loc.children) {
        const found = findLocationById(loc.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Briefcase className="w-12 h-12 text-primary-500 mx-auto mb-2 animate-pulse" />
          <p className="text-gray-600">Loading kits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Locations</h3>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <Plus className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {renderLocationTree(locations)}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedLocation ? (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedLocation.type === 'base' ? selectedLocation.description : selectedLocation.name}
                    </h2>
                    {selectedLocation.type !== 'base' && (
                      <p className="text-sm text-gray-500 mt-1">{getLocationPath(selectedLocation)}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 text-xs rounded-full ${
                      selectedLocation.type === 'vehicle' ? 'bg-blue-100 text-blue-800' :
                      selectedLocation.type === 'kit' ? 'bg-green-100 text-green-800' :
                      selectedLocation.type === 'pouch' ? 'bg-purple-100 text-purple-800' :
                      selectedLocation.type === 'storage' ? 'bg-orange-100 text-orange-800' :
                      selectedLocation.type === 'cabinet' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedLocation.type}
                    </span>
                  </div>
                </div>
                {selectedLocation.description && selectedLocation.type !== 'base' && (
                  <p className="text-sm text-gray-600 mt-2">{selectedLocation.description}</p>
                )}
              </div>

              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Items in this location</h3>
                  <button className="flex items-center px-3 py-1 text-sm bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Item
                  </button>
                </div>

                {itemDetails && itemDetails.length > 0 ? (
                  <div className="space-y-3">
                    {itemDetails.map((detail) => (
                      <div key={detail.item.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{detail.medicine?.name || 'Unknown Medicine'}</p>
                            <p className="text-sm text-gray-500">
                              Batch: {detail.batch?.lotNumber || 'N/A'} | 
                              Expires: {detail.batch?.expiryDate ? new Date(detail.batch.expiryDate).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              {detail.batch?.quantity || 0} units
                            </p>
                            <p className="text-sm text-gray-500">{detail.item.status}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No items in this location</p>
                    <button className="mt-3 text-primary-600 hover:text-primary-700 text-sm font-medium">
                      Add first item
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-8">
              <div className="text-center">
                <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Select a location to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
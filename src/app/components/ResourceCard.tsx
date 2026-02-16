import { useNavigate } from 'react-router';
import { MapPin, Users, Wifi, Monitor, Phone, Coffee, Printer } from 'lucide-react';
import { Resource } from '@/hooks/useResources';

interface ResourceCardProps {
  resource: Resource;
}

// Helper functions
const getOccupancyPercentage = (resource: Resource): number => {
  return Math.round((resource.currentOccupancy / resource.capacity) * 100);
};

const getAvailabilityStatus = (resource: Resource): 'available' | 'busy' | 'full' => {
  const percentage = getOccupancyPercentage(resource);
  if (percentage === 100) return 'full';
  if (percentage >= 70) return 'busy';
  return 'available';
};

export function ResourceCard({ resource }: ResourceCardProps) {
  const navigate = useNavigate();
  const percentage = getOccupancyPercentage(resource);
  const status = getAvailabilityStatus(resource);

  const statusConfig = {
    available: {
      color: 'bg-green-500',
      text: 'Available',
      textColor: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    busy: {
      color: 'bg-yellow-500',
      text: 'Busy',
      textColor: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    full: {
      color: 'bg-red-500',
      text: 'Full',
      textColor: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    }
  };

  const config = statusConfig[status];

  const getFeatureIcon = (feature: string) => {
    if (feature.toLowerCase().includes('tv') || feature.toLowerCase().includes('display')) {
      return <Monitor className="w-4 h-4" />;
    }
    if (feature.toLowerCase().includes('phone')) {
      return <Phone className="w-4 h-4" />;
    }
    if (feature.toLowerCase().includes('coffee')) {
      return <Coffee className="w-4 h-4" />;
    }
    if (feature.toLowerCase().includes('print')) {
      return <Printer className="w-4 h-4" />;
    }
    return <Wifi className="w-4 h-4" />;
  };

  return (
    <div
      onClick={() => navigate(`/resource/${resource.id}`)}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={resource.imageUrl}
          alt={resource.name}
          className="w-full h-full object-cover"
        />
        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full border ${config.bgColor} ${config.borderColor} backdrop-blur-sm`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${config.color} animate-pulse`}></div>
            <span className={`text-sm font-medium ${config.textColor}`}>{config.text}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1">{resource.name}</h3>
        
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <MapPin className="w-4 h-4" />
          <span>{resource.building} · {resource.floor}</span>
        </div>

        {/* Occupancy Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600 flex items-center gap-1">
              <Users className="w-4 h-4" />
              Occupancy
            </span>
            <span className="font-medium text-gray-900">
              {resource.currentOccupancy}/{resource.capacity}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all ${
                percentage === 100
                  ? 'bg-red-500'
                  : percentage >= 70
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-2">
          {resource.features.slice(0, 3).map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-md text-xs text-gray-600"
            >
              {getFeatureIcon(feature)}
              <span>{feature}</span>
            </div>
          ))}
          {resource.features.length > 3 && (
            <div className="px-2 py-1 bg-gray-50 rounded-md text-xs text-gray-600">
              +{resource.features.length - 3} more
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
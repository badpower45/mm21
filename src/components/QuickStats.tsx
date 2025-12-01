import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface QuickStatsProps {
  label: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  valueColor?: string;
}

export default function QuickStats({ 
  label, 
  value, 
  change, 
  icon,
  valueColor = 'text-gray-900' 
}: QuickStatsProps) {
  const getTrendIcon = () => {
    if (!change) return null;
    if (change > 0) return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-3 w-3 text-red-600" />;
    return <Minus className="h-3 w-3 text-gray-400" />;
  };

  const getTrendColor = () => {
    if (!change) return 'bg-gray-100 text-gray-600';
    if (change > 0) return 'bg-green-100 text-green-600';
    if (change < 0) return 'bg-red-100 text-red-600';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-[#0B69FF]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-600">{label}</span>
          {icon && <div className="text-[#0B69FF] bg-blue-50 p-2 rounded-lg">{icon}</div>}
        </div>
        <div className="flex items-end justify-between">
          <div className={`text-3xl ${valueColor}`}>{value}</div>
          {change !== undefined && (
            <Badge variant="secondary" className={`${getTrendColor()} flex items-center gap-1 px-2 py-1`}>
              {getTrendIcon()}
              <span className="text-xs">
                {Math.abs(change)}%
              </span>
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
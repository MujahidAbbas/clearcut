import { type ReactNode } from 'react';

interface FeatureCardProps {
  icon: ReactNode;
  iconBg: string;
  title: string;
  description: string;
}

export default function FeatureCard({
  icon,
  iconBg,
  title,
  description,
}: FeatureCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      {/* Icon */}
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-4"
        style={{ backgroundColor: iconBg }}
      >
        {icon}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>

      {/* Description */}
      <p className="text-gray-text text-sm leading-relaxed">{description}</p>
    </div>
  );
}

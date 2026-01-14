import { Icon } from '@iconify/react';
import Container from '../ui/Container';
import FeatureCard from './FeatureCard';

const features = [
  {
    icon: <Icon icon="lucide:lock" className="w-7 h-7 text-indigo-600" />,
    iconBg: '#E8E8FF',
    title: '100% On-Device Privacy',
    description:
      'Unlike other tools, Clearcut never uploads your photos to a server. The AI models run directly in your browser, keeping your data completely offline and secure.',
  },
  {
    icon: <Icon icon="lucide:zap" className="w-7 h-7 text-amber-500" />,
    iconBg: '#FFEFD8',
    title: 'Instant Processing',
    description:
      'No waiting in queues or processing delays. Get your isolated subjects in milliseconds with high-performance WASM inference.',
  },
  {
    icon: <Icon icon="lucide:sparkles" className="w-7 h-7 text-indigo-600" />,
    iconBg: '#E8E8FF',
    title: 'Studio-Grade Extraction',
    description:
      'Handles fine details like hair and transparent objects with precision. Pro-level results without the pro price tag.',
  },
  {
    icon: <Icon icon="lucide:download" className="w-7 h-7 text-emerald-600" />,
    iconBg: '#D4F4E8',
    title: 'Unlimited High-Res Exports',
    description:
      "We don't limit your resolution or daily usage. Process as many images as you need, at full resolution, for absolutely zero cost.",
  },
];

export default function FeaturesGrid() {
  return (
    <section id="features" className="py-20">
      <Container>
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Engineered for{' '}
            <span className="text-primary">precision.</span>
          </h2>
          <p className="text-gray-text max-w-2xl mx-auto">
            Clearcut combines cutting-edge AI with browser-native performance
            to give you a tool that's as fast as it is private.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </Container>
    </section>
  );
}

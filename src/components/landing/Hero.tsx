import Container from '../ui/Container';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export default function Hero() {
  return (
    <section className="pt-32 pb-20 px-6">
      <Container className="text-center">
        {/* Badge */}
        <Badge className="mb-6">AI-Powered & 100% Private</Badge>

        {/* Heading */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
          Professional
          <br />
          <span className="text-primary">background removal</span>
        </h1>

        {/* Subheading */}
        <p className="text-lg md:text-xl text-gray-text max-w-2xl mx-auto mb-10">
          Get studio-quality results in seconds. Powerful AI-based background
          remover running entirely in your browser. Unlimited use, no accounts,
          and 100% free.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/remove">
            <Button variant="primary" size="lg">
              Remove background →
            </Button>
          </a>
          <a href="#demo">
            <Button variant="secondary" size="lg">
              See how it works
            </Button>
          </a>
        </div>

        {/* Scroll indicator */}
        <div className="mt-16 text-gray-400 animate-bounce">
          <p className="text-sm mb-2">See the magic</p>
          <span className="text-2xl">↓</span>
        </div>
      </Container>
    </section>
  );
}

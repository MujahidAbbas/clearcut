import Container from '../ui/Container';
import Button from '../ui/Button';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100">
      <Container>
        <nav className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 text-xl font-bold">
            <span className="text-2xl">🎨</span>
            <span>Clearcut</span>
          </a>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Features
            </a>
            <a
              href="https://ko-fi.com/clearcut"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <span>❤️</span>
              Donate
            </a>
          </div>

          {/* CTA */}
          <a href="/remove">
            <Button variant="primary" size="sm">
              Get started
            </Button>
          </a>
        </nav>
      </Container>
    </header>
  );
}

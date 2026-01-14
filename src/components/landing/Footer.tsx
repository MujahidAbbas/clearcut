import Container from '../ui/Container';

export default function Footer() {
  return (
    <footer className="bg-gray-50 py-16 border-t border-gray-100">
      <Container>
        <div className="grid md:grid-cols-2 gap-12 mb-12">
          {/* Brand */}
          <div>
            <a href="/" className="flex items-center gap-2 text-xl font-bold mb-4">
              <span className="text-2xl">🎨</span>
              <span>Clearcut</span>
            </a>
            <p className="text-gray-text max-w-sm">
              Professional-grade background removal. 100% local, 100% private,
              and completely free.
            </p>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/privacy"
                  className="text-gray-text hover:text-gray-900 transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  className="text-gray-text hover:text-gray-900 transition-colors"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-gray-200 text-center text-gray-text text-sm">
          © 2026 Clearcut. All rights reserved.
        </div>
      </Container>
    </footer>
  );
}

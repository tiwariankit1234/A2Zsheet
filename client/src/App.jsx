import { Link, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import { ErrorState, Spinner } from './components/ui';
import { useAuth } from './context/AuthContext';
import { SheetProvider } from './context/SheetContext';
import useTheme from './hooks/useTheme';
import SheetPage from './pages/SheetPage';
import BookmarksPage from './pages/BookmarksPage';
import AccountPage from './pages/AccountPage';
import AboutPage from './pages/AboutPage';
import AboutMePage from './pages/AboutMePage';

function NotFound() {
  return (
    <div className="py-16 text-center">
      <p className="text-lg font-semibold">Page not found</p>
      <Link to="/" className="mt-2 inline-block text-brand-700 underline dark:text-brand-500">
        Back to the sheet
      </Link>
    </div>
  );
}

export default function App() {
  const { theme, toggle } = useTheme();
  const { status, error, retry } = useAuth();

  return (
    <div className="min-h-screen">
      <Navbar theme={theme} onToggleTheme={toggle} />
      <main className="mx-auto max-w-6xl px-4 py-6 pb-24">
        {status === 'loading' && <Spinner label="Connecting…" />}
        {status === 'error' && <ErrorState title="Cannot connect to the API" message={error} onRetry={retry} />}
        {status === 'ready' && (
          <SheetProvider>
            <Routes>
              <Route path="/" element={<SheetPage />} />
              <Route path="/bookmarks" element={<BookmarksPage />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/about" element={<AboutMePage />} />
              <Route path="/data-notes" element={<AboutPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SheetProvider>
        )}
      </main>
    </div>
  );
}

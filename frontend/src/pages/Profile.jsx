import { Navigate } from 'react-router-dom';

/**
 * Profile functionality has been migrated to Settings.
 * This component cleanly redirects any remaining requests to /settings.
 */
export default function Profile() {
  return <Navigate to="/settings" replace />;
}

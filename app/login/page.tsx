import Login from '@/components/Login';
import { Suspense } from 'react';


export default function LoginPage() {
  return (
    <div className="px-4">
      <Suspense fallback={<p>Loading login form...</p>}>
        <Login />
      </Suspense>
    </div>
  );
}

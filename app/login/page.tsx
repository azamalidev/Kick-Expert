import Login from '@/components/Login';
import { Suspense } from 'react';


export default function LoginPage() {
  return (
    <div className="">
      <Suspense >
        <Login />
      </Suspense>
    </div>
  );
}

import { routes } from "@/constants/routes";

export default function CheckoutSuccessPage() {
  return (
    <div className="p-10 text-center">
      <h1 className="text-3xl font-bold text-green-600">Payment Successful 🎉</h1>
      <p>Your registration is confirmed!</p>
      <a
        href={routes.dashboard}
        className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg"
      >
        Go to Dashboard
      </a>
    </div>
  );
}

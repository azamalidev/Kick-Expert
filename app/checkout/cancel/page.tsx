import { routes } from "@/constants/routes";

export default function CheckoutCancelPage() {
  return (
    <div className="p-10 text-center">
      <h1 className="text-3xl font-bold text-red-600">Payment Cancelled ❌</h1>
      <p>Your payment was not completed.</p>
      <a
        href="/livecompetition"
        className="mt-6 inline-block px-6 py-3 bg-gray-600 text-white rounded-lg"
      >
        Back to Leagues
      </a>
    </div>
  );
}

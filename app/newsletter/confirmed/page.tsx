export default function ConfirmedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-6">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-lime-50 flex items-center justify-center mb-6">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17l-5-5" stroke="#65a30d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold mb-2">You're all set!</h1>
        <p className="text-gray-600 mb-6">Thanks for confirming your subscription. We'll send the best tips, previews and occasional offers your way.</p>

        <a href="/" className="inline-block px-6 py-2 bg-lime-500 hover:bg-lime-600 text-white rounded-full font-medium">Back to KickExpert</a>
      </div>
    </div>
  );
}

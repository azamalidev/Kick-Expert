import Image from "next/image"

export default function Policy() {
  return (
    <section className="relative w-full  mt-14  h-64 sm:h-80 lg:h-96 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image src="/images/image10.png" alt="Terms and Conditions Background" fill className="object-cover" priority />
      </div>

      {/* Text Overlay */}
      <div className="relative z-10 flex flex-col justify-center h-full px-6 sm:px-12 lg:px-16">
        <div className="max-w-2xl">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-4">
            <span className="text-lime-400">Kick</span>
            <span className="text-white">Expert</span>
          </h1>
          <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-2 sm:mb-4">
            Terms & Conditions
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-white/90">We value your privacy</p>
        </div>
      </div>
    </section>
  )
}

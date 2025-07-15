"use client"
import Image from "next/image"

export default function AboutSection() {
  return (
    <section className="py-5 sm:py-16 lg:py-20 bg-gray-50 mx-4 sm:mx-8 lg:mx-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* About Us Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="relative inline-block">
            <h2 className="text-6xl md:text-8xl font-extrabold mt-2 bg-gradient-to-b from-green-900 to-lime-400 text-transparent bg-clip-text">ABOUT US</h2>
            {/* Green underline accent */}
              <div className="flex justify-center mt-2">
    <Image
      src="/images/image13.png"
      alt="About Banner"
      width={800}
      height={80}
      className="object-contain"
    />
  </div>
          </div>

          <p className="mt-8 text-lg sm:text-xl lg:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            The EuroLeague Finals Top Scorer is the individual award for the player that gained the highest points in
            the EuroLeague Finals
          </p>

          <button className="mt-8 inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-lime-500 hover:bg-lime-600 text-white font-semibold text-sm sm:text-base rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-lime-300">
            CONTINUE READING
          </button>
        </div>

        {/* Our Mission Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            {/* Mission Header with Decorative Element */}
            <div className="flex items-center space-x-4">
              {/* Green Spiral Decoration - positioned next to title */}
              <div className="flex-shrink-0 w-16 h-20 sm:w-20 sm:h-24 -mt-12 left-20 relative">
                <Image src="/images/image2.png" alt="Decorative Spiral" fill className="object-contain" />
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">Our Mission</h3>
            </div>

            {/* Mission Text */}
            <div className="text-gray-600 text-base sm:text-lg leading-relaxed space-y-4">
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Lorem facilisis egestas varius consequat massa
                quis. Nisl orci sed elementum lobortis viverra egestas. Quam sed elementum augue sed semper. Eget
                convallis pellentesque tortor, urna. Venenatis tincidunt duis nunc, aliquam augue velit. At aliquam
                mauris mollis fames viverra volutpat cursus et pharetra.
              </p>
              <p>
                Non vulputate placerat in eget elementum. Sagittis eget consectetur dui faucibus. Vestibulum nunc eu
                neque sed eget tincidunt platea. Velit gravida adipiscing et Elementum at pretium morbi sem tincidunt.
                Euismod amet leo,
              </p>
            </div>
          </div>

          {/* Right Image */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96">
              {/* Large Green Circle Background */}

              {/* Soccer Ball Icon - centered in the circle */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-60 h-60 sm:w-80 sm:h-80 lg:w-70 lg:h-70">
                  <Image src="/images/image9.png" alt="Soccer Ball" fill className="object-contain" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

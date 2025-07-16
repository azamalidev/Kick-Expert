"use client"
import Image from "next/image"
import Link from "next/link"


export default function AboutSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-1/3 h-full bg-green-50 opacity-20 transform -skew-x-12 -translate-x-1/4" />
      <div className="absolute bottom-0 right-0 w-1/3 h-1/2 bg-lime-50 opacity-20 transform skew-x-12 translate-x-1/4" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-18 lg:py-18 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="inline-block relative">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-900 mb-6">
              About <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-lime-400">KickExpert</span>
            </h1>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-green-400 to-lime-300 rounded-full" />
          </div>
          
          <p className="mt-8 text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
            Football knowledge deserves its own space. We built this platform to turn passion into action and knowledge into impact.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-4 bg-green-100 px-6 py-3 rounded-full">
              <div className="w-8 h-8 relative">
                <Image src="/images/soccer-icon.png" alt="Football" fill className="object-contain" />
              </div>
              <span className="text-lg font-semibold text-green-800">Why We Exist</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
              Football is rich with stories, history, tactics, and moments
            </h2>
            
            <div className="space-y-6 text-gray-600 text-lg">
              <p>
                We wanted to create something different: a space where fans could engage with the game in a deeper way, beyond highlight reels or hot takes.
              </p>
              <p>
                KickExpert was made to help you think, learn, and compete all in one place. No luck. No gimmicks. Just real knowledge, rewarded.
              </p>
            </div>
          </div>
          
          <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
            <Image 
              src="/images/football-tactics.jpg" 
              alt="Football tactics" 
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 to-gray-900/20" />
            <div className="absolute bottom-0 left-0 p-8 text-white">
              <p className="text-xl font-medium">"For the ones who know the squads, remember the stats, and still debate that semi-final in their head."</p>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-24">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-12">What We Stand For</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Skill over shortcuts",
                description: "We reward deep knowledge and understanding of the game",
                icon: "🎯"
              },
              {
                title: "Honesty over hype",
                description: "No sensationalism, just genuine football insight",
                icon: "🔍"
              },
              {
                title: "Learning over luck",
                description: "Grow your football IQ through meaningful challenges",
                icon: "🧠"
              }
            ].map((item, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h4>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Story Section */}
        <div className="relative bg-gray-900 rounded-3xl overflow-hidden mb-24">
          <div className="absolute inset-0 bg-[url('/images/texture.png')] opacity-10" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="p-12 text-white">
              <h3 className="text-3xl font-bold mb-6">From one fan to another</h3>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                KickExpert started as a simple idea from someone who's loved the game for as long as they can remember.
              </p>
              <p className="text-gray-300 text-lg leading-relaxed">
                It wasn't built in a boardroom. It came from curiosity, late nights, and the belief that football fans deserve more than just content to scroll through.
              </p>
            </div>
            <div className="h-96 relative">
              <Image 
                src="/images/slide7.jpg" 
                alt="Football fan" 
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="inline-block bg-gradient-to-r from-green-500 to-lime-400 p-1 rounded-full mb-8">
            <div className="bg-white px-6 py-2 rounded-full text-sm font-semibold text-gray-800">
              Ready to level up?
            </div>
          </div>
          
          <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            Learn. Play. Improve.
          </h3>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            You don't need to be an expert to start. You just need the curiosity to ask and the confidence to try.
          </p>
          <Link href={'/livecompetition'}>
          <button className="relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-lime-500 text-white font-bold text-lg rounded-full overflow-hidden group">
            <span className="relative z-10">Join KickExpert Now</span>
            <span className="absolute inset-0 bg-gradient-to-r from-green-700 to-lime-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0" />
          </button></Link>
          
          <p className="mt-8 text-gray-500">
            We're just getting started. If you care about the details, you're in the right place.
          </p>
        </div>
      </div>
    </section>
  )
}
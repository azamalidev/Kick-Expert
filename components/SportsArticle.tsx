"use client";
import Image from "next/image";
import Link from "next/link";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { useState, useEffect } from "react";

export const articles = [
  {
    id: 1,
    category: "Football History",
    image: "/images/football_history1.jpg",
    authorImage: "/images/image6.png",
    author: "James Wilson",
    date: "15 March 2023",
    title: "The Birth of Modern Football: From England to the World",
    desc: "Tracing the origins of football in 19th-century England, where the sport was formalized, leading to the global phenomenon we know today.",
    paragraphs: [
      "The modern game of football has its roots in medieval ball games played throughout Europe, but it was in 19th-century England that the sport was formally organized. The first standardized rules were established in 1863 with the formation of The Football Association in London. This marked a pivotal moment when football began to distinguish itself from rugby and other similar games.",
      "As the industrial revolution progressed, football became increasingly popular among the working classes. Factory workers needed recreational activities, and football's simple requirements - just a ball and some open space - made it accessible to everyone. The establishment of the Football League in 1888 created the world's first organized league competition, setting the template for professional football worldwide.",
      "The British Empire played a crucial role in spreading football globally. British sailors, traders, and workers introduced the game to ports and cities around the world. By the early 20th century, football had taken root in South America, continental Europe, and other regions, each developing their own distinctive styles of play while maintaining the fundamental rules established in England."
    ]
  },
  {
    id: 2,
    category: "Football",
    image: "/images/football_match1.jpg",
    authorImage: "/images/testimonial1.png",
    author: "Emma Davis",
    date: "20 April 2023",
    title: "Epic Comebacks in UEFA Champions League History",
    desc: "Reliving the most thrilling comebacks in Champions League history, including Liverpool's miracle in Istanbul.",
    paragraphs: [
      "The UEFA Champions League has witnessed some of the most dramatic comebacks in football history. Perhaps none more famous than Liverpool's miraculous recovery in the 2005 final against AC Milan. Trailing 3-0 at halftime, Liverpool staged an unbelievable second-half comeback to level the score 3-3, eventually winning on penalties. This match, now known as the 'Miracle of Istanbul,' redefined what was possible in football.",
      "Another unforgettable comeback occurred in 2019 when Liverpool overturned a 3-0 first-leg deficit against Barcelona in the semifinals. Without several key players, Liverpool produced a stunning 4-0 victory at Anfield, with Divock Origi and Georginio Wijnaldum both scoring twice. This remarkable turnaround demonstrated the power of belief and the unique atmosphere of European nights at Anfield.",
      "Manchester United's 1999 final victory over Bayern Munich remains one of the most dramatic last-minute turnarounds in football history. Trailing 1-0 as the match entered injury time, United scored twice in quick succession through Teddy Sheringham and Ole Gunnar Solskjær to complete an improbable treble-winning season. These moments remind us why the Champions League is considered the pinnacle of club football."
    ]
  },
  {
    id: 3,
    category: "Football Questions",
    image: "/images/football_quiz1.jpg",
    authorImage: "/images/testimonial2.png",
    author: "Michael Brown",
    date: "10 May 2023",
    title: "Test Your Knowledge: Ultimate Football Trivia Challenge",
    desc: "A deep dive into football trivia, covering iconic players, historic matches, and record-breaking moments.",
    paragraphs: [
      "Football history is filled with fascinating trivia that tests even the most knowledgeable fans. Did you know that the fastest goal in World Cup history was scored by Hakan Şükür of Turkey after just 11 seconds against South Korea in 2002? Or that Cristiano Ronaldo holds the record for most goals in the Champions League with 140 goals (as of 2023)? These records showcase the incredible achievements possible in football.",
      "Some trivia questions delve into the unusual aspects of the game. For instance, which player has won the most World Cup matches without ever winning the tournament itself? The answer is Miroslav Klose of Germany, who won 17 World Cup matches before finally winning the tournament in 2014. Another interesting fact: the World Cup trophy was hidden in a shoebox under a bed during World War II to prevent it from being stolen by Nazi soldiers.",
      "Club football also offers plenty of trivia material. Real Madrid's 5 consecutive European Cup wins from 1956-1960 remains unmatched. In England, Arsenal's 'Invincibles' went an entire Premier League season unbeaten in 2003-04. These achievements and many more form the rich tapestry of football history that makes trivia so engaging for fans worldwide."
    ]
  },
  {
    id: 4,
    category: "Football History",
    image: "/images/football_history2.jpg",
    authorImage: "/images/testimonial3.png",
    author: "James Wilson",
    date: "25 June 2023",
    title: "The Evolution of the World Cup: 1930 to 2022",
    desc: "Exploring how the FIFA World Cup transformed from a small tournament to the world's biggest sporting event.",
    paragraphs: [
      "The inaugural FIFA World Cup in 1930 was a far cry from today's global spectacle. Held in Uruguay with just 13 teams (all invited, no qualifications), the tournament was won by the hosts. The Jules Rimet trophy, named after the FIFA president who initiated the competition, would be contested until 1970. The early tournaments were marked by long sea voyages for European teams and political controversies that sometimes overshadowed the football.",
      "The World Cup grew steadily through the mid-20th century, with television coverage in the 1950s and 1960s bringing the tournament to global audiences. The 1970 tournament in Mexico introduced color TV broadcasts and innovations like substitutions and yellow/red cards. The 1982 expansion to 24 teams (later 32 in 1998) reflected football's growing worldwide popularity and gave more nations the chance to compete on the biggest stage.",
      "Recent World Cups have broken viewership records while facing new challenges. The 2022 Qatar World Cup was the first held in winter and in an Arab country, highlighting FIFA's efforts to globalize the sport. Despite controversies, the World Cup remains football's ultimate prize, with the 2026 edition set to feature 48 teams across three North American countries, marking another evolutionary step for this historic tournament."
    ]
  },
  {
    id: 5,
    category: "Football",
    image: "/images/LionelMessi.jpg",
    authorImage: "/images/testimonial4.png",
    author: "Emma Davis",
    date: "05 July 2023",
    title: "Lionel Messi's Legacy: Breaking Records in 2023",
    desc: "A look at Messi's incredible 2023 season, including his impact on and off the pitch.",
    paragraphs: [
      "Lionel Messi's 2023 season cemented his status as one of football's all-time greats. After leading Argentina to World Cup glory in Qatar (2022), Messi continued breaking records with Paris Saint-Germain before moving to Inter Miami. His World Cup victory filled the last major gap in his trophy cabinet, completing a career that had already included numerous Ballon d'Or awards and Champions League titles with Barcelona.",
      "Statistically, Messi's 2022-23 season was remarkable. He became the first player to score in every stage of the World Cup (group stage through final) since the knockout format began in 1986. At club level, he surpassed 800 career goals and became the most decorated footballer in history with 43 trophies. Even at 35, Messi demonstrated the dribbling, vision, and finishing that have defined his career.",
      "Beyond statistics, Messi's impact on football culture is immeasurable. His move to MLS brought unprecedented attention to North American soccer, with ticket prices soaring and jersey sales breaking records. Young players worldwide continue to model their game after Messi, proving that technical ability and intelligence can triumph over physicality. As Messi's career enters its twilight, his influence on the sport will be felt for generations"
    ]
  },
  {
    id: 6,
    category: "Football Questions",
    image: "/images/football_quiz2.jpg",
    authorImage: "/images/testimonial1.png",
    author: "Michael Brown",
    date: "12 August 2023",
    title: "Who's the GOAT? Debating Football's Greatest Players",
    desc: "A fun exploration of the greatest footballers of all time, with questions to spark debate among fans.",
    paragraphs: [
      "The debate over football's Greatest of All Time (GOAT) is one that sparks passionate arguments among fans worldwide. Traditional contenders include Pelé, who won three World Cups with Brazil; Diego Maradona, whose 1986 World Cup performance is legendary; and modern stars Lionel Messi and Cristiano Ronaldo, who have dominated the Ballon d'Or awards for over a decade. Each brings unique qualities to the debate - Pelé's trophy haul, Maradona's single-handed dominance, and the sustained excellence of Messi and Ronaldo.",
      "Comparing across eras presents challenges. Older players competed in different conditions - heavier balls, worse pitches, more physical defending. Modern players benefit from sports science, nutrition, and rule changes that protect attackers. Some argue that Alfredo Di Stéfano (Real Madrid's 1950s star) or Johan Cruyff (architect of Total Football) deserve consideration. The debate often reflects what we value most in football - pure skill, trophies, longevity, or transformative impact on the game.",
      "Perhaps the GOAT debate is ultimately unanswerable, but that's what makes it compelling. Football has seen so many extraordinary talents across different positions and eras that comparing them directly may be impossible. Instead of seeking one definitive answer, we can appreciate how each great player has contributed to football's rich history and inspired generations of fans and players worldwide"
    ]
  },
  {
    id: 7,
    category: "Football Tactics",
    image: "/images/football_tactics1.jpg",
    authorImage: "/images/testimonial2.png",
    author: "Sophie Clark",
    date: "10 September 2023",
    title: "The Rise of Tiki-Taka: Barcelona's Revolutionary Style",
    desc: "How Barcelona's tiki-taka philosophy redefined modern football with possession and precision.",
    paragraphs: [
      "Tiki-taka, the possession-based style of play, became synonymous with Barcelona's dominance in the late 2000s and early 2010s. Pioneered by manager Pep Guardiola and inspired by Johan Cruyff's Total Football, tiki-taka emphasized short passes, constant movement, and maintaining control of the ball to exhaust opponents.",
      "The style reached its peak during Barcelona's 2008-2012 era, with players like Xavi, Iniesta, and Messi orchestrating play with unparalleled precision. The 2011 Champions League final against Manchester United showcased tiki-taka at its best, as Barcelona dominated possession and won 3-1. This approach not only won titles but also influenced global football tactics.",
      "While critics argue tiki-taka can be predictable or overly reliant on exceptional players, its legacy is undeniable. It inspired national teams like Spain, who won the 2010 World Cup using similar principles. Today, variations of tiki-taka continue to influence clubs worldwide, proving that possession can be a powerful weapon in football."
    ]
  },
  {
    id: 8,
    category: "Football",
    image: "/images/womens_football.jpg",
     authorImage: "/images/testimonial1.png",
    author: "Emma Davis",
    date: "15 October 2023",
    title: "The Growth of Women's Football: A Global Revolution",
    desc: "Exploring the rapid rise of women's football and its impact on the sport's global landscape.",
    paragraphs: [
      "Women's football has seen exponential growth in recent years, with record-breaking viewership and investment. The 2023 FIFA Women's World Cup, co-hosted by Australia and New Zealand, drew over 2 billion viewers, showcasing the sport's growing popularity. Teams like the United States, England, and Spain have led the charge with professional leagues and grassroots development.",
      "The rise of stars like Alexia Putellas, Sam Kerr, and Ada Hegerberg has brought mainstream attention to the women's game. These players combine technical skill with athleticism, challenging stereotypes and inspiring a new generation. Off the pitch, campaigns for equal pay and better facilities have gained traction, with federations slowly addressing longstanding disparities.",
      "Clubs like Barcelona and Lyon have set the standard in women's football, dominating the UEFA Women's Champions League. As investment continues to grow, the gap between men's and women's football is narrowing, promising a future where the sport is truly inclusive and celebrated worldwide."
    ]
  },
  {
    id: 9,
    category: "Football History",
    image: "/images/football_rivalries.jpg",
    authorImage: "/images/testimonial1.png",
    author: "James Wilson",
    date: "20 November 2023",
    title: "Iconic Football Rivalries: Passion and Drama on the Pitch",
    desc: "A look at the fiercest rivalries in football history, from El Clásico to the Manchester Derby.",
    paragraphs: [
      "Football rivalries are the heartbeat of the sport, fueling passion and drama. El Clásico, between Real Madrid and Barcelona, is perhaps the most famous, with political, cultural, and sporting tensions dating back decades. Matches between these giants often decide La Liga titles and showcase stars like Ronaldo and Messi at their peak.",
      "In England, the Manchester Derby between United and City has grown fiercer with City's rise under Pep Guardiola. The North West Derby, pitting Liverpool against Manchester United, carries a historic weight, with both clubs vying for supremacy in English football. These matches are about more than points—they're about pride and identity.",
      "Globally, rivalries like Boca Juniors vs. River Plate in Argentina or Celtic vs. Rangers in Scotland bring cities to a standstill. These contests transcend sport, reflecting deep cultural divides. Whether it's local bragging rights or global attention, football rivalries continue to captivate fans with their intensity and history."
    ]
  }
];

const testimonials = [
  {
    id: 1,
    image: "/images/testimonial1.png",
    quote: "This site is a treasure trove for football fans! The history section is so detailed and engaging.",
    author: "Mike Taylor",
    location: "Lahore, Pakistan",
    reference: "Chris Thomas, Football Historian",
  },
  {
    id: 2,
    image: "/images/testimonial2.png",
    quote: "The football quizzes are challenging and fun! Perfect for any football enthusiast.",
    author: "Piaq Wilmos",
    location: "Warsaw, Poland",
    reference: "Otto Redford, Sports Blogger",
  },
  {
    id: 3,
    image: "/images/testimonial3.png",
    quote: "I love the in-depth articles about football's greatest moments. A must-visit for fans!",
    author: "Michael Brown",
    location: "New York, USA",
    reference: "Mark Williams, Football Analyst",
  },
];

export default function SportsArticleSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const cardsPerPage = 6; // Show 6 articles (2 rows of 3)
  const totalCards = articles.length;
  const maxIndex = Math.max(0, totalCards - cardsPerPage); // Ensure maxIndex doesn't go negative

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handlePrev = () => {
    if (isTransitioning || currentIndex === 0) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => Math.max(prev - cardsPerPage, 0)); // Move back by 6
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleNext = () => {
    if (isTransitioning || currentIndex >= maxIndex) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => Math.min(prev + cardsPerPage, maxIndex)); // Move forward by 6
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const visibleArticles = articles.slice(currentIndex, currentIndex + cardsPerPage);

  const isLeftDisabled = currentIndex === 0;
  const isRightDisabled = currentIndex >= maxIndex;

  return (
    <section className="px-4 sm:px-10 py-10">
      <h2 className="text-2xl font-semibold mb-8 text-gray-900">Football Articles</h2>

      <div className="relative overflow-hidden">
        <div className={`grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 transition-transform duration-300 ease-in-out`}>
          {visibleArticles.map((item) => (
            <div key={item.id} className="space-y-4 group flex flex-col h-full">
              <div className="relative h-[270px] overflow-hidden rounded-lg flex-shrink-0">
                <Image
                  src={item.image}
                  alt={item.title}
                  width={400}
                  height={300}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute top-3 right-3 bg-black text-white text-xs px-3 py-1 rounded-full">
                  {item.category}
                </span>
              </div>

              <div className="flex flex-col flex-grow">
                <div className="flex items-center space-x-3 text-sm text-gray-600 mb-2">
                  <Image
                    src={item.authorImage}
                    alt={item.author}
                    width={24}
                    height={24}
                    className="rounded-full w-6 h-6 object-cover"
                  />
                  <span>{item.author}</span>
                  <span className="text-gray-500">{item.date}</span>
                </div>

                <h3 className="text-md font-semibold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 mb-4 flex-grow">{item.desc}</p>
                
                <div className="mt-auto">
                  <Link 
                    href={`/articleview?id=${item.id}`} 
                    className="inline-block text-lime-600 hover:text-lime-700 font-medium text-sm transition-colors"
                  >
                    View More →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex gap-4 justify-start">
        <button
          onClick={handlePrev}
          className={`bg-gray-200 hover:bg-gray-300 p-3 px-4 rounded transition-all duration-200 ${isLeftDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
          disabled={isLeftDisabled}
        >
          <FaArrowLeft />
        </button>
        <button
          onClick={handleNext}
          className={`bg-lime-400 hover:bg-lime-500 text-white p-3 px-4 rounded transition-all duration-200 ${isRightDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
          disabled={isRightDisabled}
        >
          <FaArrowRight />
        </button>
      </div>

      <div className="mt-16 px-4 sm:px-10 py-10 bg-zinc-50">
        <div className="text-left flex flex-col md:flex-row justify-between items-start w-full mx-auto max-w-6xl">
          <div className="flex flex-col items-start gap-5 w-full md:w-1/3">
            <p className="text-lime-500 text-xl font-bold">TESTIMONIALS</p>
            <h2 className="text-4xl font-bold text-gray-900 mt-2">What People Say <br /> About Us.</h2>
            <div className="flex items-center mt-4 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${activeTestimonial === index ? 'bg-lime-500 w-6' : 'bg-gray-400'}`}
                  aria-label={`View testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
          
          <div className="mt-8 md:mt-0 w-full md:w-[55%] relative">
            <div className="relative overflow-hidden h-64">
              {testimonials.map((testimonial, index) => (
                <div 
                  key={testimonial.id}
                  className={`absolute top-0 left-0 w-full transition-all duration-500 ease-in-out ${activeTestimonial === index ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}`}
                >
                  <div className="relative bg-white p-6 rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300 h-full">
                    <div className="flex items-start h-full">
                      <Image
                        src={testimonial.image}
                        alt={testimonial.author}
                        width={60}
                        height={60}
                        className="rounded-full mr-4 w-12 h-12 object-cover"
                      />
                      <div className="flex flex-col h-full">
                        <p className="text-gray-600 italic text-sm flex-grow">"{testimonial.quote}"</p>
                        <div>
                          <p className="text-gray-800 font-medium mt-2">{testimonial.author}</p>
                          <p className="text-gray-500 text-xs">{testimonial.location}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-gray-600 text-sm">{testimonial.reference}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

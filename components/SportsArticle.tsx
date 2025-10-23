"use client";
import Image from "next/image";
import Link from "next/link";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { useState, useEffect } from "react";

export const articles = [
  {
    id: 1,
    category: "Football Trivia",
    image: "/images/blog_new1.jpg",
    authorImage: "/images/image6.png",
    author: "Michael Brown",
    date: "10 May 2023",
    title: "🏆 Test Your Knowledge: Ultimate Football Trivia Challenge",
    desc: "Explore fascinating football facts, records, and legendary moments that test even the most devoted fans’ knowledge of the beautiful game.",
    paragraphs: [
      "Football, often called the beautiful game, is more than just a sport — it’s a global phenomenon that unites billions of fans, stirs emotions, and creates unforgettable moments. Beyond the goals, trophies, and rivalries, lies a fascinating world of trivia that challenges even the most passionate supporters. The Ultimate Football Trivia Challenge takes you on a journey through the sport’s most iconic records, surprising facts, and remarkable stories from across decades of play.",
      "Did you know that the fastest goal in World Cup history was scored by Hakan Şükür of Turkey in just 11 seconds against South Korea during the 2002 tournament? Or that Cristiano Ronaldo, one of football’s all-time greats, holds the record for most goals in UEFA Champions League history with 140 goals (as of 2023)? These milestones not only highlight individual brilliance but also represent the evolving legacy of football’s modern era.",
      "Some trivia questions dive into the game’s quirky and lesser-known corners. For instance, which player has won the most World Cup matches without ever lifting the trophy? The answer is Miroslav Klose of Germany — who remarkably won 17 World Cup games before finally tasting victory in 2014. And few know that during World War II, the original World Cup trophy was secretly hidden in a shoebox under a bed by Italian official Ottorino Barassi, protecting it from Nazi confiscation — a story worthy of a spy novel.",
      "The club scene has its own legendary trivia moments. Real Madrid’s domination of European football in the 1950s, winning five consecutive European Cups (1956–1960), remains a record unmatched to this day. In England, Arsenal’s “Invincibles” achieved immortality by going an entire Premier League season unbeaten (2003–04) — a feat that has yet to be replicated in modern times. Meanwhile, clubs like Barcelona, Manchester United, and Bayern Munich continue to inspire generations with their unforgettable performances and iconic players.",
      "Football trivia isn’t just about remembering dates or statistics — it’s about reliving moments of passion, resilience, and genius that define the sport. From the stunning upsets to the legendary goals, from record-breaking streaks to dramatic last-minute winners, every fact tells a story.",
      "So, whether you’re a die-hard fan, a casual viewer, or someone looking to challenge their friends, the Ultimate Football Trivia Challenge is the perfect test of your football knowledge. Step up, take the quiz, and see how well you truly know the game that has captured the hearts of millions across the world."
    ]
  },
  {
    id: 2,
    category: "Football History",
    image: "/images/blog_new2.jpg",
    authorImage: "/images/testimonial1.png",
    author: "James Wilson",
    date: "15 March 2023",
    title: "The Birth of Modern Football: From England to the World",
    desc: "Discover how football evolved from rough street games into a global sport through innovation, industrialization, and international expansion.",
    paragraphs: [
      "The story of modern football is one of transformation — from rough, chaotic street games to a global sport that captivates billions. While versions of ball games existed for centuries across Europe, Asia, and even the Americas, it was in 19th-century England that football took its modern shape. The formation of The Football Association (FA) in London in 1863 marked a revolutionary turning point. For the first time, a set of standardized rules was established, clearly separating football from its close cousin, rugby. This moment laid the foundation for the world’s most popular game.",
      "During the Industrial Revolution, football evolved from a pastime into a social phenomenon. As cities grew and factory life became the norm, workers sought an outlet for recreation and community. Football — requiring only a ball, a bit of space, and a few enthusiastic players — became the perfect solution. It was simple, inclusive, and exhilarating. Local clubs sprang up across England, and in 1888, the creation of The Football League introduced the first-ever structured league competition. This innovation transformed football into a professional sport and inspired similar leagues across the globe.",
      "The spread of football beyond England’s borders was swift and far-reaching. The British Empire, with its vast global connections, acted as the primary vehicle for the game’s expansion. Sailors, merchants, engineers, and soldiers carried the sport to ports and colonies from South America to Asia, and from Africa to continental Europe. What began as an English pastime soon became an international passion.",
      "By the early 20th century, football had taken deep root worldwide. Nations such as Brazil, Argentina, and Uruguay embraced the sport and infused it with creativity, rhythm, and flair, giving rise to a uniquely South American style. Meanwhile, in continental Europe, countries like Italy, Germany, and Spain developed tactical sophistication and disciplined play, shaping football’s diverse global character. Despite cultural variations, the core principles — the rules laid out in 1863 — remained universally respected.",
      "Football’s journey from the muddy fields of Victorian England to packed stadiums across the world is a testament to its universal appeal. It bridges class, culture, and geography — uniting people in a shared love for the game. What started as an organized effort by a few English gentlemen in a London tavern has become a sport that defines nations, creates legends, and connects humanity through passion and play."
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
      ,
      "Trivia questions can also spotlight tactical innovations — the managers and systems behind iconic seasons. Understanding these moments gives fans a clearer view of how the game evolved tactically over decades.",
      "Historic stats often reveal surprising patterns. For example, some clubs succeed in cups but struggle in leagues, and certain players perform particularly well in knockout formats — trivia helps surface these intriguing contrasts.",
      "Collecting trivia encourages learning about lesser-known competitions and eras. Regional tournaments, forgotten cup runs, and amateur legends all contribute to football’s rich mosaic and make for excellent trivia fodder.",
      "Finally, trivia keeps football culture alive between seasons. Quizzes, debates, and listicles fuel engagement and help fans pass down memories, ensuring the sport’s stories remain vibrant and accessible." 
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
      ,
      "Technological advances have transformed the modern World Cup experience both on and off the pitch. From goal-line technology and VAR to advanced broadcast techniques, new tools have improved refereeing accuracy and brought fans closer to the action with immersive coverage.",
      "The expansion of the tournament has also driven debates about quality versus inclusivity. While more teams mean broader global representation and greater opportunity for emerging football nations, some observers worry about fixture congestion and the dilution of competitive balance in the group stages.",
      "Economics and infrastructure have become central to host selection and legacy planning. Recent editions have shown that hosting the World Cup can catalyze major public investments — sometimes sparking long-term benefits, and other times raising questions about cost, sustainability, and long-term usage of facilities.",
      "Despite these shifts, the World Cup continues to generate transcendent moments that define generations — unexpected heroes, national catharses, and dramatic finals that resonate far beyond sport. Its ability to reflect global change while still producing pure football drama is why the tournament endures."
    ]
  },
  {
    id: 5,
    category: "Football",
    image: "/images/LionelMessi.jpg",
    authorImage: "/images/testimonial4.png",
    author: "Emma Davis",
    date: "05 July 2023",
    title: "Lionel Messi’s Legacy: Breaking Records in 2023",
    desc: "A look at Messi's incredible 2023 season, highlighting his impact on and off the pitch as he continues to redefine football greatness.",
    paragraphs: [
      "Few athletes in history have transcended their sport quite like Lionel Messi. His 2023 season did more than add to an already glittering résumé — it solidified his place among the greatest icons in football history. Following his long-awaited World Cup triumph with Argentina in Qatar (2022), Messi’s performances throughout 2023 reminded the world why he remains the gold standard for excellence, consistency, and humility in the beautiful game.",
      "After leading his nation to its third World Cup title, Messi continued to shine with Paris Saint-Germain (PSG), breaking milestones that seemed untouchable. He became the first player to score in every stage of a World Cup — from the group phase all the way to the final — since the knockout format was introduced in 1986. His performances were a masterclass in leadership and artistry, combining technical precision with unmatched football intelligence.",
      "By mid-2023, Messi had crossed the 800-career-goal milestone, joining a select group of legends to achieve such a feat. With a record 43 trophies, he officially became the most decorated footballer in history, surpassing long-time rival Dani Alves. His list of achievements includes 7 Ballon d’Or titles, 4 Champions League trophies, and numerous domestic titles in both Spain and France — yet his hunger to compete and inspire never waned.",
      "But Messi’s story in 2023 was not just about numbers. It was about legacy. His move to Inter Miami in Major League Soccer marked the beginning of a new chapter — one that carried enormous cultural significance. In just weeks, his arrival transformed American soccer: stadiums sold out, ticket prices skyrocketed, viewership hit record highs, and Inter Miami jerseys became global best-sellers. Messi brought a wave of enthusiasm and legitimacy to football in North America, echoing what Pelé did for the sport decades earlier.",
      "Beyond the pitch, Messi’s influence extends to every corner of the footballing world. Young players everywhere study his technique — the way he glides past defenders, his perfect first touch, his composure in front of goal. Coaches use his gameplay as a model for creativity and efficiency. And fans, regardless of allegiance, recognize the humility and professionalism that have made him one of the most beloved figures in sports history.",
      "At 35, Messi continues to redefine longevity and excellence. His career stands as a testament to dedication, discipline, and the power of believing in one’s own vision. As the twilight of his playing days approaches, his impact on football culture — from Rosario to Barcelona, Paris to Miami — is immeasurable. Lionel Messi’s journey is not merely about breaking records; it’s about rewriting what is possible in the world’s most beloved sport. His legacy will inspire generations long after he hangs up his boots."
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
    desc: "A deep dive into football’s most debated question — who truly deserves the GOAT title?",
    paragraphs: [
      "The question of who is football’s Greatest of All Time (GOAT) has ignited debates, divided generations, and fueled countless discussions across living rooms, pubs, and social media platforms around the world. It’s a question without a definitive answer — and perhaps that’s what makes it so fascinating. Each era of football has produced its icons, but only a few names consistently rise to the top of the conversation: Pelé, Diego Maradona, Lionel Messi, and Cristiano Ronaldo.",
      "Each of these legends brought something extraordinary to the game. Pelé, the Brazilian prodigy, was football’s first global superstar. His three World Cup victories (1958, 1962, and 1970) remain unmatched, and his blend of athleticism, vision, and finishing made him the embodiment of footballing perfection in his time. Diego Maradona, on the other hand, redefined what individual brilliance could achieve. His 1986 World Cup performance — highlighted by the “Hand of God” and the “Goal of the Century” — remains one of the most iconic displays of dominance in sports history. He was flawed, fiery, and utterly mesmerizing, carrying Argentina and Napoli to heights few believed possible.",
      "Then came the modern era, defined by the relentless rivalry between Lionel Messi and Cristiano Ronaldo. For over 15 years, they have pushed each other to superhuman standards, rewriting record books along the way. Messi, the magician, is celebrated for his balance, close control, and vision — a player who makes football look effortless. His record 7 Ballon d’Or titles, multiple Champions League triumphs, and his crowning moment — winning the 2022 World Cup — completed his journey from prodigy to living legend. Ronaldo, the ultimate athlete, is the personification of discipline and ambition. His power, aerial ability, and clutch performances in crucial games have earned him 5 Ballon d’Ors, 5 Champions League titles, and a career that’s seen him succeed across England, Spain, Italy, and Portugal’s national team.",
      "Yet, the GOAT debate stretches beyond these four giants. Alfredo Di Stéfano, the driving force behind Real Madrid’s dominance in the 1950s, Johan Cruyff, the visionary mind behind “Total Football,” and Zinedine Zidane, whose elegance defined a generation, all deserve their place in the conversation. Every player mentioned didn’t just win — they changed the way football was played and perceived. Their legacies transcend statistics, influencing how future generations interpret greatness.",
      "Comparing across eras, however, remains inherently complex. Pelé and Maradona played on uneven pitches with minimal protection, while Messi and Ronaldo benefit from advanced sports science, nutrition, and evolving rules that favor attacking play. Context matters — and so do personal values. Some fans prize trophies and longevity, others creativity and influence, and many simply favor the player who made them fall in love with the game.",
      "In truth, the GOAT debate might never be resolved — and that’s the beauty of it. Football isn’t just about numbers; it’s about emotion, artistry, and inspiration. Rather than choosing one definitive greatest, perhaps it’s more meaningful to celebrate how each of these legends has shaped the game’s history, pushed its limits, and inspired billions to dream. The GOAT debate isn’t a question to be answered — it’s a conversation to be cherished, a reflection of football’s timeless and ever-evolving magic."
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
      "Few footballing philosophies have reshaped the modern game quite like tiki-taka — a tactical revolution that turned FC Barcelona into one of the most dominant teams in history and forever altered how football is played and understood. Rooted in possession, precision, and patience, tiki-taka was more than just a strategy — it was a belief system. It celebrated intelligence over physicality, teamwork over individuality, and control over chaos.",
      "The origins of tiki-taka trace back to the influence of Johan Cruyff, the Dutch visionary who brought 'Total Football' principles to Barcelona in the late 1980s. Cruyff’s ideology emphasized spatial awareness, fluid movement, and technical mastery — ideas that would later be perfected under one of his greatest disciples: Pep Guardiola. When Guardiola took charge of Barcelona in 2008, he refined those concepts into a seamless, mesmerizing style of play built on short, quick passes, constant off-the-ball movement, and an almost obsessive focus on ball retention.",
      "Between 2008 and 2012, Barcelona’s tiki-taka era reached its zenith. The team, anchored by the midfield trinity of Xavi Hernández, Andrés Iniesta, and Sergio Busquets, orchestrated play with surgical precision. Up front, Lionel Messi, reimagined as a 'false nine,' thrived in the fluidity of the system, dismantling defenses with his intelligence and flair. Matches often felt like a masterclass in control — opponents would chase shadows as Barcelona completed hundreds of passes, probing patiently before delivering the killer blow.",
      "The 2011 UEFA Champions League Final at Wembley remains the ultimate showcase of tiki-taka’s brilliance. Facing Manchester United, Barcelona produced a mesmerizing performance that left even Sir Alex Ferguson in awe. The 3–1 victory was not just a win — it was a statement of footballing philosophy at its purest form. Every touch, every triangle, and every movement was synchronized artistry. That night, tiki-taka wasn’t just effective — it was beautiful.",
      "But like all great revolutions, tiki-taka faced its critics. Some argued it could become predictable, that without players of extraordinary technical ability like Xavi, Iniesta, and Messi, its effectiveness waned. Others felt it sometimes prioritized aesthetics over aggression, control over directness. Yet, even as the tactical pendulum swung toward more dynamic, vertical systems, tiki-taka’s legacy remained unshakable.",
      "Its influence extended far beyond the Camp Nou. The Spanish national team, built around the same Barcelona core, adopted the style to devastating effect — winning Euro 2008, the 2010 World Cup, and Euro 2012, dominating world football with elegance and precision. Clubs across Europe and South America began adapting elements of the approach — from Bayern Munich under Guardiola to Manchester City’s modern evolution of 'positional play.'",
      "Today, even though football has evolved, tiki-taka’s fingerprints remain visible everywhere. Modern tactics like gegenpressing, positional play, and build-up from the back all draw from the same philosophy — one that values intelligence, structure, and collective understanding over brute force.",
      "Tiki-taka wasn’t just a tactical trend; it was a footballing revolution that redefined how the game could be played — and how beauty could coexist with dominance. Barcelona’s golden era proved that football, at its best, is not just about winning, but about how you win — with style, precision, and unity."
    ]
  },
 {
  id: 8,
  category: "Football",
  image: "/images/champions_league_comeback.jpg",
  authorImage: "/images/testimonial1.png",
  author: "Emma Davis",
  date: "20 April 2023",
  title: "Epic Comebacks in UEFA Champions League History",
  desc: "A look at the most unforgettable comeback moments that defined Champions League history.",
  paragraphs: [
    "The UEFA Champions League is more than just football’s most prestigious club competition — it’s a stage for miracles, heartbreaks, and unforgettable moments of resilience. Over the decades, the tournament has delivered some of the most astonishing comebacks ever witnessed in sport — stories that prove football’s magic lies not just in victory, but in the sheer drama of the impossible becoming reality.",
    "Perhaps no comeback is more iconic than Liverpool’s miracle in Istanbul in 2005. Facing the mighty AC Milan in the final, Liverpool trailed 3–0 at halftime, seemingly outclassed and out of hope. But what followed became the stuff of legend. In a six-minute spell of brilliance, the Reds struck back through Gerrard, Smicer, and Xabi Alonso, leveling the score at 3–3. The atmosphere was electric, the belief unstoppable. After a tense penalty shootout, Liverpool completed one of football’s greatest ever turnarounds, lifting the trophy in a night forever etched in Champions League folklore. The “Miracle of Istanbul” remains the ultimate symbol of courage, faith, and determination.",
    "Fast forward to 2019, and Liverpool once again scripted another unforgettable chapter — this time against Barcelona. After losing 3–0 at Camp Nou in the semifinal first leg, few believed a comeback was even remotely possible. Yet, under the lights of Anfield, fueled by belief and their fans’ thunderous support, Liverpool produced a 4–0 victory that defied all logic. With Divock Origi and Georginio Wijnaldum scoring twice each, the Reds overturned the deficit and advanced to the final. The roar that night wasn’t just celebration — it was a reminder that passion and perseverance can move mountains. That match reaffirmed Anfield’s reputation as a fortress where dreams come alive.",
    "No list of legendary comebacks would be complete without Manchester United’s 1999 final — a night that redefined the meaning of “never give up.” Facing Bayern Munich at the Camp Nou, United trailed 1–0 as the clock hit 90 minutes. But then came two of the most dramatic minutes in football history. Teddy Sheringham equalized in stoppage time, and seconds later, Ole Gunnar Solskjær scored the winner, sending fans and commentators into utter disbelief. United had snatched victory from the jaws of defeat, completing an unprecedented treble — Premier League, FA Cup, and Champions League — in one glorious season.",
    "These unforgettable nights are more than just matches; they are testaments to belief, teamwork, and the unpredictable nature of football. They remind us that no lead is safe, no dream too far-fetched, and no moment beyond redemption. The Champions League continues to deliver these spectacles year after year — nights where heroes are born, legends are made, and football’s magic shines brightest under the floodlights of Europe’s grandest stage."
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
  ,
  "Rivalries also shape player legacies. Performances in these high-stakes encounters often become the defining moments of careers — a winning goal, a crucial tackle, or a masterful display of leadership can etch a player into club folklore for generations.",
  "The atmosphere on derby day is unique: chants, banners, and a sea of colors create an almost theatrical setting. For many supporters, these matches are social rituals that reinforce community identity, handed down through families and friendships.",
  "While rivalries inspire fierce competition, they also foster respect and storylines that enrich the sport. Heated matches have produced iconic moments and individual heroics that are retold for decades, forming an oral history of the clubs involved.",
  "Modern football has introduced measures to improve safety and sportsmanship — from stricter disciplinary rules to fan segregation and improved stadium infrastructure — but the raw emotion of a rivalry match remains as powerful as ever, a reminder of football’s enduring ability to move people." 
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

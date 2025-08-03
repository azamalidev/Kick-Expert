-- Complete League Quiz System Setup
-- Run this BEFORE the XP/Wallet setup

-- Create competition_questions table if it doesn't exist
CREATE TABLE IF NOT EXISTS competition_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_text TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Football',
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    choices TEXT[] NOT NULL,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create competition_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS competition_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_type TEXT NOT NULL DEFAULT 'league',
    questions_played INTEGER NOT NULL DEFAULT 0,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    score_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    difficulty_breakdown JSONB,
    answers JSONB,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on quiz tables
ALTER TABLE competition_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for competition_questions (public read)
CREATE POLICY "Anyone can view competition questions" ON competition_questions
    FOR SELECT USING (true);

-- RLS policies for competition_sessions
CREATE POLICY "Users can view their own sessions" ON competition_sessions
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own sessions" ON competition_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own sessions" ON competition_sessions
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- Insert sample questions if table is empty
INSERT INTO competition_questions (question_text, category, difficulty, choices, correct_answer, explanation)
SELECT * FROM (VALUES
    ('Who won the FIFA World Cup in 2018?', 'Football', 'Easy', 
     ARRAY['France', 'Croatia', 'Belgium', 'England'], 'France',
     'France defeated Croatia 4-2 in the final held in Russia.'),
    
    ('Which player has scored the most goals in FIFA World Cup history?', 'Football', 'Medium',
     ARRAY['Pelé', 'Miroslav Klose', 'Ronaldo', 'Gerd Müller'], 'Miroslav Klose',
     'Miroslav Klose scored 16 goals across four World Cups (2002-2014).'),
    
    ('In which year was the first FIFA World Cup held?', 'Football', 'Easy',
     ARRAY['1928', '1930', '1932', '1934'], '1930',
     'The first FIFA World Cup was held in Uruguay in 1930.'),
    
    ('Which country has won the most FIFA World Cups?', 'Football', 'Easy',
     ARRAY['Germany', 'Argentina', 'Brazil', 'Italy'], 'Brazil',
     'Brazil has won the World Cup 5 times (1958, 1962, 1970, 1994, 2002).'),
    
    ('Who is known as "The Special One" in football?', 'Football', 'Medium',
     ARRAY['Pep Guardiola', 'José Mourinho', 'Carlo Ancelotti', 'Jürgen Klopp'], 'José Mourinho',
     'José Mourinho coined this nickname for himself during his time at Chelsea.'),
    
    ('Which stadium is known as "The Theatre of Dreams"?', 'Football', 'Medium',
     ARRAY['Wembley Stadium', 'Old Trafford', 'Emirates Stadium', 'Anfield'], 'Old Trafford',
     'Old Trafford is Manchester United''s home stadium, nicknamed "The Theatre of Dreams".'),
    
    ('In football, what does VAR stand for?', 'Football', 'Easy',
     ARRAY['Video Assistant Referee', 'Visual Analysis Review', 'Video Analysis Referee', 'Virtual Assistant Review'], 'Video Assistant Referee',
     'VAR is a technology system used to assist referees in making decisions.'),
    
    ('Which player won the first ever Ballon d''Or in 1956?', 'Football', 'Hard',
     ARRAY['Stanley Matthews', 'Alfredo Di Stéfano', 'Ferenc Puskás', 'Just Fontaine'], 'Stanley Matthews',
     'Stanley Matthews of England won the inaugural Ballon d''Or in 1956.'),
    
    ('What is the maximum number of players a team can have on the field during a football match?', 'Football', 'Easy',
     ARRAY['10', '11', '12', '13'], '11',
     'Each team can have a maximum of 11 players on the field, including the goalkeeper.'),
    
    ('Which country hosted the 2014 FIFA World Cup?', 'Football', 'Easy',
     ARRAY['Argentina', 'Brazil', 'Russia', 'Germany'], 'Brazil',
     'Brazil hosted the 2014 FIFA World Cup, with Germany winning the tournament.'),
    
    ('Who scored the "Hand of God" goal?', 'Football', 'Medium',
     ARRAY['Pelé', 'Diego Maradona', 'Ronaldinho', 'Romário'], 'Diego Maradona',
     'Diego Maradona scored this controversial goal with his hand in the 1986 World Cup quarter-final against England.'),
    
    ('Which English club has won the most Premier League titles?', 'Football', 'Medium',
     ARRAY['Liverpool', 'Manchester United', 'Arsenal', 'Chelsea'], 'Manchester United',
     'Manchester United has won 13 Premier League titles since its inception in 1992.'),
    
    ('What is the duration of a standard football match?', 'Football', 'Easy',
     ARRAY['80 minutes', '90 minutes', '100 minutes', '120 minutes'], '90 minutes',
     'A standard football match consists of two 45-minute halves, totaling 90 minutes.'),
    
    ('Which player has won the most Ballon d''Or awards?', 'Football', 'Medium',
     ARRAY['Cristiano Ronaldo', 'Lionel Messi', 'Michel Platini', 'Johan Cruyff'], 'Lionel Messi',
     'Lionel Messi has won the Ballon d''Or 8 times as of 2023.'),
    
    ('In which city is the famous football stadium "La Bombonera" located?', 'Football', 'Hard',
     ARRAY['Madrid', 'Buenos Aires', 'Barcelona', 'São Paulo'], 'Buenos Aires',
     'La Bombonera is the home stadium of Boca Juniors in Buenos Aires, Argentina.'),
    
    ('What color card does a referee show for a player''s ejection?', 'Football', 'Easy',
     ARRAY['Yellow', 'Red', 'Blue', 'Green'], 'Red',
     'A red card results in the player being sent off the field.'),
    
    ('Which country won the first ever European Championship (Euro) in 1960?', 'Football', 'Hard',
     ARRAY['Spain', 'Soviet Union', 'Italy', 'France'], 'Soviet Union',
     'The Soviet Union won the inaugural European Championship in 1960.'),
    
    ('What is the minimum number of players a team must have to continue a match?', 'Football', 'Medium',
     ARRAY['6', '7', '8', '9'], '7',
     'A team must have at least 7 players on the field to continue the match.'),
    
    ('Which footballer is known as "CR7"?', 'Football', 'Easy',
     ARRAY['Cristiano Ronaldo', 'Carlos Ramos', 'Clarence Ramos', 'César Rodríguez'], 'Cristiano Ronaldo',
     'Cristiano Ronaldo is known as CR7, combining his initials and jersey number.'),
    
    ('In which year did Leicester City win their first Premier League title?', 'Football', 'Medium',
     ARRAY['2014', '2015', '2016', '2017'], '2016',
     'Leicester City achieved the remarkable feat of winning the Premier League in the 2015-16 season.')
) AS sample_data
WHERE NOT EXISTS (SELECT 1 FROM competition_questions LIMIT 1);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_competition_questions_difficulty ON competition_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_competition_questions_category ON competition_questions(category);
CREATE INDEX IF NOT EXISTS idx_competition_sessions_user_id ON competition_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_competition_sessions_created_at ON competition_sessions(created_at DESC);

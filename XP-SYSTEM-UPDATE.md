# Updated XP and Rank System

## XP Rewards System

### Competition Rewards
Based on performance level in competitions:

- **Elite Level** (16+ correct answers): +30 XP
- **Pro Level** (13-15 correct answers): +20 XP  
- **Starter Level** (10-12 correct answers): +10 XP
- **Rookie Level** (Below 10 correct answers): +5 XP

### Rank Progression System

| Rank | XP Required | Icon | Description |
|------|-------------|------|-------------|
| Rookie | 0 XP | 🌱 | Starting level for new players |
| Starter | 200 XP | ⚡ | Basic understanding of football |
| Pro | 500 XP | 🔥 | Solid football knowledge |
| Expert | 1000 XP | ⭐ | Advanced football expertise |
| Champion | 2000 XP | 👑 | Elite level mastery |

## Trophy System Integration

### Updated Trophy Milestones
Aligned with the new rank system:

- **Bronze Trophy** (Rising Star): 200 XP - Reaching Starter rank
- **Silver Trophy** (Skilled Player): 500 XP - Reaching Pro rank  
- **Gold Trophy** (Expert Champion): 1000 XP - Reaching Expert rank
- **Platinum Trophy** (Elite Master): 2000 XP - Reaching Champion rank

## Implementation Details

### Files Updated
1. `components/league.tsx` - Updated XP rewards
2. `utils/rankSystem.ts` - New rank calculation system
3. `utils/trophyService.ts` - Updated trophy thresholds
4. `database/setup-trophy-system.sql` - Updated database milestones
5. `components/Profile.tsx` - Enhanced rank display with progress bars

### Key Features
- **Dynamic Rank Display**: Shows current rank with icon and colors
- **Progress Tracking**: Visual progress bar to next rank
- **Trophy Integration**: Trophies awarded at rank milestones
- **Responsive Design**: Works across all screen sizes

### Database Changes Required
Run the updated `setup-trophy-system.sql` to apply new trophy thresholds to your database.

### Usage
The system automatically:
1. Calculates appropriate XP based on competition performance
2. Determines rank from total XP
3. Shows progress to next rank
4. Awards trophies at milestone achievements
5. Updates profile display with current rank and progress

This creates a more balanced progression system that encourages consistent play and provides clear goals for advancement.

import { useState, useEffect } from 'react';
import { Order } from '../types';
import { MOTIVATIONAL_HEADLINES } from '../motivationalHeadlines';

// The Smart Quote Engine logic
// 1. Loads external txt file
// 2. Selects based on behavior rules
// 3. Fallbacks to random selection

export const useSmartQuote = (order: Order | null, orderCount: number) => {
  const [quote, setQuote] = useState<string>('');
  const [isSpecial, setIsSpecial] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!order) return;

    let isMounted = true;
    
    const loadQuote = async () => {
      try {
        setLoading(true);

        // -- RULE 1: VIRAL SCREENSHOT MOMENTS (5% chance) --
        const isViral = Math.random() < 0.05;
        if (isViral) {
          const viralQuotes = [
            "Main character energy.",
            "You just unlocked legendary status.",
            "This order deserves a screenshot.",
            "Future billionaire fueling up.",
            "Champions eat first."
          ];
          if (isMounted) {
            setQuote(viralQuotes[Math.floor(Math.random() * viralQuotes.length)]);
            setIsSpecial(true);
            setLoading(false);
          }
          return;
        }

        // -- RULE 2: ORDER NUMBER MILESTONES --
        let milestoneQuote: string | null = null;
        if (orderCount === 1) milestoneQuote = "Welcome. Let's start strong.";
        else if (orderCount === 5) milestoneQuote = "Consistency builds legends.";
        else if (orderCount === 10) milestoneQuote = "Top 10 orders. Respect.";
        else if (orderCount === 25) milestoneQuote = "You are officially a regular.";
        else if (orderCount === 50) milestoneQuote = "Half century. Legendary appetite.";
        
        if (milestoneQuote) {
          if (isMounted) {
            setQuote(milestoneQuote);
            setIsSpecial(true);
            setLoading(false);
          }
          return;
        }

        // -- RULE 3: USER BEHAVIOR --
        let behaviorQuote: string | null = null;
        
        // Large order: either total > 500 or items > 4
        const totalItems = order.items.reduce((acc, item) => acc + item.quantity, 0);
        if (order.totalAmount > 500 || totalItems >= 4) {
          behaviorQuote = "Feeding the whole squad.";
        } 
        // Late night: between 9 PM and 4 AM
        else {
          const hour = new Date(order.createdAt).getHours();
          if (hour >= 21 || hour < 4) {
             behaviorQuote = "Late grind needs fuel.";
          }
        }

        if (behaviorQuote) {
          if (isMounted) {
             setQuote(behaviorQuote);
             setIsSpecial(false);
             setLoading(false);
          }
          return;
        }

        // -- RULE 4: RANDOM FALLBACK FROM EXISTING HEADLINES --
        // Use the existing revenge/motivational lines array
        const fbQuote = MOTIVATIONAL_HEADLINES[Math.floor(Math.random() * MOTIVATIONAL_HEADLINES.length)];

        if (isMounted) {
          setQuote(fbQuote);
          setIsSpecial(false);
          setLoading(false);
        }

      } catch (err) {
        console.error("Quote engine error:", err);
        if (isMounted) setLoading(false);
      }
    };

    loadQuote();

    return () => {
      isMounted = false;
    };
  }, [order, orderCount]);

  return { quote, isSpecial, loading };
};

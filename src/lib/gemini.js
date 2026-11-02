const KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODELS = [
  ...new Set([import.meta.env.VITE_GEMINI_MODEL, "gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-3.5-flash", "gemini-flash-latest"].filter(Boolean)),
];

export const geminiConfigured = Boolean(KEY);

const PACE_COUNT = { Relaxed: "2-3", Balanced: "3-4", Packed: "5-6" };

function buildPrompt(s) {
  const lines = [
    `Destination: ${s.location}`,
    s.origin && `Travelling from: ${s.origin}`,
    `Duration: ${s.days} day(s)`,
    s.startDate && `Start date: ${s.startDate}`,
    `Travellers: ${s.people}`,
    `Trip vibe: ${s.vibe || "Leisure"}`,
    `Pace: ${s.pace || "Balanced"}`,
    `Budget level: ${s.budget}`,
    s.budgetAmount && `Hard budget cap for the whole group and whole trip: ${s.currency} ${s.budgetAmount} (estimatedBudget.total must not exceed this)`,
    s.stay && s.stay !== "Any" && `Preferred accommodation type: ${s.stay}`,
    s.transport && `Getting around preference: ${s.transport}`,
    s.diet?.length && `Dietary needs (all food suggestions must respect these): ${s.diet.join(", ")}`,
    `Interests: ${s.interests?.length ? s.interests.join(", ") : "general sightseeing"}`,
    s.mustSee && `Must include: ${s.mustSee}`,
    s.notes && `Special requests: ${s.notes}`,
    `Currency for all prices: ${s.currency}`,
  ].filter(Boolean);
  const perDay = PACE_COUNT[s.pace] || "3-4";

  return `You are an expert travel planner. Create a realistic, well-paced trip plan tailored to this brief.

${lines.join("\n")}

Rules:
- Return ONLY valid JSON, no markdown, matching exactly this shape:
{
  "destination": "string",
  "tagline": "short catchy line",
  "heroImageQuery": "exact English Wikipedia article title of the destination, e.g. Udaipur or Bali",
  "summary": "2-3 sentence overview",
  "bestTimeToVisit": "string",
  "weather": "typical weather for the trip dates/season",
  "gettingThere": "how to reach the destination${s.origin ? ` from ${s.origin}` : ""} with rough time and cost",
  "gettingAround": "best local transport options and approximate costs",
  "estimatedBudget": { "total": number, "breakdown": [ { "category": "Stay|Food|Transport|Activities|Other", "amount": number } ] },
  "hotels": [ { "rank": 1, "name": "string", "description": "string", "whyPick": "one sentence on why it is recommended", "bestFor": "e.g. Couples / Location / Value", "address": "string", "rating": number, "pricePerNight": number, "amenities": ["string"], "lat": number, "lng": number } ],
  "itinerary": [ { "day": 1, "title": "string", "summary": "string", "activities": [ { "time": "09:00 AM", "name": "real place or experience", "description": "string", "category": "sightseeing|food|culture|nature|adventure|shopping|nightlife|relax", "duration": "2 hours", "cost": number, "lat": number, "lng": number } ] } ],
  "foodToTry": [ { "name": "string", "description": "string" } ],
  "packingList": ["string"],
  "tips": ["string"]
}
- Exactly ${s.days} itinerary entries with ${perDay} activities each, in a sensible geographic order; include meals as food activities.${s.children ? "\n- The group includes children: keep activities family-friendly and avoid late nights." : ""}
- Exactly 5 real hotels ranked best-first (rank 1-5) that match the ${s.budget} budget${s.stay && s.stay !== "Any" ? ` and the preferred ${s.stay} style` : ""}, with realistic prices per night in ${s.currency} (numbers only).
- All monetary values are numbers in ${s.currency}. estimatedBudget.total is for the whole group (${s.people}) for the whole trip; each activity "cost" is per person (0 if free).
- Use only real, well-known places with accurate decimal latitude/longitude.
- 5 foodToTry, 10-14 packingList items tailored to the season and activities, 5 insider tips.`;
}

function parseJson(text) {
  const clean = text.replace(/```json|```/gi, "").trim();
  try {
    return JSON.parse(clean);
  } catch {
    const a = clean.indexOf("{");
    const b = clean.lastIndexOf("}");
    if (a >= 0 && b > a) return JSON.parse(clean.slice(a, b + 1));
    throw new Error("The AI returned an unreadable response. Please try again.");
  }
}

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const coord = (v) => (v === null || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));
const arr = (v) => (Array.isArray(v) ? v : []);

function normalizeHotels(list) {
  return arr(list)
    .map((h, i) => ({
      rank: num(h.rank, i + 1),
      name: String(h.name || "Hotel"),
      description: h.description || "",
      whyPick: h.whyPick || "",
      bestFor: h.bestFor || "",
      address: h.address || "",
      rating: num(h.rating),
      pricePerNight: num(h.pricePerNight ?? h.price),
      amenities: arr(h.amenities).map(String),
      lat: coord(h.lat),
      lng: coord(h.lng),
    }))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 5);
}

function normalize(raw, s) {
  return {
    destination: raw.destination || s.location,
    tagline: raw.tagline || "",
    heroImageQuery: typeof raw.heroImageQuery === "string" ? raw.heroImageQuery.trim() : "",
    summary: raw.summary || "",
    bestTimeToVisit: raw.bestTimeToVisit || "",
    weather: raw.weather || "",
    gettingThere: raw.gettingThere || "",
    gettingAround: raw.gettingAround || "",
    currency: s.currency,
    estimatedBudget: {
      total: num(raw.estimatedBudget?.total),
      breakdown: arr(raw.estimatedBudget?.breakdown).map((b) => ({
        category: String(b.category || "Other"),
        amount: num(b.amount),
      })),
    },
    hotels: normalizeHotels(raw.hotels),
    itinerary: arr(raw.itinerary).map((d, i) => ({
      day: num(d.day, i + 1),
      title: d.title || `Day ${i + 1}`,
      summary: d.summary || "",
      activities: arr(d.activities).map((a) => ({
        time: a.time || "",
        name: String(a.name || "Activity"),
        description: a.description || "",
        category: a.category || "sightseeing",
        duration: a.duration || "",
        cost: num(a.cost),
        lat: coord(a.lat),
        lng: coord(a.lng),
      })),
    })),
    foodToTry: arr(raw.foodToTry).map((f) => ({ name: String(f.name || ""), description: f.description || "" })),
    packingList: arr(raw.packingList).map(String),
    tips: arr(raw.tips).map(String),
  };
}

async function callGemini(prompt, temperature = 0.8) {
  if (!KEY) throw new Error("Gemini API key missing. Add VITE_GEMINI_API_KEY to your .env file.");
  let lastError;
  for (const model of MODELS) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": KEY },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature,
            maxOutputTokens: 16384,
            responseMimeType: "application/json",
            ...(model.includes("2.5") ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
          },
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = body?.error?.message || `Gemini error ${res.status}`;
        if (res.status === 403 || /API key/i.test(msg)) {
          throw Object.assign(new Error("Your Gemini API key is invalid or not allowed. Check VITE_GEMINI_API_KEY."), { fatal: true });
        }
        lastError = new Error(res.status === 429 ? "Gemini free-tier limit reached. Wait a minute and try again." : msg);
        continue; // try the next model
      }
      const text = body.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
      if (!text) {
        lastError = new Error(
          body.promptFeedback?.blockReason ? "The request was blocked by the AI safety filter." : "The AI returned an empty response."
        );
        continue;
      }
      return parseJson(text);
    } catch (e) {
      if (e.fatal) throw e;
      lastError = e;
    }
  }
  throw lastError || new Error("Gemini request failed.");
}

export async function generateTrip(selection) {
  const data = normalize(await callGemini(buildPrompt(selection)), selection);
  if (!data.itinerary.length) throw new Error("The AI returned an incomplete plan. Please try again.");
  return data;
}

/** Ask Gemini for a fresh Top-5 hotel ranking, optionally at a different budget level. */
export async function recommendHotels({ location, budget, people, days, currency, interests, stay }) {
  const prompt = `You are a travel expert. Recommend the TOP 5 hotels in or near ${location} for a ${budget} budget.
${stay && stay !== "Any" ? `Preferred accommodation type: ${stay}.\n` : ""}Travellers: ${people}. Trip length: ${days} day(s). Interests: ${interests?.length ? interests.join(", ") : "general sightseeing"}.
Prices must be realistic nightly rates in ${currency} (numbers only). Use real, well-known hotels with accurate decimal lat/lng.
Return ONLY JSON: { "hotels": [ { "rank": 1, "name": "string", "description": "string", "whyPick": "one sentence on why it is recommended", "bestFor": "e.g. Couples / Location / Value", "address": "string", "rating": number, "pricePerNight": number, "amenities": ["string"], "lat": number, "lng": number } ] }
Exactly 5 hotels ranked best-first.`;
  const raw = await callGemini(prompt, 0.6);
  const hotels = normalizeHotels(raw.hotels ?? raw);
  if (!hotels.length) throw new Error("No hotels came back. Please try again.");
  return hotels;
}

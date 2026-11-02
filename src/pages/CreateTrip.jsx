import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Check, ChevronDown, Dices, MapPin, Minus, Plane, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui";
import { RouteLoader, WaveDots } from "@/components/Loaders";
import { useAuth } from "@/context/AuthContext";
import { generateTrip, geminiConfigured } from "@/lib/gemini";
import { searchPlaces } from "@/lib/geocode";
import { createTrip } from "@/lib/trips";
import { cn, shortPlace } from "@/lib/utils";

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "JPY", "AUD", "CAD"];
const SURPRISE = ["Goa, India", "Kyoto, Japan", "Bali, Indonesia", "Lisbon, Portugal", "Manali, Himachal Pradesh, India", "Istanbul, Türkiye", "Udaipur, Rajasthan, India", "Santorini, Greece"];

const GROUPS = [
  { id: "Solo", icon: "🚶", cap: "Just me", noun: "a solo traveller", a: 1, c: 0 },
  { id: "Couple", icon: "💑", cap: "2 people", noun: "a couple", a: 2, c: 0 },
  { id: "Family", icon: "👨‍👩‍👧", cap: "With kids", noun: "a family", a: 2, c: 2 },
  { id: "Friends", icon: "🤝", cap: "A group", noun: "friends", a: 4, c: 0 },
];
const BUDGETS = [
  { id: "Cheap", icon: "💵", title: "Budget", cap: "Hostels & street food", word: "budget-friendly" },
  { id: "Moderate", icon: "💰", title: "Comfort", cap: "3–4★ stays, good meals", word: "comfortable" },
  { id: "Luxury", icon: "💎", title: "Luxury", cap: "Premium all the way", word: "luxury" },
];
const DAY_CHOICES = [1, 2, 3, 4, 5, 6, 7, 10];
const POPULAR = ["Goa", "Bali", "Paris", "Tokyo", "Dubai", "Manali"];
const dayHint = (n) => (n <= 2 ? "A quick escape" : n <= 4 ? "A perfect short break" : n <= 7 ? "A proper holiday" : "A big adventure");
const PRESETS = [
  { label: "🏖️ Weekend getaway", set: { days: 3, group: "Couple", budget: "Moderate", vibe: "Leisure", pace: "Relaxed" } },
  { label: "💞 Romantic escape", set: { days: 4, group: "Couple", budget: "Luxury", vibe: "Honeymoon", pace: "Relaxed" } },
  { label: "👨‍👩‍👧 Family holiday", set: { days: 5, group: "Family", budget: "Moderate", vibe: "Leisure", pace: "Relaxed" } },
  { label: "🎒 Backpacking", set: { days: 7, group: "Solo", budget: "Cheap", vibe: "Adventure", pace: "Packed" } },
  { label: "🎉 Friends trip", set: { days: 4, group: "Friends", budget: "Moderate", vibe: "Party", pace: "Balanced" } },
];
const VIBES = ["Leisure", "Honeymoon", "Adventure", "Cultural", "Foodie", "Wellness", "Party", "Workation"];
const PACES = ["Relaxed", "Balanced", "Packed"];
const STAYS = ["Any", "Hotel", "Resort", "Boutique", "Hostel", "Apartment / Homestay"];
const TRANSPORT = ["Mix of everything", "Walking & public transit", "Rental car / self-drive", "Taxis & cabs", "Bike / scooter"];
const DIETS = ["Vegetarian", "Vegan", "Jain", "Halal", "Gluten-free", "No beef", "No pork"];
const INTERESTS = ["Beaches", "Culture & History", "Food", "Nature", "Adventure", "Nightlife", "Shopping", "Wellness", "Photography", "Wildlife", "Art & Museums", "Hidden gems"];

function PlaceSearch({ value, onChange, onPick, placeholder, inline, icon: Icon }) {
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const skip = useRef(true);

  useEffect(() => {
    if (skip.current) {
      skip.current = false;
      return undefined;
    }
    const q = value.trim();
    if (q.length < 2) {
      setResults([]);
      return undefined;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setBusy(true);
      try {
        setResults(await searchPlaces(q, ctrl.signal));
        setOpen(true);
      } catch (e) {
        if (e.name !== "AbortError") setResults([]);
      } finally {
        setBusy(false);
      }
    }, 400);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [value]);

  return (
    <div className="relative">
      {inline && <MapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-teal-300" />}
      {Icon && <Icon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-teal-300" />}
      <input
        className={cn(inline ? "input !py-4 !pl-12 !text-lg font-semibold sm:!text-xl" : "input", Icon && !inline && "!pl-12")}
        placeholder={placeholder}
        value={value}
        autoFocus={inline && !value}
        onChange={(e) => {
          onChange(e.target.value);
          onPick(null);
        }}
        onFocus={() => results.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {busy && <WaveDots className="absolute right-2 top-1/2 -translate-y-1/2" />}
      {open && results.length > 0 && (
        <ul className="card absolute z-30 mt-2 w-full min-w-[16rem] overflow-hidden !bg-slate-900 p-1.5 shadow-xl">
          {results.map((r) => (
            <li key={r.label}>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-normal text-slate-100 hover:bg-slate-50/10"
                onMouseDown={() => {
                  skip.current = true;
                  onChange(r.label);
                  onPick(r);
                  setOpen(false);
                }}
              >
                <MapPin className="h-4 w-4 shrink-0 text-teal-300" /> {r.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const Pill = ({ active, onClick, children, className }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "rounded-full border px-4 py-2 text-sm font-medium transition",
      active ? "gradient-bg border-transparent shadow-[0_0_20px_-4px_rgba(55,193,195,0.7)]" : "border-slate-50/15 bg-slate-50/5 text-slate-300 hover:border-teal-300/60",
      className
    )}
  >
    {children}
  </button>
);

const Group = ({ title, children }) => (
  <div>
    <p className="mb-2 text-sm font-semibold text-slate-200">{title}</p>
    {children}
  </div>
);

const Tile = ({ active, onClick, icon, title, cap }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      "group relative flex flex-col items-start rounded-2xl border p-4 text-left transition duration-200 hover:-translate-y-0.5",
      active ? "border-teal-300/70 bg-teal-300/10 shadow-[0_0_30px_-8px_rgba(55,193,195,0.7)]" : "border-slate-50/15 bg-slate-50/5 hover:border-teal-300/50"
    )}
  >
    <span className={cn("text-2xl transition-transform duration-200", active ? "scale-110" : "group-hover:scale-110")}>{icon}</span>
    <span className="mt-2 font-display text-base font-bold text-slate-50">{title}</span>
    <span className="text-xs text-slate-400">{cap}</span>
    {active && (
      <span className="gradient-bg absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full">
        <Check className="h-3 w-3" />
      </span>
    )}
  </button>
);

const Label = ({ n, children, hint }) => (
  <div className="mb-3 flex items-baseline justify-between gap-3">
    <p className="flex items-center gap-2.5 font-display text-base font-bold text-slate-50">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-300/15 font-mono text-[11px] text-teal-300">{n}</span>
      {children}
    </p>
    {hint && <span className="text-xs text-slate-400">{hint}</span>}
  </div>
);

function Stepper({ value, min, max, onChange, label }) {
  const btn = "flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition hover:bg-slate-50/10 disabled:opacity-30";
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-50/15 bg-slate-50/5 p-1">
      <button type="button" aria-label={`Less ${label}`} className={btn} disabled={value <= min} onClick={() => onChange(value - 1)}><Minus className="h-4 w-4" /></button>
      <span className="font-display w-7 text-center text-lg font-bold text-slate-50">{value}</span>
      <button type="button" aria-label={`More ${label}`} className={btn} disabled={value >= max} onClick={() => onChange(value + 1)}><Plus className="h-4 w-4" /></button>
    </span>
  );
}

export default function CreateTrip() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, openAuth } = useAuth();

  const [location, setLocation] = useState(params.get("q") || "");
  const [picked, setPicked] = useState(null);
  const [days, setDays] = useState(3);
  const [groupType, setGroupType] = useState("Couple");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [budget, setBudget] = useState("Moderate");
  const [more, setMore] = useState(false);

  const [origin, setOrigin] = useState("");
  const [startDate, setStartDate] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [vibe, setVibe] = useState("Leisure");
  const [pace, setPace] = useState("Balanced");
  const [stay, setStay] = useState("Any");
  const [transport, setTransport] = useState("Mix of everything");
  const [diet, setDiet] = useState([]);
  const [interests, setInterests] = useState([]);
  const [mustSee, setMustSee] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const toggle = (setter, v) => setter((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]));
  const peopleText = `${adults} adult${adults > 1 ? "s" : ""}${children ? `, ${children} child${children > 1 ? "ren" : ""}` : ""} (${groupType})`;

  // how many optional details were customised — shown on the "More options" toggle
  const extras = [origin, startDate, budgetAmount, mustSee, notes].filter(Boolean).length + diet.length + interests.length + (stay !== "Any") + (transport !== "Mix of everything") + (vibe !== "Leisure") + (pace !== "Balanced");

  const pickGroup = (g) => {
    setGroupType(g.id);
    setAdults(g.a);
    setChildren(g.c);
  };
  const applyPreset = ({ set }) => {
    setDays(set.days);
    pickGroup(GROUPS.find((g) => g.id === set.group));
    setBudget(set.budget);
    setVibe(set.vibe);
    setPace(set.pace);
  };

  const submit = async (e) => {
    e?.preventDefault();
    if (!location.trim()) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return toast.error("Tell us where you want to go.");
    }
    if (!geminiConfigured) return toast.error("Gemini API key missing. Add VITE_GEMINI_API_KEY to .env.");
    if (budgetAmount !== "" && !(Number(budgetAmount) > 0)) {
      setMore(true);
      return toast.error("Enter a valid budget amount or leave it empty.");
    }
    if (!user) {
      toast("Sign in to generate your trip", { icon: "🔐" });
      return openAuth();
    }
    const selection = {
      location: location.trim(),
      lat: picked?.lat ?? null,
      lng: picked?.lng ?? null,
      origin: origin.trim(),
      days: Number(days),
      startDate,
      adults,
      children,
      groupType,
      people: peopleText,
      budget,
      budgetAmount: budgetAmount === "" ? null : Number(budgetAmount),
      currency,
      vibe,
      pace,
      stay,
      transport,
      diet,
      interests,
      mustSee: mustSee.trim(),
      notes: notes.trim(),
    };
    setBusy(true);
    try {
      const data = await generateTrip(selection);
      const id = await createTrip(user, selection, data);
      toast.success("Your trip is ready!");
      navigate(`/trip/${id}`);
    } catch (err) {
      console.error(err);
      toast.error(err?.code === "permission-denied" ? "Saving failed: publish firestore.rules in Firebase (see README)." : err.message || "Failed to generate trip.");
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal-300">New trip</p>
      <h1 className="font-display mt-2 text-3xl font-extrabold sm:text-4xl">
        Where to <span className="gradient-text">next?</span>
      </h1>

      {/* quick starts */}
      <div className="mt-6 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button key={p.label} type="button" onClick={() => applyPreset(p)} className="tag !px-3.5 !py-1.5 !text-sm transition hover:border-teal-300/60 hover:text-slate-50">
            {p.label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6">
        <div className="card space-y-7 p-6 sm:p-9">
          {/* 1 — destination */}
          <div>
            <Label n="1">Where do you want to go?</Label>
            <div className={shake ? "animate-shake" : ""}>
              <PlaceSearch inline value={location} onChange={setLocation} onPick={setPicked} placeholder="Search a city, region or country" />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500">Popular:</span>
              {POPULAR.map((d) => (
                <button key={d} type="button" onClick={() => { setLocation(d); setPicked(null); }} className={cn("tag transition hover:border-teal-300/60 hover:text-slate-50", location === d && "!border-teal-300/60 !text-teal-300")}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* 2 — length */}
          <div>
            <Label n="2" hint={dayHint(Number(days))}>How many days?</Label>
            <div className="flex flex-wrap gap-2">
              {DAY_CHOICES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setDays(n)}
                  aria-pressed={Number(days) === n}
                  className={cn("flex h-11 min-w-11 items-center justify-center rounded-xl border px-3 font-display text-base font-bold transition", Number(days) === n ? "gradient-bg border-transparent shadow-[0_0_20px_-4px_rgba(55,193,195,0.7)]" : "border-slate-50/15 bg-slate-50/5 text-slate-200 hover:border-teal-300/60")}
                >
                  {n}
                </button>
              ))}
              <span className="ml-1 self-center text-sm text-slate-400">day{Number(days) === 1 ? "" : "s"}</span>
            </div>
          </div>

          {/* 3 — who */}
          <div>
            <Label n="3">Who's going?</Label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {GROUPS.map((g) => (
                <Tile key={g.id} active={groupType === g.id} onClick={() => pickGroup(g)} icon={g.icon} title={g.id} cap={g.cap} />
              ))}
            </div>
          </div>

          {/* 4 — budget */}
          <div>
            <Label n="4">What's your budget style?</Label>
            <div className="grid gap-3 sm:grid-cols-3">
              {BUDGETS.map((b) => (
                <Tile key={b.id} active={budget === b.id} onClick={() => setBudget(b.id)} icon={b.icon} title={b.title} cap={b.cap} />
              ))}
            </div>
          </div>

          {/* live recap */}
          <p className="rounded-2xl border border-teal-300/20 bg-teal-300/5 px-4 py-3 text-sm text-slate-300">
            <Sparkles className="mr-2 inline h-4 w-4 text-teal-300" />
            {location.trim() ? (
              <>
                <b className="text-slate-50">{days} day{Number(days) === 1 ? "" : "s"}</b> in <b className="text-slate-50">{shortPlace(location)}</b> for{" "}
                <b className="text-slate-50">{GROUPS.find((g) => g.id === groupType)?.noun}</b>, with a <b className="text-slate-50">{BUDGETS.find((x) => x.id === budget)?.word}</b> budget.
              </>
            ) : (
              "Pick a destination to see your trip summary."
            )}
          </p>

          {/* optional details */}
          <div className="border-t border-slate-50/10 pt-5">
            <button type="button" onClick={() => setMore(!more)} className="flex w-full items-center justify-between rounded-xl px-1 py-1 text-left" aria-expanded={more}>
              <span className="flex items-center gap-3">
                <span className="font-semibold text-slate-100">Make it more personal</span>
                <span className="tag">{extras ? `${extras} added` : "optional"}</span>
              </span>
              <ChevronDown className={cn("h-5 w-5 text-slate-400 transition", more && "rotate-180")} />
            </button>

            {more && (
              <div className="mt-6 grid animate-fade-up gap-6 sm:grid-cols-2">
                <Group title="Travelling from">
                  <PlaceSearch value={origin} onChange={setOrigin} onPick={() => {}} placeholder="Your city" icon={Plane} />
                </Group>
                <Group title="Start date">
                  <input className="input" type="date" min={today} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </Group>

                <Group title="Travellers">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-400">Adults <Stepper value={adults} min={1} max={10} onChange={setAdults} label="adults" /></label>
                    <label className="flex items-center gap-2 text-sm text-slate-400">Kids <Stepper value={children} min={0} max={6} onChange={setChildren} label="children" /></label>
                  </div>
                </Group>
                <Group title="Total budget cap (optional)">
                  <div className="flex gap-2">
                    <input className="input" type="number" min={1} placeholder="e.g. 60000" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} />
                    <select className="input !w-24 shrink-0 [&>option]:bg-slate-900" value={currency} onChange={(e) => setCurrency(e.target.value)} aria-label="Currency">
                      {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </Group>

                <div className="sm:col-span-2"><Group title="Trip vibe">
                  <div className="flex flex-wrap gap-2">{VIBES.map((v) => <Pill key={v} active={vibe === v} onClick={() => setVibe(v)}>{v}</Pill>)}</div>
                </Group></div>
                <Group title="Pace">
                  <div className="flex flex-wrap gap-2">{PACES.map((v) => <Pill key={v} active={pace === v} onClick={() => setPace(v)}>{v}</Pill>)}</div>
                </Group>
                <Group title="Stay type">
                  <div className="flex flex-wrap gap-2">{STAYS.map((v) => <Pill key={v} active={stay === v} onClick={() => setStay(v)}>{v}</Pill>)}</div>
                </Group>
                <div className="sm:col-span-2"><Group title="Getting around">
                  <div className="flex flex-wrap gap-2">{TRANSPORT.map((v) => <Pill key={v} active={transport === v} onClick={() => setTransport(v)}>{v}</Pill>)}</div>
                </Group></div>
                <div className="sm:col-span-2"><Group title="Food preferences">
                  <div className="flex flex-wrap gap-2">{DIETS.map((v) => <Pill key={v} active={diet.includes(v)} onClick={() => toggle(setDiet, v)}>{v}</Pill>)}</div>
                </Group></div>
                <div className="sm:col-span-2"><Group title="Interests">
                  <div className="flex flex-wrap gap-2">{INTERESTS.map((v) => <Pill key={v} active={interests.includes(v)} onClick={() => toggle(setInterests, v)}>{v}</Pill>)}</div>
                </Group></div>
                <div className="sm:col-span-2"><Group title="Must-see places">
                  <input className="input" maxLength={200} placeholder="e.g. Sunset at Fort Aguada, a cooking class" value={mustSee} onChange={(e) => setMustSee(e.target.value)} />
                </Group></div>
                <div className="sm:col-span-2"><Group title="Anything else?">
                  <textarea className="input min-h-20" maxLength={300} placeholder="e.g. travelling with a toddler, avoid long treks…" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </Group></div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <button type="button" onClick={() => { setLocation(SURPRISE[Math.floor(Math.random() * SURPRISE.length)]); setPicked(null); }} className="inline-flex items-center gap-2 text-sm font-medium text-teal-300 hover:underline">
            <Dices className="h-4 w-4" /> Surprise me with a destination
          </button>
          <Button type="submit" size="lg" disabled={busy} className="w-full sm:w-auto">
            <Sparkles className="h-5 w-5" /> Generate my trip
          </Button>
        </div>
      </form>

      {busy && <RouteLoader place={shortPlace(location)} />}
    </div>
  );
}

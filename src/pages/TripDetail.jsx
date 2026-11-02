import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Car, Check, CalendarDays, Plane, Sparkles, Clock, ExternalLink, Globe, Lightbulb, Lock, MapPin, Printer, Share2, Star, Trash2, Users, Utensils, Wallet,
} from "lucide-react";
import { Button, Chip, Skeleton } from "@/components/ui";
import { RadarLoader, WaveDots } from "@/components/Loaders";
import PlaceImage, { HeroImage } from "@/components/PlaceImage";
import { DAY_COLORS } from "@/components/mapColors";

const TripMap = lazy(() => import("@/components/TripMap"));
import { useAuth } from "@/context/AuthContext";
import { deleteTrip, getTrip, updateTrip } from "@/lib/trips";
import { recommendHotels } from "@/lib/gemini";
import { cn, mapsLink, money, shortPlace } from "@/lib/utils";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "itinerary", label: "Itinerary" },
  { id: "hotels", label: "Hotels" },
  { id: "map", label: "Map" },
  { id: "packing", label: "Packing" },
];
const CAT_EMOJI = { sightseeing: "🏛️", food: "🍽️", culture: "🎭", nature: "🌿", adventure: "🧗", shopping: "🛍️", nightlife: "🌙", relax: "🧖" };
const BAR_COLORS = ["bg-brand-teal", "bg-brand-amber", "bg-brand-blue", "bg-brand-green", "bg-brand-coral"];

function NotAvailable({ onSignIn, signedIn }) {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <Lock className="mx-auto h-10 w-10 text-slate-400" />
      <h1 className="font-display mt-4 text-2xl font-bold">Trip not available</h1>
      <p className="mt-2 text-slate-500">It may have been deleted, or it's private to its owner.</p>
      <div className="mt-6 flex justify-center gap-3">
        {!signedIn && <Button variant="outline" onClick={onSignIn}>Sign in</Button>}
        <Link to="/plan-a-trip"><Button>Plan a new trip</Button></Link>
      </div>
    </div>
  );
}

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, openAuth } = useAuth();
  const [trip, setTrip] = useState(undefined); // undefined = loading, null = unavailable
  const [tab, setTab] = useState("overview");
  const [day, setDay] = useState(0);
  const [hotelBusy, setHotelBusy] = useState(false);
  const [hotelBudget, setHotelBudget] = useState(null);

  useEffect(() => {
    let alive = true;
    setTrip(undefined);
    getTrip(id)
      .then((t) => alive && setTrip(t))
      .catch(() => alive && setTrip(null));
    return () => {
      alive = false;
    };
  }, [id, user?.uid]);

  const data = trip?.data;
  const sel = trip?.selection;
  const owner = Boolean(user && trip && trip.userId === user.uid);
  const city = sel ? shortPlace(sel.location) : "";
  const country = sel?.location?.split(",").slice(-1)[0]?.trim();

  const points = useMemo(() => {
    if (!data) return [];
    const list = [];
    data.itinerary.forEach((d, di) =>
      d.activities.forEach((a, ai) => list.push({ lat: a.lat, lng: a.lng, name: a.name, label: `${di + 1}`, color: DAY_COLORS[di % DAY_COLORS.length], key: `${di}-${ai}` }))
    );
    data.hotels.forEach((h) => list.push({ lat: h.lat, lng: h.lng, name: h.name, label: "🏨", color: "#0f172a" }));
    return list;
  }, [data]);

  if (trip === undefined)
    return (
      <div>
        <div className="shimmer flex h-64 items-end sm:h-80">
          <div className="mx-auto w-full max-w-5xl px-4 pb-6">
            <p className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.3em] text-teal-300"><WaveDots /> Loading itinerary</p>
          </div>
        </div>
        <div className="mx-auto max-w-5xl space-y-4 px-4 py-8">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  if (trip === null || !data) return <NotAvailable signedIn={Boolean(user)} onSignIn={openAuth} />;

  const total = data.estimatedBudget.total;
  const breakdown = data.estimatedBudget.breakdown;
  const packed = trip.packed || {};
  const activeDay = data.itinerary[Math.min(day, data.itinerary.length - 1)];

  const patch = async (fields, optimistic) => {
    const prev = trip;
    setTrip({ ...trip, ...optimistic });
    try {
      await updateTrip(trip.id, fields);
    } catch {
      setTrip(prev);
      toast.error("Couldn't save that change.");
    }
  };

  const togglePack = (i) => {
    if (!owner) return setTrip({ ...trip, packed: { ...packed, [i]: !packed[i] } });
    const next = { ...packed, [i]: !packed[i] };
    patch({ packed: next }, { packed: next });
  };

  const share = async () => {
    if (!trip.isPublic) await patch({ isPublic: true }, { isPublic: true });
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Public link copied!");
    } catch {
      toast.success("Trip is public — copy the URL from your address bar.");
    }
  };
  const makePrivate = () => patch({ isPublic: false }, { isPublic: false }).then(() => toast.success("Trip is private again"));

  const refreshHotels = async (budget) => {
    setHotelBudget(budget);
    setHotelBusy(true);
    try {
      const hotels = await recommendHotels({
        location: sel.location,
        budget,
        people: sel.people,
        days: sel.days,
        currency: data.currency,
        interests: sel.interests,
        stay: sel.stay,
      });
      await patch({ "data.hotels": hotels }, { data: { ...data, hotels } });
      toast.success(`Top 5 ${budget.toLowerCase()} hotels updated`);
    } catch (e) {
      toast.error(e.message || "Couldn't refresh hotels.");
    } finally {
      setHotelBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this trip permanently?")) return;
    try {
      await deleteTrip(trip.id);
      toast.success("Trip deleted");
      navigate("/my-trips");
    } catch {
      toast.error("Couldn't delete the trip.");
    }
  };

  const show = (id) => cn(tab === id ? "block" : "hidden", "print:block");
  const nights = Math.max(1, sel.days - 1);
  const activeBudget = hotelBudget || sel.budget;
  const hotelPrices = data.hotels.map((h) => h.pricePerNight).filter((n) => n > 0);
  const packedCount = data.packingList.filter((_, i) => packed[i]).length;

  return (
    <div>
      <HeroImage name={city} country={country} title={data.heroImageQuery} className="h-64 sm:h-80">
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-5xl px-4 pb-6 text-white">
          <h1 className="font-display text-3xl font-extrabold sm:text-5xl">{data.destination || city}</h1>
          {data.tagline && <p className="mt-1 text-white/85 sm:text-lg">{data.tagline}</p>}
        </div>
      </HeroImage>

      <div className="mx-auto max-w-5xl px-4">
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Chip><CalendarDays className="h-4 w-4" /> {sel.days} days</Chip>
            <Chip><Wallet className="h-4 w-4" /> {sel.budget}</Chip>
            <Chip><Users className="h-4 w-4" /> {sel.people}</Chip>
            {sel.startDate && <Chip>🗓️ {sel.startDate}</Chip>}
            {sel.pace && <Chip>⚡ {sel.pace} pace</Chip>}
            {sel.vibe && <Chip>✨ {sel.vibe}</Chip>}
            {sel.diet?.slice(0, 2).map((d) => <Chip key={d}>🥗 {d}</Chip>)}
            {sel.interests?.slice(0, 3).map((i) => <Chip key={i}>{i}</Chip>)}
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print / PDF</Button>
            {owner && (
              <>
                {trip.isPublic ? (
                  <Button variant="outline" size="sm" onClick={makePrivate}><Globe className="h-4 w-4" /> Public · make private</Button>
                ) : null}
                <Button size="sm" onClick={share}><Share2 className="h-4 w-4" /> {trip.isPublic ? "Copy link" : "Share"}</Button>
                <Button variant="ghost" size="sm" onClick={remove} aria-label="Delete trip" className="text-brand-coral"><Trash2 className="h-4 w-4" /></Button>
              </>
            )}
          </div>
        </div>

        <div className="sticky top-20 z-30 mt-6 overflow-x-auto rounded-2xl border border-slate-50/10 bg-slate-950/70 p-1.5 backdrop-blur-xl print:hidden">
          <div className="flex gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn("whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-semibold transition", tab === t.id ? "gradient-bg shadow-[0_0_24px_-6px_rgba(55,193,195,0.8)]" : "text-slate-400 hover:bg-slate-50/5 hover:text-slate-50")}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-12 py-8">
          {/* OVERVIEW */}
          <div className={cn(show("overview"), "space-y-8")}>
            <p className="text-lg leading-relaxed text-slate-300">{data.summary}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {data.bestTimeToVisit && (
                <div className="card p-5"><p className="text-sm font-semibold text-slate-500">Best time to visit</p><p className="mt-1">{data.bestTimeToVisit}</p></div>
              )}
              {data.weather && (
                <div className="card p-5"><p className="text-sm font-semibold text-slate-500">Weather</p><p className="mt-1">{data.weather}</p></div>
              )}
              {data.gettingThere && (
                <div className="card p-5"><p className="flex items-center gap-2 text-sm font-semibold text-slate-500"><Plane className="h-4 w-4 text-brand-blue" /> Getting there</p><p className="mt-1">{data.gettingThere}</p></div>
              )}
              {data.gettingAround && (
                <div className="card p-5"><p className="flex items-center gap-2 text-sm font-semibold text-slate-500"><Car className="h-4 w-4 text-brand-green" /> Getting around</p><p className="mt-1">{data.gettingAround}</p></div>
              )}
            </div>

            {total > 0 && (
              <div className="card p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-xl font-bold">Estimated budget</h2>
                  <p className="font-display gradient-text text-3xl font-extrabold">{money(total, data.currency)}</p>
                </div>
                <p className="text-sm text-slate-500">For {sel.people.toLowerCase()} · whole trip</p>
                <div className="mt-5 space-y-3">
                  {breakdown.map((b, i) => (
                    <div key={b.category}>
                      <div className="flex justify-between text-sm"><span>{b.category}</span><span className="font-semibold">{money(b.amount, data.currency)}</span></div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-800">
                        <div className={cn("h-full rounded-full", BAR_COLORS[i % BAR_COLORS.length])} style={{ width: `${Math.min(100, (b.amount / total) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.foodToTry.length > 0 && (
              <div>
                <h2 className="font-display mb-4 flex items-center gap-2 text-xl font-bold"><Utensils className="h-5 w-5 text-brand-amber" /> Food to try</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {data.foodToTry.map((f) => (
                    <div key={f.name} className="card p-4"><p className="font-semibold">{f.name}</p><p className="mt-1 text-sm text-slate-400">{f.description}</p></div>
                  ))}
                </div>
              </div>
            )}

            {data.tips.length > 0 && (
              <div>
                <h2 className="font-display mb-4 flex items-center gap-2 text-xl font-bold"><Lightbulb className="h-5 w-5 text-brand-amber" /> Local tips</h2>
                <ul className="space-y-2">
                  {data.tips.map((t) => (
                    <li key={t} className="card flex gap-3 p-4 text-sm"><span>💡</span>{t}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* ITINERARY */}
          <div className={show("itinerary")}>
            <div className="mb-6 flex gap-2 overflow-x-auto pb-1 print:hidden">
              {data.itinerary.map((d, i) => (
                <button
                  key={i}
                  onClick={() => setDay(i)}
                  className={cn("whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition", i === day ? "gradient-bg border-transparent text-white" : "border-slate-50/15")}
                >
                  Day {d.day}
                </button>
              ))}
            </div>
            {data.itinerary.map((d, di) => (
              <div key={di} className={cn(d === activeDay ? "block" : "hidden", "mb-10 print:block")}>
                <h2 className="font-display text-2xl font-bold">Day {d.day}: {d.title}</h2>
                {d.summary && <p className="mt-1 text-slate-400">{d.summary}</p>}
                <ol className="mt-6">
                  {d.activities.map((a, ai) => (
                    <li key={ai} className="grid grid-cols-[2rem_1fr] gap-x-3 sm:gap-x-4">
                      {/* number + connector, in their own column so they always line up with the card */}
                      <div className="flex flex-col items-center pt-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ background: DAY_COLORS[di % DAY_COLORS.length], color: "#06101c", boxShadow: `0 0 14px ${DAY_COLORS[di % DAY_COLORS.length]}` }}>{ai + 1}</span>
                        {ai < d.activities.length - 1 && <span className="mt-1 w-0.5 flex-1 rounded-full" style={{ background: `linear-gradient(${DAY_COLORS[di % DAY_COLORS.length]}, transparent)`, opacity: 0.45 }} />}
                      </div>
                      <div className={cn("card flex flex-col overflow-hidden sm:flex-row", ai < d.activities.length - 1 && "mb-5")}>
                        <PlaceImage name={a.name} city={city} fallbackName={city} fallbackCity={country} emoji={CAT_EMOJI[a.category] || "📍"} className="h-44 shrink-0 sm:h-auto sm:min-h-[10rem] sm:w-52" />
                        <div className="flex-1 p-4">
                          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                            {a.time && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {a.time}</span>}
                            {a.duration && <span>· {a.duration}</span>}
                            <span className="rounded-full px-2 py-0.5 capitalize bg-slate-800">{CAT_EMOJI[a.category] || "📍"} {a.category}</span>
                          </div>
                          <h3 className="mt-1.5 text-lg font-bold">{a.name}</h3>
                          <p className="mt-1 text-sm text-slate-400">{a.description}</p>
                          <div className="mt-3 flex items-center justify-between text-sm">
                            <span className="font-semibold">{a.cost > 0 ? `${money(a.cost, data.currency)} / person` : "Free"}</span>
                            <a href={mapsLink(a.name, city)} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-semibold text-teal-300 hover:underline print:hidden">
                              <MapPin className="h-4 w-4" /> Map <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>

          {/* HOTELS — AI top 5 */}
          <div className={show("hotels")}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal-300">AI recommendations</p>
                <h2 className="font-display mt-1 text-2xl font-bold">Top 5 hotels in {city}</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Ranked by Gemini for a <b className="text-slate-200">{activeBudget}</b> budget · prices for {nights} night{nights > 1 ? "s" : ""} are estimates.
                </p>
              </div>
              {owner && (
                <div className="flex flex-wrap items-center gap-2 print:hidden">
                  {["Cheap", "Moderate", "Luxury"].map((b) => (
                    <button
                      key={b}
                      disabled={hotelBusy}
                      onClick={() => refreshHotels(b)}
                      className={cn("rounded-full border px-3.5 py-1.5 text-sm font-medium transition disabled:opacity-50", b === activeBudget ? "gradient-bg border-transparent" : "border-slate-50/10 bg-slate-50/5 text-slate-300 hover:border-teal-300/50")}
                    >
                      {b}
                    </button>
                  ))}
                  <Button size="sm" variant="outline" loading={hotelBusy} onClick={() => refreshHotels(activeBudget)}>
                    <Sparkles className="h-4 w-4" /> Re-rank with AI
                  </Button>
                </div>
              )}
            </div>

            {hotelBusy ? (
              <div className="mt-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="shimmer h-40 rounded-2xl" />
                ))}
                <p className="flex items-center justify-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-slate-400"><WaveDots /> Gemini is ranking hotels</p>
              </div>
            ) : (
              <>
                {hotelPrices.length > 1 && (
                  <div className="card mt-6 flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                    <span className="text-slate-400">Price range / night</span>
                    <span className="font-display font-bold">{money(Math.min(...hotelPrices), data.currency)} – {money(Math.max(...hotelPrices), data.currency)}</span>
                    <span className="text-slate-400">Average</span>
                    <span className="font-display gradient-text font-bold">{money(hotelPrices.reduce((x, y) => x + y, 0) / hotelPrices.length, data.currency)}</span>
                  </div>
                )}
                <div className="mt-6 space-y-5">
                  {data.hotels.map((h, i) => (
                    <div key={h.name} className={cn("card flex flex-col overflow-hidden md:flex-row", i === 0 && "!border-teal-300/50 shadow-[0_0_40px_-10px_rgba(55,193,195,0.6)]")}>
                      <PlaceImage name={h.name} city={city} fallbackName={city} fallbackCity={country} emoji="🏨" className="h-52 shrink-0 md:h-auto md:min-h-[15rem] md:w-72">
                        <span className={cn("absolute left-3 top-3 flex h-9 min-w-9 items-center justify-center rounded-xl px-2 font-display text-sm font-extrabold", i === 0 ? "bg-brand-amber text-slate-950" : "bg-black/70 text-white backdrop-blur")}>
                          {i === 0 ? "★ #1 Top pick" : `#${i + 1}`}
                        </span>
                      </PlaceImage>
                      <div className="flex flex-1 flex-col p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-bold">{h.name}</h3>
                            {h.bestFor && <span className="tag mt-1">Best for · {h.bestFor}</span>}
                          </div>
                          {h.rating > 0 && <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-400/15 px-2.5 py-1 text-sm font-bold text-amber-300"><Star className="h-3.5 w-3.5 fill-current" />{h.rating.toFixed(1)}</span>}
                        </div>
                        <p className="mt-2 text-sm text-slate-400">{h.description}</p>
                        {h.whyPick && (
                          <p className="mt-2 flex gap-2 rounded-xl bg-teal-300/10 px-3 py-2 text-sm text-teal-100"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" />{h.whyPick}</p>
                        )}
                        {h.amenities.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {h.amenities.slice(0, 5).map((a) => <span key={a} className="tag">{a}</span>)}
                          </div>
                        )}
                        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-4">
                          <div>
                            <p><span className="font-display text-2xl font-extrabold">{money(h.pricePerNight, data.currency)}</span><span className="text-sm text-slate-400"> / night</span></p>
                            <p className="text-xs text-slate-500">≈ {money(h.pricePerNight * nights, data.currency)} for {nights} night{nights > 1 ? "s" : ""}</p>
                          </div>
                          <a href={mapsLink(h.name, h.address || city)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm font-semibold text-teal-300 hover:underline print:hidden">
                            <MapPin className="h-4 w-4" /> View map <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        {h.address && <p className="mt-2 text-xs text-slate-500">{h.address}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* MAP (mounted only when visible so Leaflet sizes correctly) */}
          {tab === "map" && (
            <div className="print:hidden">
              <h2 className="font-display mb-4 text-2xl font-bold">Trip map</h2>
              {points.some((p) => Number.isFinite(p.lat)) ? (
                <>
                  <Suspense fallback={<RadarLoader className="h-[28rem]" />}>
                    <TripMap points={points} city={city} className="h-[28rem] w-full overflow-hidden rounded-2xl border border-slate-800" />
                  </Suspense>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm">
                    {data.itinerary.map((d, i) => (
                      <span key={i} className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full" style={{ background: DAY_COLORS[i % DAY_COLORS.length] }} /> Day {d.day}</span>
                    ))}
                    <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-slate-50" /> Hotels 🏨</span>
                  </div>
                </>
              ) : (
                <p className="text-slate-500">No map coordinates were generated for this trip.</p>
              )}
            </div>
          )}

          {/* PACKING */}
          <div className={show("packing")}>
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-display text-2xl font-bold">Packing checklist</h2>
              <span className="text-sm text-slate-500">{packedCount}/{data.packingList.length} packed</span>
            </div>
            <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-800">
              <div className="gradient-bg h-full transition-all" style={{ width: `${data.packingList.length ? (packedCount / data.packingList.length) * 100 : 0}%` }} />
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {data.packingList.map((item, i) => (
                <li key={i}>
                  <button onClick={() => togglePack(i)} className="card flex w-full items-center gap-3 p-3 text-left transition hover:border-violet-400">
                    <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2", packed[i] ? "gradient-bg border-transparent text-white" : "border-slate-50/25")}>
                      {packed[i] && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <span className={cn("text-sm", packed[i] && "text-slate-400 line-through")}>{item}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

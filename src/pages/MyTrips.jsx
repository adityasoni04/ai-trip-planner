import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { CalendarDays, Plus, Search, Trash2, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui";
import { WaveDots } from "@/components/Loaders";
import { HeroImage } from "@/components/PlaceImage";
import { useAuth } from "@/context/AuthContext";
import { deleteTrip, listTrips } from "@/lib/trips";
import { shortPlace } from "@/lib/utils";

export default function MyTrips() {
  const { user } = useAuth();
  const [trips, setTrips] = useState(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;
    listTrips(user.uid)
      .then((t) => alive && setTrips(t))
      .catch((e) => {
        console.error(e);
        if (alive) {
          setError(e.code === "permission-denied" ? "Firestore rules block this request. Deploy firestore.rules (see README)." : "Couldn't load your trips.");
          setTrips([]);
        }
      });
    return () => {
      alive = false;
    };
  }, [user.uid]);

  const shown = useMemo(
    () => (trips || []).filter((t) => t.selection?.location?.toLowerCase().includes(q.trim().toLowerCase())),
    [trips, q]
  );

  const remove = async (e, t) => {
    e.preventDefault();
    if (!window.confirm(`Delete your trip to ${shortPlace(t.selection?.location)}?`)) return;
    try {
      await deleteTrip(t.id);
      setTrips((cur) => cur.filter((x) => x.id !== t.id));
      toast.success("Trip deleted");
    } catch {
      toast.error("Couldn't delete the trip.");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal-300">Library</p>
          <h1 className="font-display text-3xl font-extrabold">My trips</h1>
          <p className="text-slate-400">{trips ? `${trips.length} saved` : "Loading…"}</p>
        </div>
        <Link to="/plan-a-trip">
          <Button><Plus className="h-4 w-4" /> New trip</Button>
        </Link>
      </div>

      {trips?.length > 0 && (
        <div className="relative mt-6 max-w-sm">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input !pl-11" placeholder="Search your trips" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      )}

      {error && <p className="mt-6 rounded-xl bg-brand-coral/10 p-4 text-sm text-brand-coral">{error}</p>}

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {trips === null &&
          [1, 2, 3].map((i) => (
            <div key={i} className="card overflow-hidden">
              <div className="shimmer flex h-44 items-center justify-center"><WaveDots /></div>
              <div className="space-y-2 p-4">
                <div className="shimmer h-4 w-2/3 rounded-lg" />
                <div className="shimmer h-3 w-1/2 rounded-lg" />
              </div>
            </div>
          ))}
        {shown.map((t) => (
          <Link key={t.id} to={`/trip/${t.id}`} className="card group overflow-hidden transition hover:-translate-y-1 hover:border-teal-300/40 hover:shadow-[0_0_34px_-8px_rgba(55,193,195,0.55)]">
            <HeroImage name={shortPlace(t.selection?.location)} country={t.selection?.location?.split(",").slice(-1)[0]?.trim()} title={t.data?.heroImageQuery} url={t.heroUrl} className="h-44">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent" />
              <button
                onClick={(e) => remove(e, t)}
                aria-label="Delete trip"
                className="absolute right-3 top-3 rounded-lg bg-black/40 p-2 text-white opacity-0 backdrop-blur transition hover:bg-red-600 group-hover:opacity-100 max-sm:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <p className="font-display absolute bottom-3 left-4 right-4 truncate text-xl font-bold text-white">{shortPlace(t.selection?.location)}</p>
            </HeroImage>
            <div className="flex flex-wrap gap-x-4 gap-y-1 p-4 text-sm text-slate-400">
              <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> {t.selection?.days} days</span>
              <span className="flex items-center gap-1.5"><Wallet className="h-4 w-4" /> {t.selection?.budget}</span>
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {t.selection?.people}</span>
            </div>
          </Link>
        ))}
      </div>

      {trips && !trips.length && !error && (
        <div className="card mx-auto mt-10 max-w-md p-10 text-center">
          <img src="/logo.png" alt="" className="mx-auto h-16 w-16 opacity-90" />
          <h2 className="font-display mt-3 text-xl font-bold">No trips yet</h2>
          <p className="mt-1 text-slate-500">Plan your first adventure — it only takes a minute.</p>
          <Link to="/plan-a-trip"><Button className="mt-5">Plan a trip</Button></Link>
        </div>
      )}
      {trips?.length > 0 && !shown.length && <p className="mt-8 text-slate-500">No trips match "{q}".</p>}
    </div>
  );
}

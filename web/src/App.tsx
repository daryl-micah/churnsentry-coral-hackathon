import snapshot from "./data/snapshot.json";
import type { Snapshot } from "./types";
import { Header } from "./components/Header";
import { CustomerCard } from "./components/CustomerCard";
import { StatCards } from "./components/StatCards";
import { Summary } from "./components/Summary";
import { SignalList } from "./components/SignalList";
import { Actions } from "./components/Actions";
import { SystemicBanner } from "./components/SystemicBanner";
import { CoralTrace } from "./components/CoralTrace";
import { CrossSourceBadges } from "./components/CrossSourceBadges";

const data = snapshot as Snapshot;

export default function App() {
  const { provider, context, analysis, trace } = data;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <div className="space-y-5">
        <Header provider={provider} />
        <CustomerCard context={context} />
        <StatCards analysis={analysis} />
        {analysis.systemic_risk && <SystemicBanner note={analysis.systemic_note} />}
        <Summary summary={analysis.summary} />
        <SignalList signals={analysis.signals} />
        <Actions analysis={analysis} />
        <CrossSourceBadges />
        <CoralTrace trace={trace} />

        <footer className="pt-2 text-center text-xs text-slate-600">
          ChurnSentry · Coral hackathon Track 1 · canned demo data ·{" "}
          <span className="text-slate-500">regenerate with</span>{" "}
          <code className="text-slate-400">npm run snapshot</code>
        </footer>
      </div>
    </div>
  );
}

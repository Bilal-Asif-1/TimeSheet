import type { DashboardController } from "./controllerType";
import { industries, teamSizes } from "./utils";

type Props = { dashboard: DashboardController };

const cardClass = "rounded-[26px] border border-white/10 bg-white/[0.05] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.32)]";
const inputClass = "w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none transition focus:border-white/35";
const labelClass = "grid gap-2 text-sm text-white/70";
const primaryButton = "rounded-2xl border border-white/15 bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButton = "rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60";

export function CreateOrganizationCard({ dashboard }: Props) {
  // Form ki state aur submit action dashboard controller se aate hain.
  const { formatOrganizationId, message, organization, setOrganization } = dashboard;
  return (
    <section className={cardClass}>
      <div className="mb-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-white/45">Create Workspace</p>
        <h2 className="text-2xl font-semibold text-white">Start a new organization</h2>
        <p className="mt-2 text-sm text-white/55">Create your company workspace and become the owner/admin.</p>
      </div>
      <div className="grid gap-4">
        <label className={labelClass}><span>Organization name</span><input className={inputClass} placeholder="WiMetrix" value={organization.name} onChange={(event) => setOrganization({ ...organization, name: event.target.value })} /></label>
        <label className={labelClass}><span>Organization ID</span><input className={inputClass} placeholder="ORG-WIMETRIX" value={organization.id} onChange={(event) => setOrganization({ ...organization, id: formatOrganizationId(event.target.value) })} /></label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelClass}><span>Industry</span><select className={inputClass} value={organization.industry} onChange={(event) => setOrganization({ ...organization, industry: event.target.value })}>{industries.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className={labelClass}><span>Team size</span><select className={inputClass} value={organization.teamSize} onChange={(event) => setOrganization({ ...organization, teamSize: event.target.value })}>{teamSizes.map((item) => <option key={item}>{item}</option>)}</select></label>
        </div>
        <button className={primaryButton} onClick={dashboard.createOrganization}>Create Organization</button>
      </div>
      {message.error && <p className="mt-4 text-sm font-semibold text-red-300">{message.error}</p>}
      {message.success && <p className="mt-4 text-sm font-semibold text-emerald-300">{message.success}</p>}
    </section>
  );
}

export function JoinOrganizationCard({ dashboard }: Props) {
  // User shared Organization ID aur optional department de kar workspace join karta hai.
  const { formatOrganizationId, join, message, setJoin } = dashboard;
  return (
    <section className={cardClass}>
      <div className="mb-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-white/45">Join Workspace</p>
        <h2 className="text-2xl font-semibold text-white">Join an existing organization</h2>
        <p className="mt-2 text-sm text-white/55">Use the Organization ID shared by your company.</p>
      </div>
      <div className="grid gap-4">
        <label className={labelClass}><span>Organization ID</span><input className={inputClass} placeholder="ORG-X82KLM" value={join.orgId} onChange={(event) => setJoin({ ...join, orgId: formatOrganizationId(event.target.value) })} /></label>
        <label className={labelClass}><span>Department</span><input className={inputClass} placeholder="Engineering" value={join.department} onChange={(event) => setJoin({ ...join, department: event.target.value })} /></label>
        <button className={secondaryButton} onClick={dashboard.joinOrganization} disabled={join.isSaving}>{join.isSaving ? "Joining..." : "Join Organization"}</button>
      </div>
      {message.error && <p className="mt-4 text-sm font-semibold text-red-300">{message.error}</p>}
      {message.success && <p className="mt-4 text-sm font-semibold text-emerald-300">{message.success}</p>}
    </section>
  );
}

import type { DashboardController } from "./controllerType";
import { CreateOrganizationCard, JoinOrganizationCard } from "./OrganizationForms";
import type { OrganizationMembership } from "./types";
import { formatRole } from "./utils";

type Props = { dashboard: DashboardController };

const cardClass = "rounded-[26px] border border-white/10 bg-white/[0.05] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.32)]";
const secondaryButton = "rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15";
const primaryButton = "rounded-2xl border border-white/15 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200";

export function OrganizationsPage({ dashboard }: Props) {
  const { message, organization, overview, setActivePage, setOrganization } = dashboard;

  return (
    <section className="grid gap-6">
      <div className={cardClass}>
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-white/45">Organizations</p>
            <h2 className="text-2xl font-semibold text-white">Your workspaces</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className={secondaryButton} onClick={() => setActivePage("createOrganization")} type="button">Create Organization</button>
            <button className={organization.action === "join" ? primaryButton : secondaryButton} onClick={() => setOrganization({ ...organization, action: "join" })} type="button">Join Organization</button>
          </div>
        </div>

        {overview.memberships.length > 0 ? (
          <div className="grid gap-6">
            <List title="My Organizations" items={overview.ownedOrganizations} dashboard={dashboard} />
            <List title="Joined Organizations" items={overview.joinedOrganizations} dashboard={dashboard} />
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/15 bg-black/20 p-6">
            <p className="text-sm text-white/55">You are not connected to an organization yet. Create your own workspace or join one shared by your company.</p>
          </div>
        )}
        {message.error && <p className="mt-4 text-sm font-semibold text-red-300">{message.error}</p>}
      </div>

      {organization.action === "join" && <JoinOrganizationCard dashboard={dashboard} />}
    </section>
  );
}

export function CreateOrganizationPage({ dashboard }: Props) {
  return (
    <section className="mx-auto grid w-full max-w-3xl gap-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-white/45">Organizations</p>
          <h2 className="text-2xl font-semibold text-white">Create organization</h2>
        </div>
        <button className={secondaryButton} type="button" onClick={() => dashboard.setActivePage("myOrganization")}>Back</button>
      </div>
      <CreateOrganizationCard dashboard={dashboard} />
    </section>
  );
}

function List({ dashboard, items, title }: { dashboard: DashboardController; items: OrganizationMembership[]; title: string }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm font-semibold text-white">
        <span>{title}</span>
        <small className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/65">{items.length}</small>
      </div>
      {items.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item) => <OrganizationCard dashboard={dashboard} item={item} key={`${item.membershipType}-${item.id}`} />)}
        </div>
      ) : (
        <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/50">No organizations in this section yet.</p>
      )}
    </div>
  );
}

function OrganizationCard({ dashboard, item }: { dashboard: DashboardController; item: OrganizationMembership }) {
  return (
    <button
      className={`rounded-3xl border p-5 text-left transition hover:-translate-y-0.5 ${item.isActive ? "border-white/35 bg-white/14" : "border-white/10 bg-black/25 hover:border-white/25 hover:bg-white/10"}`}
      onClick={() => (item.isActive ? dashboard.setActivePage("organizationDetails") : dashboard.selectOrganization(item.id))}
      type="button"
    >
      <span className="text-xs uppercase tracking-[0.18em] text-white/45">{item.membershipType === "owned" ? "Created by you" : "Joined workspace"}</span>
      <strong className="mt-3 block text-xl text-white">{item.name}</strong>
      <small className="mt-1 block text-sm text-white/50">{item.orgCode}</small>
      <div className="mt-4 flex flex-wrap gap-2">
        <em className="not-italic rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/70">{formatRole(item.role)}</em>
        {item.department && <em className="not-italic rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/70">{item.department}</em>}
        {item.isActive && <em className="not-italic rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-200">Active</em>}
      </div>
    </button>
  );
}

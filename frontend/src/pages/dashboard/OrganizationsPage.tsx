import type { DashboardController } from "./controllerType";
import { CreateOrganizationCard, JoinOrganizationCard } from "./OrganizationForms";
import type { OrganizationMembership } from "./types";
import { formatRole } from "./utils";

type Props = { dashboard: DashboardController };

export function OrganizationsPage({ dashboard }: Props) {
  const { message, organization, overview, setActivePage, setOrganization } = dashboard;

  return (
    <section className={`workspace-grid my-organization-grid${overview.organization ? " organization-connected-grid" : " organization-empty-grid"}`}>
      <div className="workspace-card">
        <div className="section-heading">
          <div><p className="eyebrow">Organizations</p><h2>Your workspaces</h2></div>
          <div className="organization-page-actions">
            <button className="btn btn-secondary" onClick={() => setActivePage("createOrganization")} type="button">Create Organization</button>
            <button className={`btn ${organization.action === "join" ? "btn-primary" : "btn-secondary"}`} onClick={() => setOrganization({ ...organization, action: "join" })} type="button">Join Organization</button>
          </div>
        </div>

        {overview.memberships.length > 0 ? (
          <div className="organization-lists">
            <List title="My Organizations" items={overview.ownedOrganizations} dashboard={dashboard} />
            <List title="Joined Organizations" items={overview.joinedOrganizations} dashboard={dashboard} />
          </div>
        ) : (
          <div className="organization-empty-state">
            <p className="muted">You are not connected to an organization yet. Create your own workspace or join one shared by your company.</p>
          </div>
        )}
        {message.error && <p className="error-text">{message.error}</p>}
      </div>

      {organization.action === "join" && <div className="organization-action-panel"><JoinOrganizationCard dashboard={dashboard} /></div>}
    </section>
  );
}

export function CreateOrganizationPage({ dashboard }: Props) {
  return (
    <section className="workspace-grid single-panel create-organization-page">
      <div className="organization-page-header">
        <div><p className="eyebrow">Organizations</p><h2>Create organization</h2></div>
        <button className="btn btn-secondary" type="button" onClick={() => dashboard.setActivePage("myOrganization")}>Back</button>
      </div>
      <CreateOrganizationCard dashboard={dashboard} />
    </section>
  );
}

function List({ dashboard, items, title }: { dashboard: DashboardController; items: OrganizationMembership[]; title: string }) {
  return (
    <div className="organization-list-section">
      <div className="organization-list-heading"><span>{title}</span><small>{items.length}</small></div>
      {items.length > 0 ? (
        <div className="organization-card-grid">
          {items.map((item) => <OrganizationCard dashboard={dashboard} item={item} key={`${item.membershipType}-${item.id}`} />)}
        </div>
      ) : (
        <p className="muted">No organizations in this section yet.</p>
      )}
    </div>
  );
}

function OrganizationCard({ dashboard, item }: { dashboard: DashboardController; item: OrganizationMembership }) {
  return (
    <button
      className={`organization-select-button${item.isActive ? " active" : ""}`}
      onClick={() => (item.isActive ? dashboard.setActivePage("organizationDetails") : dashboard.selectOrganization(item.id))}
      type="button"
    >
      <span>{item.membershipType === "owned" ? "Created by you" : "Joined workspace"}</span>
      <strong>{item.name}</strong>
      <small>{item.orgCode}</small>
      <div className="organization-card-meta">
        <em>{formatRole(item.role)}</em>
        {item.department && <em>{item.department}</em>}
        {item.isActive && <em>Active</em>}
      </div>
    </button>
  );
}

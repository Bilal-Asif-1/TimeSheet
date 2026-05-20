import type { DashboardController } from "./controllerType";
import { industries, teamSizes } from "./utils";

type Props = { dashboard: DashboardController };

export function CreateOrganizationCard({ dashboard }: Props) {
  const { formatOrganizationId, message, organization, setOrganization } = dashboard;
  return (
    <section className="workspace-card onboarding-action-card">
      <div><p className="eyebrow">Create Workspace</p><h2>Start a new organization</h2><p className="muted">Create your company workspace and become the owner/admin.</p></div>
      <div className="onboarding-form">
        <label><span>Organization name</span><input className="input" placeholder="WiMetrix" value={organization.name} onChange={(event) => setOrganization({ ...organization, name: event.target.value })} /></label>
        <label><span>Organization ID</span><input className="input" placeholder="ORG-WIMETRIX" value={organization.id} onChange={(event) => setOrganization({ ...organization, id: formatOrganizationId(event.target.value) })} /></label>
        <div className="onboarding-form-row">
          <label><span>Industry</span><select className="input" value={organization.industry} onChange={(event) => setOrganization({ ...organization, industry: event.target.value })}>{industries.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Team size</span><select className="input" value={organization.teamSize} onChange={(event) => setOrganization({ ...organization, teamSize: event.target.value })}>{teamSizes.map((item) => <option key={item}>{item}</option>)}</select></label>
        </div>
        <button className="btn btn-primary" onClick={dashboard.createOrganization}>Create Organization</button>
      </div>
      {message.error && <p className="error-text">{message.error}</p>}
      {message.success && <p className="success-text">{message.success}</p>}
    </section>
  );
}

export function JoinOrganizationCard({ dashboard }: Props) {
  const { formatOrganizationId, join, message, setJoin } = dashboard;
  return (
    <section className="workspace-card onboarding-action-card">
      <div><p className="eyebrow">Join Workspace</p><h2>Join an existing organization</h2><p className="muted">Use the Organization ID shared by your company.</p></div>
      <div className="onboarding-form">
        <label><span>Organization ID</span><input className="input" placeholder="ORG-X82KLM" value={join.orgId} onChange={(event) => setJoin({ ...join, orgId: formatOrganizationId(event.target.value) })} /></label>
        <label><span>Department</span><input className="input" placeholder="Engineering" value={join.department} onChange={(event) => setJoin({ ...join, department: event.target.value })} /></label>
        <button className="btn btn-secondary" onClick={dashboard.joinOrganization} disabled={join.isSaving}>{join.isSaving ? "Joining..." : "Join Organization"}</button>
      </div>
      {message.error && <p className="error-text">{message.error}</p>}
      {message.success && <p className="success-text">{message.success}</p>}
    </section>
  );
}

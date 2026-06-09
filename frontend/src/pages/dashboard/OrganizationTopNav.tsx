import { NavLink } from "react-router-dom";
import type { WorkspacePage } from "./types";
import { pageToPath } from "./utils";

type Props = {
  activePage: WorkspacePage;
  hasOrganization: boolean;
};

const baseLink =
  "inline-flex min-h-[38px] items-center rounded-xl border px-3.5 text-[13px] font-black no-underline";
const normalLink = ({ isActive }: { isActive: boolean }) =>
  `${baseLink} ${
    isActive
      ? "border-white/15 bg-white/10 text-white"
      : "border-transparent bg-transparent text-zinc-400 hover:border-white/15 hover:bg-white/10 hover:text-white"
  }`;
const lightLink = ({ isActive }: { isActive: boolean }) =>
  `${baseLink} ${isActive ? "bg-white" : "bg-zinc-200 hover:bg-white"} border-white/70 text-gray-900`;

export function OrganizationTopNav({ activePage, hasOrganization }: Props) {
  // Organization available ho to Home uski detail par, warna organizations list par jata hai.
  const homeLabel = activePage === "myOrganization" || activePage === "createOrganization" ? "Organizations" : "Home";
  const homePath = hasOrganization ? pageToPath("organizationDetails") : pageToPath("myOrganization");

  return (
    <div className="sticky top-28 z-[18] flex flex-wrap gap-2.5 rounded-[18px] border border-white/10 bg-black/80 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-[18px]">
      <NavLink className={normalLink} to={homePath}>
        {homeLabel}
      </NavLink>
      {hasOrganization ? (
        <>
          <NavLink className={normalLink} to={pageToPath("employees")}>Employees</NavLink>
          <NavLink className={normalLink} to={pageToPath("departments")}>Departments</NavLink>
        </>
      ) : (
        <>
          <span className={`${baseLink} cursor-not-allowed border-transparent text-zinc-400 opacity-45`}>Employees</span>
          <span className={`${baseLink} cursor-not-allowed border-transparent text-zinc-400 opacity-45`}>Departments</span>
        </>
      )}
      {(activePage === "myOrganization" || activePage === "createOrganization") && (
        <NavLink className={lightLink} to={pageToPath("createOrganization")}>
          Create Organization
        </NavLink>
      )}
      <NavLink className={`${baseLink} ml-auto border-white/70 bg-zinc-200 text-gray-900 hover:bg-white`} to={pageToPath("overview")}>
        Back to Dashboard
      </NavLink>
    </div>
  );
}

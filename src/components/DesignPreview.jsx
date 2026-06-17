import React from 'react';
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit,
  Loader2,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Users
} from 'lucide-react';

const colors = [
  { name: 'Canvas', value: '#fffaf0', usage: 'Cream page floor' },
  { name: 'Primary', value: '#0a0a0a', usage: 'CTAs and headline ink' },
  { name: 'Brand pink', value: '#ff4d8b', usage: 'Saturated feature card' },
  { name: 'Brand teal', value: '#1a3a3a', usage: 'Featured and dark cards' },
  { name: 'Lavender', value: '#b8a4ed', usage: 'AI and soft feature cards' },
  { name: 'Peach', value: '#ffb084', usage: 'Warm product surfaces' },
  { name: 'Ochre', value: '#e8b94a', usage: 'Community accents' },
  { name: 'Mint', value: '#a4d4c5', usage: 'Positive accents' },
  { name: 'Coral', value: '#ff6b5a', usage: 'Highlights and error-adjacent accents' },
  { name: 'Hairline', value: '#e5e5e5', usage: 'Inputs and dividers' }
];

const badges = ['Active', 'Pending', 'Inactive', 'Error', 'Info'];

const users = [
  { name: 'Ariana Putri', email: 'ariana@company.test', role: 'Admin', status: 'Active' },
  { name: 'Bima Santoso', email: 'bima@company.test', role: 'Manager', status: 'Pending' },
  { name: 'Clara Wijaya', email: 'clara@company.test', role: 'Finance', status: 'Inactive' }
];

const spacing = ['4', '8', '12', '16', '24', '32'];

function PreviewSection({ eyebrow, title, children }) {
  return (
    <section className="ds-section">
      <div className="ds-section-head">
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function StatusBadge({ status }) {
  return <span className={`ds-status ds-status-${status.toLowerCase()}`}>{status}</span>;
}

function LoadingSkeleton() {
  return (
    <div className="ds-skeleton-table" aria-label="Loading table preview">
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

function MiniTemplate({ title, icon: Icon, children }) {
  return (
    <article className="ds-template-card">
      <header>
        <span><Icon size={18} /></span>
        <strong>{title}</strong>
      </header>
      <div>{children}</div>
    </article>
  );
}

export default function DesignPreview({ navigate }) {
  return (
    <main className="design-system-page">
      <nav className="ds-topbar" aria-label="Design system navigation">
        <button type="button" className="ds-back" onClick={() => navigate('/')}>
          <ChevronLeft size={18} /> Back to app
        </button>
        <div className="ds-topbar-actions">
          <a href="#tokens">Tokens</a>
          <a href="#components">Components</a>
          <a href="#patterns">Patterns</a>
        </div>
      </nav>

      <header className="ds-hero">
        <div>
          <p>Cream-canvas portal kit</p>
          <h1>Frontend Template Design System</h1>
          <span>A live preview of the reusable UI rules, components, and layout patterns used across this web portal template.</span>
        </div>
        <aside className="ds-hero-art" aria-label="Clay-inspired illustration preview">
          <span className="ds-sun" />
          <span className="ds-mountain ds-mountain-one" />
          <span className="ds-mountain ds-mountain-two" />
          <span className="ds-mascot-dot" />
          <strong>Mobile-first UX</strong>
          <small>Touch-safe controls, stacked forms, responsive tables, and warm saturated cards.</small>
        </aside>
      </header>

      <PreviewSection eyebrow="01" title="Design Tokens">
        <div id="tokens" className="ds-token-grid">
          {colors.map((color) => (
            <article key={color.name} className="ds-token-card">
              <span className="ds-color-swatch" style={{ background: color.value }} />
              <strong>{color.name}</strong>
              <code>{color.value}</code>
              <p>{color.usage}</p>
            </article>
          ))}
        </div>

        <div className="ds-demo-grid ds-demo-grid-3">
          <article className="ds-panel">
            <h3>Typography</h3>
            <div className="ds-type-stack">
              <span className="ds-display">Rounded display headline</span>
              <span className="ds-h1">Page title</span>
              <span className="ds-body">Readable body text for dashboard descriptions and form guidance.</span>
              <span className="ds-label">Label text</span>
              <span className="ds-helper">Helper text keeps field instructions short.</span>
            </div>
          </article>
          <article className="ds-panel">
            <h3>Spacing</h3>
            <div className="ds-spacing-stack">
              {spacing.map((item) => <span key={item} style={{ width: `${Number(item) * 4}px` }}>{item}px</span>)}
            </div>
          </article>
          <article className="ds-panel">
            <h3>Radius and shadow</h3>
            <div className="ds-radius-grid">
              <span>6</span>
              <span>8</span>
              <span>12</span>
              <span>16</span>
            </div>
            <div className="ds-shadow-sample">Soft elevation</div>
          </article>
        </div>
      </PreviewSection>

      <PreviewSection eyebrow="02" title="Buttons">
        <div id="components" className="ds-button-row">
          <button className="ds-btn ds-btn-primary">Primary</button>
          <button className="ds-btn ds-btn-default">Secondary</button>
          <button className="ds-btn ds-btn-light">Light</button>
          <button className="ds-btn ds-btn-outline">Outline</button>
          <button className="ds-btn ds-btn-danger"><Trash2 size={16} /> Danger</button>
          <button className="ds-btn ds-btn-default" disabled>Disabled</button>
          <button className="ds-btn ds-btn-primary"><Loader2 className="animate-spin" size={16} /> Loading</button>
        </div>
      </PreviewSection>

      <PreviewSection eyebrow="03" title="Form Components">
        <div className="ds-form-preview">
          <label>Text input<input type="text" placeholder="Project name" /></label>
          <label>Password<input type="password" placeholder="••••••••" /></label>
          <label>Select<select defaultValue=""><option value="" disabled>Choose role</option><option>Admin</option><option>Manager</option></select></label>
          <label>Date input<input type="date" defaultValue="2026-06-17" /></label>
          <label>Textarea<textarea placeholder="Write a short internal note" /></label>
          <div className="ds-control-line"><input id="ds-check" type="checkbox" defaultChecked /><label htmlFor="ds-check">Enable notification emails</label></div>
          <fieldset>
            <legend>Access level</legend>
            <label><input type="radio" name="access" defaultChecked /> Standard</label>
            <label><input type="radio" name="access" /> Elevated</label>
          </fieldset>
          <div className="ds-switch-row"><span>Require approval</span><button type="button" aria-label="Switch enabled"><span /></button></div>
        </div>
      </PreviewSection>

      <PreviewSection eyebrow="04" title="Feedback Components">
        <div className="ds-alert-grid">
          <div className="ds-alert ds-alert-success"><CheckCircle2 size={18} /><strong>Saved</strong><span>Changes were applied.</span></div>
          <div className="ds-alert ds-alert-warning"><AlertCircle size={18} /><strong>Review needed</strong><span>Some fields need confirmation.</span></div>
          <div className="ds-alert ds-alert-error"><AlertCircle size={18} /><strong>Save failed</strong><span>Check the highlighted fields.</span></div>
          <div className="ds-alert ds-alert-info"><Bell size={18} /><strong>Scheduled</strong><span>Report delivery starts tomorrow.</span></div>
        </div>
        <div className="ds-notification">
          <Bell size={18} />
          <div><strong>Notification example</strong><span>User invitation sent to Clara Wijaya.</span></div>
          <StatusBadge status="Active" />
        </div>
        <div className="ds-badge-row" aria-label="Badge examples">
          {badges.map((badge) => <StatusBadge key={badge} status={badge} />)}
        </div>
      </PreviewSection>

      <PreviewSection eyebrow="05" title="Cards and Layout">
        <div className="ds-section-pattern">
          <div>
            <span>Section header pattern</span>
            <h3>Warm portal surfaces</h3>
            <p>Use cream sections, saturated feature cards, and one clear action.</p>
          </div>
          <button className="ds-btn ds-btn-primary">Add member</button>
        </div>
        <div className="ds-card-grid">
          <article className="ds-panel ds-feature-card ds-feature-pink"><h3>Outbound workflow</h3><p>Saturated cards carry the most important feature previews.</p><div className="ds-product-lines"><span /><span /><span /></div></article>
          <article className="ds-stat-card ds-feature-card ds-feature-teal"><span>Open tasks</span><strong>128</strong><p>+12.4% from last week</p></article>
          <article className="ds-action-card ds-feature-card ds-feature-lavender"><ShieldCheck size={24} /><h3>Review permissions</h3><p>Audit elevated access before the next release.</p><button className="ds-btn ds-btn-on-color">Open review</button></article>
        </div>
      </PreviewSection>

      <PreviewSection eyebrow="06" title="Table Pattern">
        <div className="ds-table-shell">
          <div className="ds-table-toolbar">
            <label><Search size={16} /><input type="search" placeholder="Search users" /></label>
            <select defaultValue="all"><option value="all">All statuses</option><option>Active</option><option>Pending</option></select>
          </div>
          <div className="ds-table-scroll">
            <table>
              <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.email}>
                    <td><strong>{user.name}</strong><span>{user.email}</span></td>
                    <td>{user.role}</td>
                    <td><StatusBadge status={user.status} /></td>
                    <td><button className="ds-icon-btn" aria-label={`Edit ${user.name}`}><Edit size={15} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="ds-pagination"><span>1-3 of 24 users</span><button><ChevronLeft size={16} /></button><button><ChevronRight size={16} /></button></div>
        </div>
      </PreviewSection>

      <PreviewSection eyebrow="07" title="States">
        <div className="ds-state-grid">
          <div className="ds-state"><Loader2 className="animate-spin" /><strong>Loading state</strong><span>Fetching workspace data.</span><LoadingSkeleton /></div>
          <div className="ds-state"><Users /><strong>Empty state</strong><span>No users match the current filters.</span><button className="ds-btn ds-btn-light">Reset filters</button></div>
          <div className="ds-state ds-state-error"><AlertCircle /><strong>Error state</strong><span>We could not load this module.</span></div>
          <div className="ds-state ds-state-success"><CheckCircle2 /><strong>Success state</strong><span>Settings are up to date.</span></div>
        </div>
      </PreviewSection>

      <PreviewSection eyebrow="08" title="Page Templates">
        <div id="patterns" className="ds-template-grid">
          <MiniTemplate title="Dashboard page" icon={Users}><div className="ds-mini-metrics"><span /><span /><span /></div><p>Metrics, recent activity, and priority actions.</p></MiniTemplate>
          <MiniTemplate title="List management" icon={SlidersHorizontal}><div className="ds-mini-table"><span /><span /><span /></div><p>Search, filters, records, and pagination.</p></MiniTemplate>
          <MiniTemplate title="Create/edit form" icon={Edit}><div className="ds-mini-form"><span /><span /><span /></div><p>Grouped fields with sticky mobile action area.</p></MiniTemplate>
          <MiniTemplate title="Detail page" icon={Settings}><div className="ds-mini-detail"><span /><span /></div><p>Metadata, status, sections, and contextual actions.</p></MiniTemplate>
        </div>
      </PreviewSection>
    </main>
  );
}

'use client'

import { useState } from 'react'
import type {
  SiteSettings, BannerSetting, CategorySetting,
  HowItWorksStep, FooterLink, FaqItem, FeatureFlags, SectionTitles,
} from '@/lib/settings'
import { ICON_NAMES, ICON_MAP } from '@/lib/icons'
import { Plus, Trash2, Save, Check, AlertCircle, GripVertical, ToggleLeft, ToggleRight } from 'lucide-react'

type TabId = 'general' | 'banners' | 'categories' | 'howItWorks' | 'footer' | 'announcements' | 'features' | 'legal'

const TABS: { id: TabId; label: string }[] = [
  { id: 'general',       label: 'General' },
  { id: 'banners',       label: 'Banners' },
  { id: 'categories',    label: 'Categories' },
  { id: 'howItWorks',    label: 'How It Works' },
  { id: 'footer',        label: 'Footer' },
  { id: 'announcements', label: 'Announcements' },
  { id: 'features',      label: 'Features' },
  { id: 'legal',         label: 'Legal & FAQ' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

function Input({ value, onChange, placeholder, className = '' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition ${className}`}
    />
  )
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
      />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="#4F46E5"
        className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
      />
    </div>
  )
}

function IconSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const Icon = ICON_MAP[value]
  return (
    <div className="flex items-center gap-2">
      {Icon && <Icon className="w-5 h-5 text-gray-500 shrink-0" />}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition bg-white"
      >
        {ICON_NAMES.map(name => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">{children}</h3>
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition mt-3"
    >
      <Plus className="w-4 h-4" /> {label}
    </button>
  )
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-1.5 text-gray-300 hover:text-red-500 transition rounded"
      title="Remove"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}

// ── Tab: General ──────────────────────────────────────────────────────────────

function GeneralTab({ settings, update }: { settings: SiteSettings; update: (p: Partial<SiteSettings>) => void }) {
  return (
    <div className="space-y-6 max-w-md">
      <SectionTitle>Site Identity</SectionTitle>
      <Field label="Site Name" hint="Shown in the navbar logo and page title">
        <Input value={settings.siteName} onChange={v => update({ siteName: v })} placeholder="ReviewApp" />
      </Field>
      <Field label="Brand / Accent Color" hint="Used for buttons, highlights, links across the site">
        <ColorInput value={settings.brandColor} onChange={v => update({ brandColor: v })} />
        <div className="mt-3 flex gap-2 flex-wrap">
          {['#4F46E5','#7C3AED','#DC2626','#059669','#D97706','#0EA5E9','#DB2777','#1D4ED8'].map(c => (
            <button
              key={c}
              type="button"
              onClick={() => update({ brandColor: c })}
              className="w-7 h-7 rounded-full border-2 transition hover:scale-110"
              style={{ background: c, borderColor: settings.brandColor === c ? '#000' : 'transparent' }}
              title={c}
            />
          ))}
        </div>
      </Field>
    </div>
  )
}

// ── Tab: Banners ──────────────────────────────────────────────────────────────

function BannersTab({ banners, onChange }: { banners: BannerSetting[]; onChange: (b: BannerSetting[]) => void }) {
  const update = (i: number, patch: Partial<BannerSetting>) => {
    const next = banners.map((b, idx) => idx === i ? { ...b, ...patch } : b)
    onChange(next)
  }

  return (
    <div className="space-y-8">
      {banners.map((b, i) => (
        <div key={i} className="border border-gray-100 rounded-xl p-5 relative">
          {/* Preview strip */}
          <div
            className="h-2 rounded-full mb-4"
            style={{ background: `linear-gradient(90deg, ${b.bgFrom}, ${b.bgTo})` }}
          />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Banner {i + 1}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Badge Text">
              <Input value={b.badge} onChange={v => update(i, { badge: v })} placeholder="🎁 Up to 40% Cashback" />
            </Field>
            <Field label="Emoji (right side)">
              <Input value={b.emoji} onChange={v => update(i, { emoji: v })} placeholder="📱" />
            </Field>
            <Field label="Title" >
              <Input value={b.title} onChange={v => update(i, { title: v })} placeholder="Big Deal Headline" />
            </Field>
            <Field label="CTA Button Text">
              <Input value={b.cta} onChange={v => update(i, { cta: v })} placeholder="Shop Now" />
            </Field>
            <Field label="Subtitle / Description" >
              <Input value={b.subtitle} onChange={v => update(i, { subtitle: v })} placeholder="Short description..." />
            </Field>
            <Field label="Link URL">
              <Input value={b.href} onChange={v => update(i, { href: v })} placeholder="/products" />
            </Field>
            <Field label="Gradient Start Color">
              <ColorInput value={b.bgFrom} onChange={v => update(i, { bgFrom: v })} />
            </Field>
            <Field label="Gradient End Color">
              <ColorInput value={b.bgTo} onChange={v => update(i, { bgTo: v })} />
            </Field>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Tab: Categories ───────────────────────────────────────────────────────────

function CategoriesTab({ categories, onChange }: { categories: CategorySetting[]; onChange: (c: CategorySetting[]) => void }) {
  const update = (i: number, patch: Partial<CategorySetting>) =>
    onChange(categories.map((c, idx) => idx === i ? { ...c, ...patch } : c))

  const remove = (i: number) => onChange(categories.filter((_, idx) => idx !== i))

  const add = () => onChange([...categories, { label: 'New Category', iconName: 'Package', bg: '#F3F4F6', color: '#374151' }])

  return (
    <div>
      <SectionTitle>Top Categories ({categories.length})</SectionTitle>
      <div className="space-y-3">
        {categories.map((cat, i) => (
          <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
            <GripVertical className="w-4 h-4 text-gray-300 mt-2.5 shrink-0" />

            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field label="Label">
                <Input value={cat.label} onChange={v => update(i, { label: v })} />
              </Field>
              <Field label="Icon">
                <IconSelect value={cat.iconName} onChange={v => update(i, { iconName: v })} />
              </Field>
              <Field label="Circle Background">
                <ColorInput value={cat.bg} onChange={v => update(i, { bg: v })} />
              </Field>
              <Field label="Icon Color">
                <ColorInput value={cat.color} onChange={v => update(i, { color: v })} />
              </Field>
            </div>

            {/* Preview */}
            <div className="shrink-0 mt-1">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: cat.bg }}
              >
                {(() => { const Icon = ICON_MAP[cat.iconName]; return Icon ? <Icon className="w-5 h-5" style={{ color: cat.color }} /> : null })()}
              </div>
            </div>

            <RemoveBtn onClick={() => remove(i)} />
          </div>
        ))}
      </div>
      <AddButton onClick={add} label="Add Category" />
    </div>
  )
}

// ── Tab: How It Works ─────────────────────────────────────────────────────────

function HowItWorksTab({ steps, onChange }: { steps: HowItWorksStep[]; onChange: (s: HowItWorksStep[]) => void }) {
  const update = (i: number, patch: Partial<HowItWorksStep>) =>
    onChange(steps.map((s, idx) => idx === i ? { ...s, ...patch } : s))

  return (
    <div>
      <SectionTitle>How It Works — 4 Steps</SectionTitle>
      <div className="space-y-4">
        {steps.map((step, i) => (
          <div key={i} className="border border-gray-100 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-black shrink-0">
                {step.step}
              </div>
              <Field label="Icon">
                <IconSelect value={step.iconName} onChange={v => update(i, { iconName: v })} />
              </Field>
            </div>
            <Field label="Step Title">
              <Input value={step.title} onChange={v => update(i, { title: v })} placeholder="Step title..." />
            </Field>
            <Field label="Description">
              <Input value={step.desc} onChange={v => update(i, { desc: v })} placeholder="Short description..." />
            </Field>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Tab: Footer ───────────────────────────────────────────────────────────────

function LinkListEditor({ title, links, onChange }: {
  title: string
  links: FooterLink[]
  onChange: (l: FooterLink[]) => void
}) {
  const update = (i: number, patch: Partial<FooterLink>) =>
    onChange(links.map((l, idx) => idx === i ? { ...l, ...patch } : l))
  const remove = (i: number) => onChange(links.filter((_, idx) => idx !== i))
  const add = () => onChange([...links, { label: 'New Link', href: '/' }])

  return (
    <div>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{title}</p>
      <div className="space-y-2">
        {links.map((link, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={link.label}
              onChange={e => update(i, { label: e.target.value })}
              placeholder="Link label"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <input
              type="text"
              value={link.href}
              onChange={e => update(i, { href: e.target.value })}
              placeholder="/path"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <RemoveBtn onClick={() => remove(i)} />
          </div>
        ))}
      </div>
      <AddButton onClick={add} label="Add link" />
    </div>
  )
}

function FooterTab({ settings, update }: { settings: SiteSettings; update: (p: Partial<SiteSettings>) => void }) {
  return (
    <div className="space-y-6">
      <SectionTitle>Footer Content</SectionTitle>
      <Field label="Site Description (shown below logo)">
        <Input
          value={settings.footerDescription}
          onChange={v => update({ footerDescription: v })}
          placeholder="Short one-line about your site..."
        />
      </Field>
      <hr className="border-gray-100" />
      <LinkListEditor
        title="Company Links (left column)"
        links={settings.footerCompanyLinks}
        onChange={footerCompanyLinks => update({ footerCompanyLinks })}
      />
      <hr className="border-gray-100" />
      <LinkListEditor
        title="Explore Links (right column)"
        links={settings.footerExploreLinks}
        onChange={footerExploreLinks => update({ footerExploreLinks })}
      />
    </div>
  )
}

// ── Tab: Announcements ────────────────────────────────────────────────────────

function Toggle({ value, onChange, label, hint }: {
  value: boolean; onChange: (v: boolean) => void; label: string; hint?: string
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ml-4 ${value ? 'bg-indigo-600' : 'bg-gray-200'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}

function AnnouncementsTab({ settings, update }: { settings: SiteSettings; update: (p: Partial<SiteSettings>) => void }) {
  const ann = settings.announcementBanner
  const updAnn = (patch: Partial<typeof ann>) => update({ announcementBanner: { ...ann, ...patch } })
  const titles = settings.sectionTitles
  const updTitles = (patch: Partial<SectionTitles>) => update({ sectionTitles: { ...titles, ...patch } })

  return (
    <div className="space-y-8">
      <div>
        <SectionTitle>Site-wide Announcement Bar</SectionTitle>
        <Toggle value={ann.enabled} onChange={v => updAnn({ enabled: v })} label="Announcement bar show karo" hint="Homepage ke top par ek colored strip dikhayi degi" />
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Message Text">
            <Input value={ann.text} onChange={v => updAnn({ text: v })} placeholder="🎉 Special offer..." />
          </Field>
          <Field label="Link (click karne par jaaye)">
            <Input value={ann.href} onChange={v => updAnn({ href: v })} placeholder="/products" />
          </Field>
          <Field label="Background Color">
            <ColorInput value={ann.bgColor} onChange={v => updAnn({ bgColor: v })} />
          </Field>
          <Field label="Text Color">
            <ColorInput value={ann.textColor} onChange={v => updAnn({ textColor: v })} />
          </Field>
        </div>
        {ann.enabled && (
          <div className="mt-4 rounded-lg px-4 py-2.5 text-sm font-semibold text-center" style={{ background: ann.bgColor, color: ann.textColor }}>
            {ann.text} (Preview)
          </div>
        )}
      </div>

      <div>
        <SectionTitle>Section Titles (Homepage)</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Flash Deals heading">
            <Input value={titles.flashDeals} onChange={v => updTitles({ flashDeals: v })} />
          </Field>
          <Field label="Trending heading">
            <Input value={titles.trending} onChange={v => updTitles({ trending: v })} />
          </Field>
          <Field label="Most Reviewed heading">
            <Input value={titles.mostReviewed} onChange={v => updTitles({ mostReviewed: v })} />
          </Field>
          <Field label="Collections heading">
            <Input value={titles.collections} onChange={v => updTitles({ collections: v })} />
          </Field>
        </div>
      </div>
    </div>
  )
}

// ── Tab: Features ─────────────────────────────────────────────────────────────

function FeaturesTab({ settings, update }: { settings: SiteSettings; update: (p: Partial<SiteSettings>) => void }) {
  const flags = settings.featureFlags
  const upd = (patch: Partial<FeatureFlags>) => update({ featureFlags: { ...flags, ...patch } })

  return (
    <div>
      <SectionTitle>Feature Flags — On/Off karo bina code chhue</SectionTitle>
      <div className="bg-gray-50 rounded-xl px-4 divide-y divide-gray-100">
        <Toggle value={flags.showFlashDeals}   onChange={v => upd({ showFlashDeals: v })}   label="Flash Deals section" hint="Homepage par countdown deals section" />
        <Toggle value={flags.showCollections}  onChange={v => upd({ showCollections: v })}  label="Collections section" hint="Homepage par curated collections grid" />
        <Toggle value={flags.showPriceHistory} onChange={v => upd({ showPriceHistory: v })} label="Price History chart"  hint="Product pages par 30-day price graph" />
        <Toggle value={flags.showCoupons}      onChange={v => upd({ showCoupons: v })}      label="Coupon Codes"         hint="Product pages par coupon cards" />
        <Toggle value={flags.showVideoReviews} onChange={v => upd({ showVideoReviews: v })} label="Video Reviews"        hint="Product pages par YouTube embeds" />
      </div>
    </div>
  )
}

// ── Tab: Legal & FAQ ──────────────────────────────────────────────────────────

function LegalTab({ settings, update }: { settings: SiteSettings; update: (p: Partial<SiteSettings>) => void }) {
  const faqs = settings.faqItems
  const updFaq = (i: number, patch: Partial<FaqItem>) =>
    update({ faqItems: faqs.map((f, idx) => idx === i ? { ...f, ...patch } : f) })
  const removeFaq = (i: number) => update({ faqItems: faqs.filter((_, idx) => idx !== i) })
  const addFaq = () => update({ faqItems: [...faqs, { question: '', answer: '' }] })

  return (
    <div className="space-y-8">
      <div>
        <SectionTitle>Terms of Service Content</SectionTitle>
        <p className="text-xs text-gray-400 mb-2">Plain text ya simple markdown. Khali chhodo toh default page dikhega.</p>
        <textarea
          rows={8}
          value={settings.termsContent}
          onChange={e => update({ termsContent: e.target.value })}
          placeholder="Yahan Terms of Service content likho..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition bg-white resize-none font-mono"
        />
      </div>

      <div>
        <SectionTitle>Privacy Policy Content</SectionTitle>
        <p className="text-xs text-gray-400 mb-2">Plain text ya simple markdown. Khali chhodo toh default page dikhega.</p>
        <textarea
          rows={8}
          value={settings.privacyContent}
          onChange={e => update({ privacyContent: e.target.value })}
          placeholder="Yahan Privacy Policy content likho..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition bg-white resize-none font-mono"
        />
      </div>

      <div>
        <SectionTitle>FAQ Items (/faq page par dikhenge)</SectionTitle>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-2">
                  <Input value={faq.question} onChange={v => updFaq(i, { question: v })} placeholder="Question..." />
                  <Input value={faq.answer}   onChange={v => updFaq(i, { answer: v })}   placeholder="Answer..." />
                </div>
                <RemoveBtn onClick={() => removeFaq(i)} />
              </div>
            </div>
          ))}
        </div>
        <AddButton onClick={addFaq} label="FAQ add karo" />
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SettingsForm({ initial }: { initial: SiteSettings }) {
  const [settings, setSettings] = useState<SiteSettings>(initial)
  const [activeTab, setActiveTab] = useState<TabId>('general')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const update = (patch: Partial<SiteSettings>) => setSettings(s => ({ ...s, ...patch }))

  async function save() {
    setSaving(true)
    setStatus('idle')
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      setStatus('success')
      setTimeout(() => setStatus('idle'), 4000)
    } catch (e: any) {
      setStatus('error')
      setErrorMsg(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content panel */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-6">
        {activeTab === 'general'       && <GeneralTab settings={settings} update={update} />}
        {activeTab === 'banners'       && <BannersTab banners={settings.banners} onChange={b => update({ banners: b })} />}
        {activeTab === 'categories'    && <CategoriesTab categories={settings.categories} onChange={c => update({ categories: c })} />}
        {activeTab === 'howItWorks'    && <HowItWorksTab steps={settings.howItWorks} onChange={s => update({ howItWorks: s })} />}
        {activeTab === 'footer'        && <FooterTab settings={settings} update={update} />}
        {activeTab === 'announcements' && <AnnouncementsTab settings={settings} update={update} />}
        {activeTab === 'features'      && <FeaturesTab settings={settings} update={update} />}
        {activeTab === 'legal'         && <LegalTab settings={settings} update={update} />}
      </div>

      {/* Save bar */}
      <div className="mt-6 flex items-center gap-4 flex-wrap">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold px-6 py-2.5 rounded-xl transition disabled:opacity-60"
        >
          {saving ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Settings
            </>
          )}
        </button>

        {status === 'success' && (
          <span className="flex items-center gap-1.5 text-green-600 text-sm font-semibold">
            <Check className="w-4 h-4" /> Saved! Changes are live on the site.
          </span>
        )}
        {status === 'error' && (
          <span className="flex items-center gap-1.5 text-red-600 text-sm font-semibold">
            <AlertCircle className="w-4 h-4" /> {errorMsg}
          </span>
        )}
      </div>
    </div>
  )
}
